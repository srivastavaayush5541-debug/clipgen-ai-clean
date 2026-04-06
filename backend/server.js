require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/video/:jobId', express.static(path.join(__dirname, 'temp')));

// ===== FRONTEND STATIC SERVING =====
app.use(express.static(path.join(__dirname, '../'))); // Serve Vite build/public

// Debug logs - Render deployment test
console.log("🔥 SERVER.JS IS RUNNING");

// ===== API ROUTES FIRST =====
app.use('/api/video', require('./routes/video'));

// ===== FRONTEND STATIC SERVING AFTER APIs =====
app.use(express.static(path.join(__dirname, '../')));

// ===== SPA FALLBACK LAST =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Single 404 handler at the END - AFTER all routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ClipGen AI Backend running on port ${PORT}`);
  console.log(`📹 Video API: POST /api/video/generate-video`);
  console.log(`🔍 Health: GET /`);
  console.log(`📁 Videos served from /video/:jobId`);
});


module.exports = app;

