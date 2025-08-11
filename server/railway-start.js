#!/usr/bin/env node

/**
 * Railway-optimized startup script
 * Handles graceful startup with proper error handling for Railway deployment
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load environment variables
require("dotenv").config();

console.log("🚀 Starting Railway deployment...");
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Port: ${process.env.PORT || 5001}`);

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Basic middleware setup
app.use(helmet());
app.use(compression());

// CORS configuration for Railway
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow Vercel deployments
      if (origin.includes('vercel.app') || origin.includes('neighbourhood-watch-app')) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Allow Railway deployment
      if (origin.includes('railway.app')) {
        return callback(null, true);
      }

      // Allow all origins for deployment
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
      "Accept",
      "Origin"
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Basic health check for Railway - minimal response
app.get("/api/health", (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 5001,
      services: "minimal",
      railway: true,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// HEAD request for health check (Railway might use this)
app.head("/api/health", (req, res) => {
  res.status(200).end();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Neighbourhood Watch API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});

// Additional health check endpoints that Railway might check
app.get("/health", (req, res) => {
  res.redirect("/api/health");
});

app.get("/healthz", (req, res) => {
  res.redirect("/api/health");
});

app.get("/ping", (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Basic socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Railway server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Log successful startup
  console.log("✅ Basic Railway server is ready");
  console.log("🔄 Health check endpoint available at /api/health");
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});