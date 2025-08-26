#!/usr/bin/env node

/**
 * Test Frontend Configuration
 * Verify that the frontend configuration is correct
 */

const fs = require('fs');
const path = require('path');

function testConfig() {
  console.log('🧪 Testing frontend configuration...\n');

  // Check .env file
  console.log('1. Checking client/.env:');
  const envPath = 'client/.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiUrl = envContent.match(/REACT_APP_API_URL=(.+)/);
    const port = envContent.match(/PORT=(.+)/);
    
    console.log(`   API URL: ${apiUrl ? apiUrl[1] : 'Not found'}`);
    console.log(`   Port: ${port ? port[1] : 'Not found'}`);
    
    if (apiUrl && apiUrl[1].includes('localhost:5001')) {
      console.log('   ✅ API URL is correctly set to localhost');
    } else {
      console.log('   ❌ API URL is not set to localhost');
    }
    
    if (port && port[1] === '3030') {
      console.log('   ✅ Port is correctly set to 3030');
    } else {
      console.log('   ❌ Port is not set to 3030');
    }
  } else {
    console.log('   ❌ .env file not found');
  }

  // Check .env.production file
  console.log('\n2. Checking client/.env.production:');
  const envProdPath = 'client/.env.production';
  if (fs.existsSync(envProdPath)) {
    const envProdContent = fs.readFileSync(envProdPath, 'utf8');
    const apiUrl = envProdContent.match(/REACT_APP_API_URL=(.+)/);
    
    console.log(`   API URL: ${apiUrl ? apiUrl[1] : 'Not found'}`);
    
    if (apiUrl && apiUrl[1].includes('localhost:5001')) {
      console.log('   ✅ Production API URL is correctly set to localhost');
    } else {
      console.log('   ❌ Production API URL is not set to localhost');
    }
  } else {
    console.log('   ❌ .env.production file not found');
  }

  // Check package.json
  console.log('\n3. Checking client/package.json:');
  const packagePath = 'client/package.json';
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const startScript = packageContent.scripts?.start;
    
    console.log(`   Start script: ${startScript || 'Not found'}`);
    
    if (startScript && startScript.includes('PORT=3030')) {
      console.log('   ✅ Start script includes PORT=3030');
    } else {
      console.log('   ❌ Start script does not include PORT=3030');
    }
  } else {
    console.log('   ❌ package.json file not found');
  }

  // Check AuthContext.js
  console.log('\n4. Checking client/src/contexts/AuthContext.js:');
  const authContextPath = 'client/src/contexts/AuthContext.js';
  if (fs.existsSync(authContextPath)) {
    const authContent = fs.readFileSync(authContextPath, 'utf8');
    
    if (authContent.includes('neighbourwatch-development.up.railway.app')) {
      console.log('   ❌ AuthContext still contains Railway URL');
    } else {
      console.log('   ✅ AuthContext does not contain Railway URL');
    }
    
    if (authContent.includes('axios.defaults.baseURL = API_BASE_URL')) {
      console.log('   ✅ AuthContext uses API_BASE_URL from config');
    } else {
      console.log('   ❌ AuthContext does not use API_BASE_URL from config');
    }
  } else {
    console.log('   ❌ AuthContext.js file not found');
  }

  console.log('\n📋 Summary:');
  console.log('If all checks pass, restart the frontend and it should work on port 3030');
  console.log('If any checks fail, review the configuration files above');
}

testConfig();