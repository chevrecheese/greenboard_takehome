const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure archives directory exists
const archivesDir = path.join(__dirname, '../archives');
fs.ensureDirSync(archivesDir);

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Web Archiver Backend running on port ${PORT}`);
  console.log(`📁 Archives stored in: ${archivesDir}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
