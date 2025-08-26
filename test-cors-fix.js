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
      'Origin': 'https://neighbourhood-watch-app.vercel.app',
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
        'Origin': 'https://neighbourhood-watch-app.vercel.app',
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
      postRes.on('data', (chunk)