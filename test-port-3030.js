#!/usr/bin/env node

/**
 * Test Port 3030 Configuration
 * Verify that the frontend can connect to the backend from port 3030
 */

const http = require('http');

function testPort3030() {
  console.log('🧪 Testing frontend port 3030 to backend port 5001...\n');

  // Test CORS with the new frontend port
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3030',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: 5000,
  }, (res) => {
    console.log('✅ Connection successful!');
    console.log('   Status:', res.statusCode);
    console.log('   CORS Headers:');
    console.log('     Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('     Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    
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
      
      if (res.headers['access-control-allow-origin'] === 'http://localhost:3030') {
        console.log('\n✅ Port 3030 is properly configured for CORS!');
      } else if (res.headers['access-control-allow-origin'] === '*') {
        console.log('\n✅ CORS allows all origins (including port 3030)');
      } else {
        console.log('\n⚠️ CORS may not be configured for port 3030');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Connection failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running on port 5001');
    console.log('2. Frontend will run on port 3030');
  });

  req.write(postData);
  req.end();
}

testPort3030();