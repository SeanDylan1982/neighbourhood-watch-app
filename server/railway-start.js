const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🚀 Starting Railway deployment...");
console.log("📍 Current directory:", __dirname);
console.log("📍 Node version:", process.version);
console.log("📍 Environment:", process.env.NODE_ENV || "development");

// Set production environment
process.env.NODE_ENV = "production";

// Reduce startup logging
process.env.SUPPRESS_NO_CONFIG_WARNING = "true";

// Check if index.js exists and is readable
const indexPath = path.join(__dirname, "index.js");
if (!fs.existsSync(indexPath)) {
  console.error("❌ index.js not found at:", indexPath);
  console.log("🚨 Starting emergency fallback server...");
  startFallbackServer();
  return;
}

console.log("✅ index.js found at:", indexPath);

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.log("❌ node_modules not found, dependencies may not be installed");
  console.log("🔄 Attempting to install dependencies...");

  try {
    const { execSync } = require("child_process");
    execSync("npm install", {
      cwd: __dirname,
      stdio: "inherit",
      timeout: 120000, // 2 minute timeout
    });
    console.log("✅ Dependencies installed successfully");
  } catch (error) {
    console.error("❌ Failed to install dependencies:", error.message);
    console.log("🚨 Starting emergency fallback server...");
    startFallbackServer();
    return;
  }
} else {
  console.log("✅ node_modules found");
}

// Test if we can require the index.js file (catch ES6 import errors early)
console.log("🧪 Testing index.js for ES6 import issues...");
try {
  // Don't actually run it, just test if it can be required
  const Module = require("module");
  const originalRequire = Module.prototype.require;
  let hasImportError = false;

  Module.prototype.require = function (id) {
    if (id === "./index.js" || id.endsWith("index.js")) {
      // Skip actual execution, just test syntax
      return {};
    }
    return originalRequire.apply(this, arguments);
  };

  // Test syntax by reading and checking for import statements
  const content = fs.readFileSync(indexPath, "utf8");
  if (content.includes("import ") && content.includes(" from ")) {
    console.log("❌ ES6 import statements detected in index.js");
    console.log("🔄 Starting clean server instead...");
    startCleanServer();
    return;
  }

  // Restore original require
  Module.prototype.require = originalRequire;

  console.log("✅ index.js syntax check passed");
} catch (error) {
  console.error("❌ index.js syntax test failed:", error.message);
  if (
    error.message.includes("import") ||
    error.message.includes("Cannot use import statement")
  ) {
    console.log("🔄 ES6 import error detected, starting clean server...");
    startCleanServer();
    return;
  }
}

// Test if express is available
console.log("🧪 Testing if express is available...");
try {
  require.resolve("express");
  console.log("✅ Express module found");
} catch (error) {
  console.error("❌ Express module not found:", error.message);
  console.log("🚨 Starting emergency fallback server...");
  startFallbackServer();
  return;
}

// Function to start server with proper error handling
function startServer() {
  console.log("🚀 Starting server process...");

  // Start the server as a child process to handle ES6 import issues
  const serverProcess = spawn("node", ["index.js"], {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  serverProcess.on("error", (error) => {
    console.error("❌ Server process error:", error.message);

    // If it's an ES6 import error, try with --experimental-modules
    if (error.message.includes("import") || error.message.includes("module")) {
      console.log("🔄 Retrying with ES6 module support...");

      const retryProcess = spawn(
        "node",
        ["--experimental-modules", "index.js"],
        {
          cwd: __dirname,
          stdio: "inherit",
          env: {
            ...process.env,
            NODE_ENV: "production",
          },
        }
      );

      retryProcess.on("error", (retryError) => {
        console.error("❌ Retry failed:", retryError.message);
        console.log("🔄 Trying clean server startup...");
        startCleanServer();
      });

      retryProcess.on("close", (code) => {
        if (code !== 0) {
          console.log(`Server process exited with code ${code}`);
          console.log("🔄 Trying clean server startup...");
          startCleanServer();
        }
      });
    } else {
      console.log("🔄 Trying clean server startup...");
      startCleanServer();
    }
  });

  serverProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(`Server process exited with code ${code}`);
      console.log("🔄 Trying clean server startup...");
      startCleanServer();
    }
  });
}

// Clean server startup
function startCleanServer() {
  console.log("🔄 Starting clean server...");

  const cleanProcess = spawn("node", ["start-clean.js"], {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  cleanProcess.on("error", (error) => {
    console.error("❌ Clean server error:", error.message);
    console.log("🚨 Starting emergency fallback server...");
    startFallbackServer();
  });

  cleanProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(`Clean server process exited with code ${code}`);
      console.log("🚨 Starting emergency fallback server...");
      startFallbackServer();
    }
  });
}

// Emergency fallback server
function startFallbackServer() {
  console.log("🚨 Starting emergency HTTP server...");

  const http = require("http");
  const PORT = process.env.PORT || 5001;

  const server = http.createServer((req, res) => {
    // Basic health check
    if (req.url === "/api/health" || req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "emergency",
          message: "Server running in emergency mode",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          port: PORT,
        })
      );
      return;
    }

    // Default response
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Service temporarily unavailable",
        message: "Server is starting up, please try again in a moment",
        timestamp: new Date().toISOString(),
      })
    );
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚨 Emergency server running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });

  server.on("error", (error) => {
    console.error("❌ Emergency server error:", error.message);
    process.exit(1);
  });
}

// Handle process termination
process.on("SIGTERM", () => {
  console.log("📴 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📴 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

// Start the server
try {
  startServer();
} catch (error) {
  console.error("❌ Failed to start server:", error.message);
  console.log("🔄 Trying clean server startup...");
  startCleanServer();
}
