
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const configFilePath = path.join(dataDir, 'warehouse-config.json');

// API Endpoints
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
