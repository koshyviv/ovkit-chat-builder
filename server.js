import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

// Calculate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define Zod schema for warehouse data extraction
const WarehouseDataSchema = z.object({
  length: z.number().describe("Length of the warehouse in meters"),
  width: z.number().describe("Width of the warehouse in meters"),
  height: z.number().describe("Height of the warehouse in meters"),
  pallet_type: z.string().describe("Type of pallet used (e.g., 'euro', 'standard')"),
  capacity: z.number().describe("Storage capacity in number of pallets"),
  storage_type: z.string().describe("Type of storage system (e.g., 'asrs', 'selective racking')")
});

// Define the mapping for Excel updates
const EXCEL_MAPPING = {
  length: { sheet: 'Sheet1', cell: 'A3' },
  width: { sheet: 'Sheet1', cell: 'A6' },
  height: { sheet: 'Sheet1', cell: 'A9' },
  pallet_type: { sheet: 'Sheet1', cell: 'C21' },
  capacity: { sheet: 'Sheet1', cell: 'C9' },
  // storage_type: { sheet: 'Sheet1', cell: 'C7' },
  // Add more mappings as needed
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const configFilePath = path.join(dataDir, 'warehouse-config.json');
const excelFilePath = path.join(dataDir, 'warehouse-data.xlsx');

console.log('Setting up route: GET /api/warehouse-config');
// API Endpoints for warehouse configuration
app.get('/api/warehouse-config', (req, res) => {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({ message: 'No configuration found' });
    }
  } catch (error) {
    console.error('Error reading configuration:', error);
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

console.log('Setting up route: POST /api/warehouse-config');
app.post('/api/warehouse-config', (req, res) => {
  try {
    const config = req.body;
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// API Endpoint for OpenAI chat completion
console.log('Setting up route: POST /api/chat');
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, warehouseAttributes } = req.body;
    
    const systemMessage = {
      role: "system",
      content: "You are a warehouse configuration assistant. " +
      "Help the user design their warehouse by collecting the following information: length, width, height, pallet type, storage capacity, and storage type. " +
      "Current information gathered: " + JSON.stringify(warehouseAttributes) + ". " +
      "Ask for missing information one by one, confirming what you've understood. Be concise and friendly." + 
      "if the user provides a number assume it is in meters, unless they specify otherwise." +
      "you are expert in warehouse design and storage systems, so provide subtle positive comments as you move ahead into the next question." +
      "IMPORTANT: Once all information is received add '#completed' to the end of your response."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 150
    });

    let responseContent = response.choices[0].message.content;
    let parsedData = null;

    if (responseContent && responseContent.includes('#completed')) {
      console.log("Detected #completed flag. Attempting structured data extraction...");
      // Remove the flag before parsing
      const contentToParse = responseContent.replace('#completed', '').trim();

      try {
        // Add a small delay or retry mechanism if needed, but try direct parse first
        const extraction = await openai.beta.chat.completions.parse({
          model: "gpt-4o-mini", // Or "gpt-4o-2024-08-06" if mini doesn't support parse well
          messages: [
            { role: "system", content: "You are an expert at structured data extraction. Extract the warehouse configuration details from the provided text into the specified JSON format." },
            { role: "user", content: contentToParse }, // Use the original content without the flag
          ],
          response_format: zodResponseFormat(WarehouseDataSchema, "warehouse_data_extraction"),
        });

        if (extraction.choices[0]?.message?.parsed) {
            parsedData = extraction.choices[0].message.parsed;
            console.log("Successfully parsed structured data:", parsedData);
            // Optionally, you might want to adjust the responseContent sent to the UI
            // responseContent = "Configuration complete. Details extracted."; 
        } else {
             console.error("Failed to parse structured data, 'parsed' field missing in response.");
             // Decide how to handle this - send original content? Send an error?
             // For now, we'll proceed without parsed data but log the issue.
        }

        // --- Write to Excel Template (if data was parsed) ---
        if (parsedData) {
          await updateExcelTemplate(parsedData); // Uncomment this line to enable Excel writing
          // console.log("Excel template update skipped (currently commented out).");
        }
        // ----------------------------------------------------

      } catch (parseError) {
        console.error('Error during structured data extraction:', parseError);
        // Decide how to handle: fall back to sending original content, send specific error, etc.
        // For now, log the error and proceed without parsed data.
        // Consider sending a specific message to the UI indicating parsing failure.
      }
    }

    // Send response back to client
    res.json({
      content: responseContent, // Send original content (or modified if desired)
      usage: response.usage,
      parsed: parsedData // Will be null if parsing didn't happen or failed
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ 
      error: 'Failed to get response from OpenAI',
      details: error.message
    });
  }
});

// API Endpoint for generating Excel file
console.log('Setting up route: POST /api/generate-excel');
app.post('/api/generate-excel', async (req, res) => {
  try {
    const warehouseData = req.body;
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Warehouse Layout Generator';
    workbook.lastModifiedBy = 'Warehouse Layout Generator';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add a worksheet
    const worksheet = workbook.addWorksheet('Warehouse Configuration');
    
    // Add column headers
    worksheet.columns = [
      { header: 'Attribute', key: 'attribute', width: 20 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Unit', key: 'unit', width: 10 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add data rows
    worksheet.addRow({ attribute: 'Length', value: warehouseData.length, unit: 'meters' });
    worksheet.addRow({ attribute: 'Width', value: warehouseData.width, unit: 'meters' });
    worksheet.addRow({ attribute: 'Height', value: warehouseData.height, unit: 'meters' });
    worksheet.addRow({ attribute: 'Pallet Type', value: warehouseData.palletType, unit: '' });
    worksheet.addRow({ attribute: 'Storage Capacity', value: warehouseData.storage, unit: 'pallets' });
    worksheet.addRow({ attribute: 'Storage Type', value: warehouseData.storageType, unit: '' });
    
    // Add timestamp
    worksheet.addRow({ attribute: 'Generated on', value: new Date().toLocaleString(), unit: '' });
    
    // Save the Excel file
    await workbook.xlsx.writeFile(excelFilePath);
    
    res.json({ 
      message: 'Excel file generated successfully',
      filePath: excelFilePath
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ 
      error: 'Failed to generate Excel file',
      details: error.message
    });
  }
});

// API Endpoint for downloading the Excel file
console.log('Setting up route: GET /api/download-excel');
app.get('/api/download-excel', (req, res) => {
  try {
    if (fs.existsSync(excelFilePath)) {
      res.download(excelFilePath, 'warehouse-data.xlsx');
    } else {
      res.status(404).json({ error: 'Excel file not found' });
    }
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    res.status(500).json({ error: 'Failed to download Excel file' });
  }
});

// Serve static files from the React app
console.log('Setting up static file serving from:', path.join(__dirname, 'dist'));
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
console.log('Setting up catchall route handler');
// Instead of app.get('/*', ...) which might be causing issues with path-to-regexp
app.use((req, res, next) => {
  console.log(`Handling request for ${req.path}`);
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Send the React index.html for all other routes
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Function to update the Excel template file
async function updateExcelTemplate(data) {
  const templatePath = process.env.EXCEL_TEMPLATE_PATH;
  if (!templatePath) {
    console.warn('EXCEL_TEMPLATE_PATH environment variable not set. Skipping Excel update.');
    return;
  }

  if (!fs.existsSync(templatePath)) {
    console.error(`Excel template file not found at: ${templatePath}. Skipping update.`);
    return;
  }

  console.log(`Attempting to update Excel template: ${templatePath}`);
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(templatePath);

    for (const key in data) {
      if (data.hasOwnProperty(key) && EXCEL_MAPPING[key]) {
        const mapping = EXCEL_MAPPING[key];
        const worksheet = workbook.getWorksheet(mapping.sheet);
        if (worksheet) {
          const cell = worksheet.getCell(mapping.cell);
          cell.value = data[key];
          console.log(`Updated sheet '${mapping.sheet}', cell '${mapping.cell}' with value: ${data[key]}`);
        } else {
          console.warn(`Sheet '${mapping.sheet}' not found in the template. Skipping update for key '${key}'.`);
        }
      } else if (data.hasOwnProperty(key)) {
          console.warn(`No mapping found for data key '${key}'. Skipping update for this key.`);
      }
    }

    await workbook.xlsx.writeFile(templatePath);
    console.log(`Successfully updated Excel template: ${templatePath}`);

  } catch (error) {
    console.error(`Error updating Excel template file at ${templatePath}:`, error);
    // Depending on requirements, you might want to throw the error
    // or handle it more gracefully (e.g., log and continue)
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI API Key ${process.env.OPENAI_API_KEY ? 'is set' : 'is NOT set'}`);
});
