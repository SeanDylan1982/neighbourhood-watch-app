#!/usr/bin/env node

// Vercel build script for client
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Vercel build for client...');

try {
  // Change to client directory
  process.chdir(path.join(__dirname));
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });
  
  // Build the React app
  console.log('Building React app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}