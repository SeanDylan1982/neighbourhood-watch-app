#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing Railway debug server...\n');

const server = spawn('node', ['server/railway-debug.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5004' }
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('SERVER:', output.trim());
  
  if (output.includes('Ready for Railway health checks')) {
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
  
  console.log('\n🔍 Testing health check endpoint...\n');
  
  try {
    const result = await testEndpoint('/api/health');
    console.log(`✅ Health check: Status ${result.status}`);
    console.log('Response preview:', JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }
  
  cleanup();
}

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5004${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
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

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

setTimeout(() => {
  console.log('❌ Test timeout');
  cleanup();
}, 20000);