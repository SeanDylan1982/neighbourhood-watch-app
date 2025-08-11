#!/usr/bin/env node

/**
 * Test script to verify the Railway startup script works locally
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing Railway startup script...\n');

// Start the server
const server = spawn('node', ['railway-start.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('SERVER:', output.trim());
  
  if (output.includes('Railway server running')) {
    serverReady = true;
    setTimeout(testHealthCheck, 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

function testHealthCheck() {
  if (!serverReady) {
    console.log('❌ Server not ready yet');
    return;
  }
  
  console.log('\n🔍 Testing health check endpoint...');
  
  const req = http.get('http://localhost:5001/api/health', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Health check successful!');
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        // Test other endpoints
        testOtherEndpoints();
      } catch (error) {
        console.log('❌ Health check failed - Invalid JSON');
        console.log('Raw response:', data);
        cleanup();
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Health check failed:', error.message);
    cleanup();
  });
  
  req.setTimeout(5000, () => {
    console.log('❌ Health check timeout');
    cleanup();
  });
}

function testOtherEndpoints() {
  console.log('\n🔍 Testing root endpoint...');
  
  const req = http.get('http://localhost:5001/', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Root endpoint successful!');
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        console.log('\n🎉 All tests passed! Server is working correctly.');
        cleanup();
      } catch (error) {
        console.log('❌ Root endpoint failed - Invalid JSON');
        console.log('Raw response:', data);
        cleanup();
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Root endpoint failed:', error.message);
    cleanup();
  });
}

function cleanup() {
  console.log('\n🧹 Cleaning up...');
  server.kill('SIGTERM');
  setTimeout(() => {
    server.kill('SIGKILL');
    process.exit(0);
  }, 2000);
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Timeout after 30 seconds
setTimeout(() => {
  console.log('❌ Test timeout after 30 seconds');
  cleanup();
}, 30000);