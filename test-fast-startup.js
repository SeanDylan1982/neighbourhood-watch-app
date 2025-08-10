const { spawn } = require("child_process");

console.log("🧪 Testing fast startup...");

const startTime = Date.now();

// Set environment variables for testing
process.env.NODE_ENV = "production";
process.env.PORT = "5002"; // Use different port to avoid conflicts

const serverProcess = spawn("node", ["server/railway-start.js"], {
  stdio: "pipe",
  env: { ...process.env },
});

let serverStarted = false;

serverProcess.stdout.on("data", (data) => {
  const output = data.toString();
  console.log(`[SERVER] ${output.trim()}`);

  if (output.includes("Server running on port") && !serverStarted) {
    serverStarted = true;
    const startupTime = Date.now() - startTime;
    console.log(`\n✅ Server started in ${startupTime}ms`);

    // Test health check
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5002/api/health`);
        const data = await response.json();
        console.log("✅ Health check response:", data);

        console.log("\n🎉 Fast startup test successful!");
        serverProcess.kill();
        process.exit(0);
      } catch (error) {
        console.log("❌ Health check failed:", error.message);
        serverProcess.kill();
        process.exit(1);
      }
    }, 2000);
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

serverProcess.on("close", (code) => {
  if (!serverStarted) {
    console.log(`❌ Server failed to start (exit code: ${code})`);
    process.exit(1);
  }
});

// Timeout after 25 seconds (Railway has 30s timeout)
setTimeout(() => {
  if (!serverStarted) {
    console.log("❌ Server startup timeout (25s)");
    serverProcess.kill();
    process.exit(1);
  }
}, 25000);
