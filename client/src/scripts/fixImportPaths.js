/**
 * Script to fix incorrect import paths for the icons module
 * Run with: node src/scripts/fixImportPaths.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Finds all JavaScript and JSX files in the src directory
 * @returns {Promise<string[]>} - Array of file paths
 */
function findAllJsFiles() {
  return new Promise((resolve, reject) => {
    glob('src/**/*.{js,jsx}', { ignore: ['**/node_modules/**', '**/build/**'] }, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

/**
 * Fixes incorrect import paths for the icons module
 * @param {string} content - File content
 * @param {string} filePath - Path to the file
 * @returns {string} - Updated file content
 */
function fixImportPaths(content, filePath) {
  // Check if the file has an incorrect import path
  if (content.includes("import icons from '../components/Common/Icons'")) {
    // Calculate the correct relative path to the Icons directory
    const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src/components/Common/Icons'))
      .replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
    
    // Replace the incorrect import path with the correct one
    return content.replace(
      "import icons from '../components/Common/Icons'",
      `import icons from '${relativePath}'`
    );
  }
  
  return content;
}

/**
 * Processes a file to fix incorrect import paths
 * @param {string} filePath - Path to the file
 */
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = fixImportPaths(content, filePath);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed import paths in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Fixes incorrect import paths throughout the application
 */
async function fixImports() {
  try {
    const files = await findAllJsFiles();
    console.log(`Found ${files.length} JavaScript files to process`);
    
    for (const file of files) {
      await processFile(file);
    }
    
    console.log('Import path fixes complete!');
  } catch (error) {
    console.error('Import path fixes failed:', error);
  }
}

// Run the script
fixImports().catch(console.error);