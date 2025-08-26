#!/usr/bin/env node

/**
 * Test Valid Login
 * Test the login endpoint with valid credentials
 */

const http = require('http');

function testValidLogin() {
  console.log('🧪 Testing login with valid credentials...\n');

  const credentials = [
    { email: 'admin@neighbourhood.com', password: 'admin123', role: 'Admin' },
    { email: 'john.doe@email.com', password: 'user123', role: 'User' },
  ];

  credentials.forEach((cred, index) => {
    setTimeout(() => {
      console.log(`${index + 1}. Testing ${cred.role} login (${cred.email})...`);
      
      const postData = JSON.stringify({
        email: cred.email,
        password: cred.password
      });
      
      const req = http.request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Origin': 'https://neighbourhood-watch-app.vercel.app',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
      }, (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS Origin: ${res.headers['access-control-allow-origin']}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              console.log('   ✅ Login successful!');
              console.log('   User:', response.user?.firstName, response.user?.lastName);
              console.log('   Role:', response.user?.role);
              console.log('   Token:', response.token ? 'Present' : 'Missing');
            } else {
              console.log('   ❌ Login failed:', response.message || response.error);
            }
          } catch (error) {
            console.log('   ❌ Invalid JSON response:', data);
          }
          console.log('');
        });
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ Request failed: ${error.message}`);
      });
      
      req.write(postData);
      req.end();
    }, index * 1000); // Stagger requests by 1 second
  });
}

testValidLogin();