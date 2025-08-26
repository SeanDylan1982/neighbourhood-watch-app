#!/usr/bin/env node

/**
 * CORS Configuration Test
 * Tests the current CORS setup to identify issues with cross-origin requests
 */

const axios = require('axios');

const RAILWAY_API_URL = 'https://neighbourwatch-development.up.railway.app';
const LOCAL_API_URL = 'http://localhost:5001';

async function testCorsConfiguration() {
  console.log('🧪 Testing CORS Configuration...\n');

  // Test 1: Basic health check to Railway backend
  console.log('1. Testing basic health check to Railway backend...');
  try {
    const response = await axios.get(`${RAILWAY_API_URL}/api/health`, {
      timeout: 10000,
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      }
    });
    console.log('✅ Health check successful:', response.status);
    console.log('   Response headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
    });
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Headers:', error.response.headers);
    }
  }

  console.log('\n2. Testing preflight OPTIONS request...');
  try {
    const response = await axios.options(`${RAILWAY_API_URL}/api/auth/login`, {
      timeout: 10000,
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    });
    console.log('✅ Preflight request successful:', response.status);
    console.log('   CORS headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
    });
  } catch (error) {
    console.log('❌ Preflight request failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Headers:', error.response.headers);
    }
  }

  console.log('\n3. Testing actual login request (should fail without credentials)...');
  try {
    const response = await axios.post(`${RAILWAY_API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      timeout: 10000,
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    console.log('✅ Login request successful (unexpected):', response.status);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Login request properly rejected (401) - CORS is working');
      console.log('   CORS headers present:', {
        'access-control-allow-origin': error.response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': error.response.headers['access-control-allow-credentials'],
      });
    } else {
      console.log('❌ Login request failed with CORS error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Headers:', error.response.headers);
      }
    }
  }

  console.log('\n4. Testing local server (if running)...');
  try {
    const response = await axios.get(`${LOCAL_API_URL}/api/health`, {
      timeout: 5000,
    });
    console.log('✅ Local server is running:', response.status);
  } catch (error) {
    console.log('ℹ️ Local server not running or not accessible:', error.message);
  }

  console.log('\n🔍 CORS Configuration Analysis Complete');
}

// Run the test
testCorsConfiguration().catch(console.error);