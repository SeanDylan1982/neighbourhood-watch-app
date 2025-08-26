#!/usr/bin/env node

/**
 * Clear Cache and Restart
 * Clears React build cache and provides restart instructions
 */

const fs = require('fs');
const path = require('path');

function clearCache() {
  console.log('🧹 Clearing React build cache...\n');

  const pathsToDelete = [
    'client/build',
    'client/node_modules/.cache',
    'client/.eslintcache'
  ];

  pathsToDelete.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      console.log(`✅ Removing ${dirPath}`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    } else {
      console.log(`ℹ️ ${dirPath} doesn't exist (already clean)`);
    }
  });

  console.log('\n🎯 Cache cleared successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Stop the current frontend server (Ctrl+C)');
  console.log('2. Restart the frontend:');
  console.log('   cd client && npm start');
  console.log('3. The frontend should now run on http://localhost:3030');
  console.log('4. It should connect to the backend on http://localhost:5001');
  console.log('\n🔍 Expected behavior:');
  console.log('- Frontend: http://localhost:3030');
  console.log('- Backend: http://localhost:5001');
  console.log('- No more Railway CORS errors!');
}

clearCache();