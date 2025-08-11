#!/usr/bin/env node

/**
 * Railway debug server - maximum logging and Railway-specific handling
 */

const http = require("http");

// Initialize server with dynamic import for ES module
async function initializeServer() {
  const { getPortConfig, logPortConfig, logPortError } = await import("./config/port.js");
  
  // Get standardized port configuration
  const portConfig = getPortConfig();
  const PORT = portConfig.port;

  console.log("🚀 Starting Railway debug server...");
  logPortConfig(portConfig);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`PWD: ${process.cwd()}`);
  console.log(`Railway vars:`, Object.keys(process.env).filter(k => k.includes('RAILWAY')));

  // Create server with maximum debugging
  const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    
    // Set comprehensive CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Cache-Control", "no-cache");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      console.log(`${timestamp} - Handling OPTIONS request`);
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Handle HEAD requests
    if (req.method === "HEAD") {
      console.log(`${timestamp} - Handling HEAD request`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end();
      return;
    }
    
    // Health check endpoints - multiple variations
    if (req.url === "/api/health" || req.url === "/health" || req.url === "/healthz" || req.url === "/ping") {
      console.log(`${timestamp} - Health check request to ${req.url}`);
      const healthData = {
        status: "ok",
        timestamp: timestamp,
        uptime: process.uptime(),
        port: PORT,
        portConfig: {
          source: portConfig.source,
          isRailwayManaged: portConfig.isRailwayManaged
        },
        railway: true,
        debug: true,
        method: req.method,
        url: req.url,
        headers: req.headers,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          PWD: process.cwd()
        }
      };
      
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "X-Health-Check": "ok"
      });
      res.end(JSON.stringify(healthData, null, 2));
      console.log(`${timestamp} - Health check response sent`);
      return;
    }
    
    // Root endpoint
    if (req.url === "/" || req.url === "") {
      console.log(`${timestamp} - Root request`);
      const rootData = {
        message: "Railway debug server",
        status: "running",
        timestamp: timestamp,
        port: PORT,
        uptime: process.uptime()
      };
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(rootData, null, 2));
      console.log(`${timestamp} - Root response sent`);
      return;
    }
    
    // 404 for everything else
    console.log(`${timestamp} - 404 for ${req.url}`);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Not found",
      path: req.url,
      timestamp: timestamp,
      available_endpoints: ["/api/health", "/health", "/healthz", "/ping", "/"]
    }, null, 2));
  });

  // Enhanced error handling with centralized port error logging
  server.on('error', (err) => {
    console.error(`${new Date().toISOString()} - Server error:`, err);
    logPortError(err, PORT);
    
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      console.error(`${new Date().toISOString()} - Exiting due to port binding failure`);
      process.exit(1);
    }
  });

  server.on('clientError', (err, socket) => {
    console.error(`${new Date().toISOString()} - Client error:`, err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  // Start server with comprehensive logging
  const host = process.env.HOST || "0.0.0.0";
  console.log(`🔧 Port configuration details:`);
  console.log(`   - Configured port: ${PORT}`);
  console.log(`   - Port source: ${portConfig.source}`);
  console.log(`   - Railway managed: ${portConfig.isRailwayManaged}`);
  console.log(`   - Environment PORT: ${process.env.PORT || 'undefined'}`);
  console.log(`Attempting to bind to ${host}:${PORT}...`);

  server.listen(PORT, host, () => {
    console.log(`✅ Railway debug server running on ${host}:${PORT}`);
    console.log(`🔗 Health check: http://${host}:${PORT}/api/health`);
    console.log(`🔗 Alternative health checks: /health, /healthz, /ping`);
    console.log("🎯 Ready for Railway health checks");
    
    if (portConfig.isRailwayManaged) {
      console.log("🚂 Successfully bound to Railway-assigned port");
    } else {
      console.log("🏠 Running on default port for local development");
    }
    
    // Perform self-health check
    setTimeout(() => {
      console.log("🔍 Performing self-health check...");
      const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
        console.log(`✅ Self-health check: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`Self-health response: ${data.substring(0, 100)}...`);
        });
      });
      req.on('error', (err) => {
        console.log(`❌ Self-health check failed: ${err.message}`);
      });
      req.setTimeout(5000, () => {
        console.log(`⏰ Self-health check timeout`);
        req.destroy();
      });
    }, 2000);
  });

  // Graceful shutdown with logging
  const shutdown = (signal) => {
    console.log(`${new Date().toISOString()} - Received ${signal}, shutting down gracefully...`);
    console.log(`${new Date().toISOString()} - Server was running on port ${PORT} (${portConfig.source})`);
    server.close(() => {
      console.log(`${new Date().toISOString()} - Server closed`);
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.log(`${new Date().toISOString()} - Force exit`);
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions with logging
  process.on('uncaughtException', (err) => {
    console.error(`${new Date().toISOString()} - Uncaught Exception:`, err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`${new Date().toISOString()} - Unhandled Rejection at:`, promise, 'reason:', reason);
    process.exit(1);
  });

  // Log startup completion
  console.log(`${new Date().toISOString()} - Server initialization complete`);
}

// Start the server
initializeServer().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});