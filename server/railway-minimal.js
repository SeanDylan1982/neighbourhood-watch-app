#!/usr/bin/env node

/**
 * Ultra-minimal Railway startup script
 * Only includes the absolute essentials for Railway health checks
 */

const express = require("express");
const { createServer } = require("http");

// Load environment variables
require("dotenv").config();

const PORT = process.env.PORT || 5001;

console.log("🚀 Starting minimal Railway server...");
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Port: ${PORT}`);

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json({ limit: "10mb" }));

// CORS headers for all requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check endpoint - Railway's primary requirement
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    railway: true
  });
});

// Alternative health check paths
app.get("/health", (req, res) => res.redirect("/api/health"));
app.get("/healthz", (req, res) => res.redirect("/api/health"));
app.head("/api/health", (req, res) => res.status(200).end());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Neighbourhood Watch API - Railway Deployment",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Minimal Railway server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log("🎯 Server is ready for Railway health checks");
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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});