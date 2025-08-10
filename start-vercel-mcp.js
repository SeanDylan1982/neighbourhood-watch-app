import { spawn } from "child_process";
const child = spawn("npx", ["-y", "vercel-mcp", "start"], { stdio: "inherit" });

process.env.VERCEL_API_KEY = "KitBDZBw32Je2TlEXSdMzdmU";

child.on("close", (code) => process.exit(code));
