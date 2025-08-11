// Diagnostic script to find ES6 import issues
const fs = require("fs");
const path = require("path");

console.log("🔍 Diagnosing ES6 import issues...");
console.log("📍 Current directory:", __dirname);

// Function to check file for ES6 imports
function checkFileForImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const imports = [];

    lines.forEach((line, index) => {
      if (line.trim().startsWith("import ") && line.includes(" from ")) {
        imports.push({
          line: index + 1,
          content: line.trim(),
        });
      }
    });

    return imports;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Check main files
const filesToCheck = ["index.js", "railway-start.js", "start-clean.js"];

console.log("\n📋 Checking main server files for ES6 imports:");
filesToCheck.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const imports = checkFileForImports(filePath);
    if (imports.length > 0) {
      console.log(`❌ ${file} has ES6 imports:`);
      imports.forEach((imp) => {
        console.log(`   Line ${imp.line}: ${imp.content}`);
      });
    } else {
      console.log(`✅ ${file} - No ES6 imports found`);
    }
  } else {
    console.log(`⚠️ ${file} - File not found`);
  }
});

// Check if there are any .mjs files
console.log("\n📋 Checking for .mjs files:");
const mjsFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith(".mjs"));
if (mjsFiles.length > 0) {
  console.log("❌ Found .mjs files:", mjsFiles);
} else {
  console.log("✅ No .mjs files found");
}

// Check package.json type
console.log("\n📋 Checking package.json module type:");
const packagePath = path.join(__dirname, "package.json");
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (pkg.type === "module") {
    console.log(
      '❌ package.json has "type": "module" - this causes ES6 import issues'
    );
  } else {
    console.log('✅ package.json uses CommonJS (no "type": "module")');
  }
} else {
  console.log("⚠️ package.json not found in server directory");
}

console.log("\n🏁 Diagnosis complete!");
