#!/usr/bin/env node

/**
 * Ultra-minimal Railway server - Absolute bare minimum for health checks
 * This is the most basic Express server possible for Railway deployment
 */

console.log("🚀 Starting ultra-minimal Railway server...");

const express = require("express");
const PORT = process.env.PORT || 5001;

console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Port: ${PORT}`);

const app = express();

// Basic JSON parsing
app.use(express.json());

// Health check - Railway's primary requirement
app.get("/api/health", (req, res) => {
  console.log("Health check requested");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    railway: true
  });
});

// Root endpoint
app.get("/", (req, res) => {
  console.log("Root endpoint requested");
  res.json({
    message: "Railway Ultra-Minimal Server",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes
app.use((req, res) => {
  console.log(`404 for: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not found",
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Ultra-minimal server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log("🎯 Ready for Railway health checks");
});

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});