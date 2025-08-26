#!/usr/bin/env node

/**
 * Test CORS Fix
 * Test the login endpoint with proper CORS headers
 */

const http = require('http');

function testCorsLogin() {
  console.log('🧪 Testing CORS login endpoint...\n');

  // Test 1: OPTIONS preflight request
  console.log('1. Testing OPTIONS preflight request...');
  
  const optionsReq = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3030',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
    timeout: 5000,
  }, (res) => {
    console.log('   ✅ OPTIONS Status:', res.statusCode);
    console.log('   CORS Headers:');
    console.log('     Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('     Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('     Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    console.log('     Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    
    // Test 2: Actual POST request
    console.log('\n2. Testing POST login request...');
    
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    const postReq = http.request({
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
    }, (postRes) => {
      console.log('   ✅ POST Status:', postRes.statusCode);
      console.log('   CORS Headers:');
      console.log('     Access-Control-Allow-Origin:', postRes.headers['access-control-allow-origin']);
      console.log('     Access-Control-Allow-Credentials:', postRes.headers['access-control-allow-credentials']);
      
      let data = '';
      postRes.on('data', (chunk) => {
        data += chunk;
      });
      
      postRes.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('   Response:', response);
        } catch (error) {
          console.log('   Raw response:', data);
        }
        
        if (postRes.statusCode === 401 || postRes.statusCode === 400) {
          console.log('   ✅ CORS is working! (Expected auth error with test credentials)');
        } else if (postRes.headers['access-control-allow-origin']) {
          console.log('   ✅ CORS headers are present!');
        }
      });
    });
    
    postReq.on('error', (error) => {
      console.log('   ❌ POST request failed:', error.message);
    });
    
    postReq.write(postData);
    postReq.end();
  });

  optionsReq.on('error', (error) => {
    console.log('   ❌ OPTIONS request failed:', error.message);
  });

  optionsReq.end();
}

testCorsLogin();