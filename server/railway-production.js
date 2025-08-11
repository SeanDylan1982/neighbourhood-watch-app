--- c:/code/neighbourhood-watch-app/server/railway-production.js
+++ c:/code/neighbourhood-watch-app/server/railway-production.js
@@ -0,0 +1,511 @@
+#!/usr/bin/env node
+
+/**
+ * Railway Production Server
+ * Full-featured server optimized for Railway deployment
+ * Includes all application routes with Railway-specific optimizations
+ */
+
+const express = require("express");
+const cors = require("cors");
+const helmet = require("helmet");
+const compression = require("compression");
+const { createServer } = require("http");
+const { Server } = require("socket.io");
+const path = require("path");
+
+// Load environment variables
+require("dotenv").config();
+
+console.log("🚀 Starting Railway Production Server...");
+console.log(`Environment: ${process.env.NODE_ENV || "production"}`);
+console.log(`Port: ${process.env.PORT || 5001}`);
+
+// Database connection
+const connectDB = require("./config/database");
+const { dbService } = require("./config/database");
+
+// Services
+const RealTimeService = require("./services/RealTimeService");
+const HealthCheckService = require("./services/HealthCheckService");
+const DatabaseRecoveryManager = require("./services/DatabaseRecoveryManager");
+
+// Routes
+const authRoutes = require("./routes/auth");
+const userRoutes = require("./routes/users");
+const neighbourhoodRoutes = require("./routes/neighbourhoods");
+const chatRoutes = require("./routes/chat");
+const noticeRoutes = require("./routes/notices");
+const reportRoutes = require("./routes/reports");
+const statisticsRoutes = require("./routes/statistics");
+const uploadRoutes = require("./routes/upload");
+const friendRoutes = require("./routes/friends");
+const privateChatRoutes = require("./routes/privateChat");
+const settingsRoutes = require("./routes/settings");
+const adminRoutes = require("./routes/admin");
+const moderationRoutes = require("./routes/moderation");
+const healthRoutes = require("./routes/health");
+const databaseMetricsRoutes = require("./routes/database-metrics");
+const rateLimitStatusRoutes = require("./routes/rate-limit-status");
+const searchRoutes = require("./routes/search");
+const notificationRoutes = require("./routes/notifications");
+const termsRoutes = require("./routes/terms");
+const legalRoutes = require("./routes/legal");
+
+// Middleware
+const { authenticateToken } = require("./middleware/auth");
+const { requireActiveUser } = require("./middleware/adminAuth");
+const { setupSocketHandlers } = require("./socket/handlers");
+const {
+  globalErrorHandler,
+  timeoutHandler,
+  databaseErrorHandler,
+  validationErrorHandler,
+  notFoundHandler,
+} = require("./middleware/errorHandling");
+
+// Initialize services
+let dbConnection = null;
+let healthCheckService = null;
+let recoveryManager = null;
+let realTimeService = null;
+
+// Create Express app and HTTP server
+const app = express();
+const server = createServer(app);
+
+// Socket.io configuration with Railway-optimized CORS
+const io = new Server(server, {
+  cors: {
+    origin: [
+      process.env.CLIENT_URL || "https://neighbourhood-watch-app.vercel.app",
+      "https://neighbourhood-watch-app.vercel.app",
+      "https://neighbourhood-watch-app-sean-pattersons-projects-5128ccfa.vercel.app",
+      // Railway domains
+      /^https:\/\/.*\.railway\.app$/,
+      // Vercel domains
+      /^https:\/\/neighbourhood-watch-app.*\.vercel\.app$/,
+    ],
+    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
+    allowedHeaders: [
+      "Content-Type",
+      "Authorization",
+      "X-Requested-With",
+      "Access-Control-Allow-Origin",
+    ],
+    credentials: true,
+  },
+});
+
+// Security middleware
+app.use(helmet({
+  contentSecurityPolicy: false, // Disable CSP for Railway compatibility
+  crossOriginEmbedderPolicy: false
+}));
+app.use(compression());
+
+// CORS configuration optimized for Railway
+app.use(
+  cors({
+    origin: function (origin, callback) {
+      // Allow requests with no origin (like mobile apps or curl requests)
+      if (!origin) return callback(null, true);
+
+      // Allow Railway deployments
+      if (origin.includes("railway.app")) {
+        return callback(null, true);
+      }
+
+      // Allow Vercel deployments
+      if (
+        origin.includes("vercel.app") ||
+        origin.includes("neighbourhood-watch-app")
+      ) {
+        return callback(null, true);
+      }
+
+      // Allow localhost for development
+      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
+        return callback(null, true);
+      }
+
+      // Allow all origins in production for Railway
+      return callback(null, true);
+    },
+    credentials: true,
+    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
+    allowedHeaders: [
+      "Content-Type",
+      "Authorization",
+      "X-Requested-With",
+      "Access-Control-Allow-Origin",
+      "Accept",
+      "Origin",
+    ],
+    exposedHeaders: [
+      "Authorization",
+      "Content-Type",
+      "X-Requested-With",
+      "Access-Control-Allow-Origin",
+    ],
+    optionsSuccessStatus: 200,
+    preflightContinue: false,
+  })
+);
+
+// Body parsing
+app.use(express.json({ limit: "10mb" }));
+app.use(express.urlencoded({ extended: true, limit: "10mb" }));
+
+// Serve static files (uploads)
+app.use("/uploads", express.static(path.join(__dirname, "uploads")));
+
+// Serve client build files if they exist
+const clientBuildPath = path.join(__dirname, "public");
+if (require("fs").existsSync(clientBuildPath)) {
+  app.use(express.static(clientBuildPath));
+  console.log("✅ Serving client build files from /public");
+}
+
+// Global middleware
+app.use(timeoutHandler(30000)); // 30 second timeout for Railway
+app.use(databaseErrorHandler);
+
+// Simple health check for Railway (before authentication)
+app.get("/api/health", (req, res) => {
+  const healthData = {
+    status: "ok",
+    timestamp: new Date().toISOString(),
+    uptime: process.uptime(),
+    environment: process.env.NODE_ENV || "production",
+    port: process.env.PORT || 5001,
+    services: {
+      database: dbConnection ? "connected" : "disconnected",
+      healthCheck: healthCheckService ? "running" : "stopped",
+      realTime: realTimeService ? "initialized" : "not initialized"
+    },
+    railway: true,
+    version: "production"
+  };
+  
+  res.status(200).json(healthData);
+});
+
+// Root endpoint - serve client app or API info
+app.get("/", (req, res) => {
+  const clientIndexPath = path.join(__dirname, "public", "index.html");
+  
+  if (require("fs").existsSync(clientIndexPath)) {
+    res.sendFile(clientIndexPath);
+  } else {
+    res.json({
+      message: "Neighbourhood Watch API",
+      status: "running",
+      timestamp: new Date().toISOString(),
+      version: "1.0.0",
+      endpoints: {
+        health: "/api/health",
+        auth: "/api/auth",
+        statistics: "/api/statistics/dashboard"
+      }
+    });
+  }
+});
+
+// API Routes with authentication
+app.use("/api/auth", authRoutes);
+app.use("/api/users", authenticateToken, requireActiveUser, userRoutes);
+app.use("/api/neighbourhoods", authenticateToken, requireActiveUser, neighbourhoodRoutes);
+app.use("/api/chat", authenticateToken, requireActiveUser, chatRoutes);
+app.use("/api/notices", authenticateToken, requireActiveUser, noticeRoutes);
+app.use("/api/reports", authenticateToken, requireActiveUser, reportRoutes);
+app.use("/api/statistics", authenticateToken, requireActiveUser, statisticsRoutes);
+app.use("/api/upload", authenticateToken, requireActiveUser, uploadRoutes);
+app.use("/api/friends", authenticateToken, requireActiveUser, friendRoutes);
+app.use("/api/private-chat", authenticateToken, requireActiveUser, privateChatRoutes);
+app.use("/api/settings", authenticateToken, requireActiveUser, settingsRoutes);
+app.use("/api/search", authenticateToken, requireActiveUser, searchRoutes);
+app.use("/api/notifications", authenticateToken, requireActiveUser, notificationRoutes);
+app.use("/api/terms", termsRoutes);
+app.use("/api/legal", legalRoutes);
+app.use("/api/admin", adminRoutes);
+app.use("/api/moderation", moderationRoutes);
+
+// Detailed health check routes
+app.use("/api/health", healthRoutes);
+app.use("/api/database-metrics", databaseMetricsRoutes);
+app.use("/api/rate-limit", rateLimitStatusRoutes);
+
+// Change streams status endpoint
+app.get("/api/health/change-streams", authenticateToken, (req, res) => {
+  if (!realTimeService) {
+    return res.status(503).json({
+      status: "unavailable",
+      message: "Real-time service not initialized",
+    });
+  }
+
+  const status = realTimeService.getStatus();
+  res.json({
+    status: "available",
+    initialized: status.initialized,
+    activeStreams: status.changeStreams.activeStreams,
+    collections: status.changeStreams.collections,
+  });
+});
+
+// Make io instance available to routes
+app.set("io", io);
+
+// Socket.io setup
+setupSocketHandlers(io);
+
+/**
+ * Initialize services with Railway-optimized timeouts
+ */
+async function initializeServices() {
+  console.log("🔧 Initializing services for Railway...");
+
+  try {
+    // Step 1: Connect to MongoDB with Railway timeout
+    console.log("📡 Connecting to MongoDB...");
+    dbConnection = await Promise.race([
+      connectDB(),
+      new Promise((_, reject) =>
+        setTimeout(() => reject(new Error("MongoDB connection timeout")), 20000)
+      ),
+    ]);
+    console.log("✅ MongoDB connection established");
+
+    // Make database service available to routes
+    app.set("dbService", dbService);
+
+    // Initialize other services in background
+    setImmediate(async () => {
+      try {
+        console.log("🔧 Initializing background services...");
+
+        // Health check service
+        healthCheckService = new HealthCheckService(dbService, {
+          checkIntervalMs: 60000, // 1 minute for Railway
+          unhealthyThreshold: 3,
+          alertThreshold: 5,
+          latencyThresholdMs: 1000, // Higher threshold for Railway
+          criticalLatencyMs: 5000,
+          maxErrorRate: 0.2, // More lenient for Railway
+          enableAlerts: false, // Disable alerts in Railway
+        });
+
+        healthCheckService.start();
+        app.set("healthCheckService", healthCheckService);
+        console.log("✅ Health check service initialized");
+
+        // Recovery manager
+        recoveryManager = new DatabaseRecoveryManager(dbService, healthCheckService, {
+          circuitBreakerFailureThreshold: 10, // More lenient for Railway
+          circuitBreakerResetTimeout: 60000, // 1 minute
+          maxRecoveryAttempts: 5,
+          recoveryBackoffMs: 10000, // 10 seconds
+          enableCircuitBreaker: true,
+          enableGracefulDegradation: true,
+        });
+
+        app.set("recoveryManager", recoveryManager);
+        console.log("✅ Database recovery manager initialized");
+
+        // Real-time service
+        realTimeService = new RealTimeService(io, {
+          collections: ["messages", "reports", "notices", "chatgroups", "privatechats"],
+          maxRetries: 5, // Reduced for Railway
+          initialDelayMs: 2000,
+          maxDelayMs: 30000,
+        });
+
+        await realTimeService.initialize();
+        app.set("realTimeService", realTimeService);
+        console.log("✅ Real-time service initialized");
+
+        console.log("🎉 All background services initialized successfully");
+      } catch (error) {
+        console.error("⚠️ Background service initialization failed:", error);
+        // Server continues to run with basic functionality
+      }
+    });
+
+    return true;
+  } catch (error) {
+    console.error("❌ Failed to initialize essential services:", error);
+    return false;
+  }
+}
+
+/**
+ * Clean up services during shutdown
+ */
+async function cleanupServices() {
+  console.log("🧹 Cleaning up services...");
+
+  if (healthCheckService) {
+    try {
+      healthCheckService.stop();
+      console.log("✅ Health check service stopped");
+    } catch (error) {
+      console.error("❌ Error stopping health check service:", error);
+    }
+  }
+
+  if (realTimeService) {
+    try {
+      await realTimeService.close();
+      console.log("✅ Real-time service closed");
+    } catch (error) {
+      console.error("❌ Error closing real-time service:", error);
+    }
+  }
+
+  if (dbService && dbService.isConnected) {
+    try {
+      await dbService.disconnect();
+      console.log("✅ Database connection closed");
+    } catch (error) {
+      console.error("❌ Error closing database connection:", error);
+    }
+  }
+}
+
+/**
+ * Handle graceful shutdown
+ */
+const gracefulShutdown = async (signal) => {
+  console.log(`🛑 Received ${signal}, shutting down gracefully...`);
+
+  // Clean up all services
+  await cleanupServices();
+
+  // Close server
+  server.close(() => {
+    console.log("✅ HTTP server closed");
+    process.exit(0);
+  });
+
+  // Force exit after timeout
+  setTimeout(() => {
+    console.error("⏰ Could not close connections in time, forcefully shutting down");
+    process.exit(1);
+  }, 15000); // 15 seconds for Railway
+};
+
+// Listen for termination signals
+process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
+process.on("SIGINT", () => gracefulShutdown("SIGINT"));
+
+// Error handling middleware
+app.use(validationErrorHandler);
+
+// Catch-all for client-side routing (SPA support)
+app.get("*", (req, res) => {
+  const clientIndexPath = path.join(__dirname, "public", "index.html");
+  
+  if (require("fs").existsSync(clientIndexPath)) {
+    res.sendFile(clientIndexPath);
+  } else {
+    res.status(404).json({
+      error: "Route not found",
+      path: req.path,
+      timestamp: new Date().toISOString(),
+      availableEndpoints: [
+        "/api/health",
+        "/api/auth",
+        "/api/statistics/dashboard"
+      ]
+    });
+  }
+});
+
+// Global error handling middleware (must be last)
+app.use(globalErrorHandler);
+
+const PORT = process.env.PORT || 5001;
+
+// Start the server with Railway-optimized initialization
+(async () => {
+  try {
+    console.log(`🚀 Starting server on port ${PORT}...`);
+
+    // Start HTTP server immediately for Railway health checks
+    server.listen(PORT, "0.0.0.0", async () => {
+      console.log(`✅ Railway Production Server running on port ${PORT}`);
+      console.log(`🌍 Environment: ${process.env.NODE_ENV || "production"}`);
+      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
+      console.log(`🏠 Application: http://0.0.0.0:${PORT}/`);
+
+      // Initialize services after server is listening
+      try {
+        const initialized = await initializeServices();
+        if (initialized) {
+          console.log("🎉 Essential services initialized - Server ready!");
+        } else {
+          console.warn("⚠️ Running in degraded mode - some services failed to initialize");
+        }
+      } catch (error) {
+        console.error("⚠️ Service initialization error:", error.message);
+        console.log("🔄 Server continues in basic mode");
+      }
+    });
+
+    // Handle server errors
+    server.on('error', (err) => {
+      console.error("❌ Server error:", err);
+      if (err.code === 'EADDRINUSE') {
+        console.error(`❌ Port ${PORT} is already in use`);
+        process.exit(1);
+      }
+    });
+
+  } catch (error) {
+    console.error("❌ Fatal server startup error:", error);
+
+    // Emergency fallback server for Railway health checks
+    const express = require("express");
+    const cors = require("cors");
+    const minimalApp = express();
+
+    minimalApp.use(cors({ origin: true, credentials: true }));
+    minimalApp.use(express.json());
+
+    minimalApp.get("/api/health", (req, res) => {
+      res.json({
+        status: "emergency",
+        message: "Server running in emergency mode",
+        timestamp: new Date().toISOString(),
+        uptime: process.uptime(),
+        error: error.message
+      });
+    });
+
+    minimalApp.get("/", (req, res) => {
+      res.json({
+        status: "emergency",
+        message: "Application temporarily unavailable",
+        timestamp: new Date().toISOString()
+      });
+    });
+
+    minimalApp.listen(PORT, "0.0.0.0", () => {
+      console.log(`🚨 Emergency server running on port ${PORT}`);
+    });
+  }
+})();
+
+// Handle uncaught exceptions
+process.on('uncaughtException', (err) => {
+  console.error('💥 Uncaught Exception:', err);
+  gracefulShutdown('uncaughtException');
+});
+
+process.on('unhandledRejection', (reason, promise) => {
+  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
+  gracefulShutdown('unhandledRejection');
+});
+
+console.log("🎯 Railway Production Server initialization complete");