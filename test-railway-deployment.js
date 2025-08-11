#!/usr/bin/env node

/**
 * Test script to verify Railway deployment is working
 */

const https = require('https');
const http = require('http');

const RAILWAY_URL = 'https://neighbourwatch-development.up.railway.app';
const LOCAL_URL = 'http://localhost:5001';

function testEndpoint(url, path = '/api/health') {
  return new Promise((resolve, reject) => {
    const fullUrl = url + path;
    const client = url.startsWith('https') ? https : http;
    
    console.log(`Testing: ${fullUrl}`);
    
    const req = client.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            url: fullUrl,
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            url: fullUrl,
            status: res.statusCode,
            data: data,
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        url: fullUrl,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        url: fullUrl,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Railway deployment...\n');
  
  const tests = [
    { name: 'Railway Health Check', url: RAILWAY_URL, path: '/api/health' },
    { name: 'Railway Root', url: RAILWAY_URL, path: '/' },
    { name: 'Railway Auth Endpoint', url: RAILWAY_URL, path: '/api/auth/login' },
  ];
  
  for (const test of tests) {
    try {
      const result = await testEndpoint(test.url, test.path);
      console.log(`✅ ${test.name}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name}:`);
      console.log(`   Error: ${error.error}`);
      console.log('');
    }
  }
  
  console.log('🏁 Test completed');
}

runTests().catch(console.error);