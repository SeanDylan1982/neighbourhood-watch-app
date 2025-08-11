// Clean server startup file - CommonJS only
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { createServer } = require("http");
const { Server } = require("socket.io");

console.log('🚀 Starting clean server...');
console.log('📍 Node version:', process.version);
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

// Create Express app
const app = express();
const server = createServer(app);

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    message: 'Clean server running successfully'
  });
});

// Fallback health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Neibrly Server - Clean Mode',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Clean server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});