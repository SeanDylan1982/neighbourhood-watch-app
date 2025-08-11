#!/usr/bin/env node

/**
 * Test the minimal Railway server locally
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing minimal Railway server...\n');

// Start the server with a different port
const server = spawn('node', ['server/railway-minimal.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5002' }
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('SERVER:', output.trim());
  
  if (output.includes('ready for Railway health checks')) {
    serverReady = true;
    setTimeout(runTests, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  process.exit(code);
});

async function runTests() {
  if (!serverReady) {
    console.log('❌ Server not ready');
    return cleanup();
  }
  
  const tests = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Root Endpoint', path: '/' },
    { name: 'Health Redirect', path: '/health' },
    { name: 'Healthz Redirect', path: '/healthz' },
  ];
  
  console.log('\n🔍 Running tests...\n');
  
  for (const test of tests) {
    try {
      const result = await testEndpoint(test.path);
      console.log(`✅ ${test.name}: Status ${result.status}`);
      if (result.data) {
        console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Tests completed!');
  cleanup();
}

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5002${path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
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

// Timeout after 20 seconds
setTimeout(() => {
  console.log('❌ Test timeout after 20 seconds');
  cleanup();
}, 20000);