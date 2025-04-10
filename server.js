
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const ExcelJS = require('exceljs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, warehouseAttributes } = req.body;
    
    const systemMessage = {
      role: "system",
      content: `You are a warehouse configuration assistant. Help the user design their warehouse by collecting the following information: length, width, height, pallet type, storage capacity, and storage type. Current information gathered: ${JSON.stringify(warehouseAttributes)}. Ask for missing information one by one, confirming what you've understood. Be concise and friendly.`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 150
    });

    res.json({
      content: response.choices[0].message.content,
      usage: response.usage
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
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI API Key ${process.env.OPENAI_API_KEY ? 'is set' : 'is NOT set'}`);
});
