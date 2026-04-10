require('dotenv').config();
const express = require('express');
const path = require('path');

const publicPath = path.resolve(__dirname, '../public');

console.log("STATIC PATH:", publicPath);
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
origin: [
  "http://localhost:5173",
  "https://clipgen-ai-clean.onrender.com"
],
methods: ["GET", "POST"],
credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/video/:jobId', express.static(path.join(__dirname, 'temp')));

// Static files from public/ build - BEFORE API routes
app.use(express.static(path.join(__dirname, 'public')));


// Debug logs - Render deployment test

console.log("🔥 SERVER.JS IS RUNNING");
console.log("Serving static from:", path.resolve(__dirname, '../public'));
console.log("Root static from:", path.resolve(__dirname, '../'));
console.log("SPA fallback:", path.resolve(__dirname, '../dist/index.html'));


// ===== API ROUTES FIRST =====
app.use('/api/video', require('./routes/video'));

// ===== FRONTEND STATIC SERVING AFTER APIs =====
app.use(express.static(path.join(__dirname, '../')));

// ===== SPA FALLBACK LAST =====

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

