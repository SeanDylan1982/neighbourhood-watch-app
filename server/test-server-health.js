/**
 * Simple server health check script
 * Tests if the local server is running and accessible
 */

const http = require('http');

const testServerHealth = () => {
  console.log('🔍 Testing local server health...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000'
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`✅ Server responding with status: ${res.statusCode}`);
    console.log('📋 Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📊 Health check response:', jsonData);
      } catch (error) {
        console.log('📄 Raw response:', data);
      }
      
      // Test CORS headers
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };
      
      console.log('🌐 CORS headers:', corsHeaders);
      
      if (corsHeaders['access-control-allow-origin']) {
        console.log('✅ CORS is configured');
      } else {
        console.log('⚠️ CORS headers missing');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Server health check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server is not running on port 5001');
      console.log('💡 Try running: npm run server');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🚨 Cannot resolve localhost');
    } else {
      console.log('🚨 Unknown connection error');
    }
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Request timeout - server may be slow to respond');
    req.destroy();
  });
  
  req.end();
};

// Run the test
testServerHealth();

module.exports = testServerHealth;