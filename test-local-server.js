#!/usr/bin/env node

/**
 * Test Local Server Status
 * Quick test to check if the local server is running and accessible
 */

const http = require('http');

const LOCAL_SERVER_URL = 'http://localhost:5001';

function testLocalServer() {
  console.log('🧪 Testing local server status...\n');

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/health',
    method: 'GET',
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    console.log('✅ Local server is running!');
    console.log('   Status:', res.statusCode);
    console.log('   Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('   Response:', response);
      } catch (error) {
        console.log('   Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Local server is not running or not accessible');
    console.log('   Error:', error.message);
    console.log('\n💡 To start the local server:');
    console.log('   cd server && npm run dev');
    console.log('   or');
    console.log('   cd server && node index.js');
  });

  req.on('timeout', () => {
    console.log('❌ Local server request timed out');
    req.destroy();
  });

  req.end();
}

testLocalServer();