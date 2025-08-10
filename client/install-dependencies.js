/**
 * Script to install required dependencies for the admin dashboard
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing required dependencies for the admin dashboard...');

try {
  // Install recharts
  console.log('Installing recharts...');
  execSync('npm install recharts --save', { stdio: 'inherit' });
  
  // Install date-fns if not already installed
  console.log('Installing date-fns...');
  execSync('npm install date-fns --save', { stdio: 'inherit' });
  
  console.log('\nDependencies installed successfully!');
  console.log('\nYou can now run the application with:');
  console.log('npm start');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  console.log('\nPlease install the dependencies manually:');
  console.log('npm install recharts date-fns --save');
}