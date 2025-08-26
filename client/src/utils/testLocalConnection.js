/**
 * Test script to verify local backend connection
 * Run this to check if the local server is accessible
 */

const testLocalConnection = async () => {
  console.log('🔍 Testing local backend connection...');
  
  const LOCAL_API_URL = 'http://localhost:5001';
  
  try {
    // Test basic health check
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch(`${LOCAL_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);
    } else {
      console.log('⚠️ Health check failed:', healthResponse.status, healthResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
  
  try {
    // Test CORS preflight
    console.log('🌐 Testing CORS preflight...');
    const corsResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    console.log('CORS preflight response:', {
      status: corsResponse.status,
      headers: Object.fromEntries(corsResponse.headers.entries())
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS preflight successful');
    } else {
      console.log('⚠️ CORS preflight failed');
    }
  } catch (error) {
    console.error('❌ CORS preflight error:', error.message);
  }
  
  try {
    // Test actual login endpoint (should fail with validation error, but not CORS error)
    console.log('🔐 Testing login endpoint...');
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
    });
    
    console.log('Login endpoint response:', {
      status: loginResponse.status,
      statusText: loginResponse.statusText,
      headers: Object.fromEntries(loginResponse.headers.entries())
    });
    
    if (loginResponse.status === 400 || loginResponse.status === 401) {
      console.log('✅ Login endpoint accessible (expected auth failure)');
    } else if (loginResponse.ok) {
      console.log('✅ Login endpoint accessible');
    } else {
      console.log('⚠️ Login endpoint issue:', loginResponse.status);
    }
  } catch (error) {
    console.error('❌ Login endpoint error:', error.message);
    
    if (error.message.includes('CORS')) {
      console.log('🚨 CORS issue detected - server may not be running or configured properly');
    } else if (error.message.includes('Failed to fetch')) {
      console.log('🚨 Connection refused - server may not be running on port 5001');
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('- Make sure the server is running: npm run server');
  console.log('- Check server logs for MongoDB connection issues');
  console.log('- Verify server is listening on port 5001');
  console.log('- Ensure CORS is properly configured for localhost:3000');
};

// Export for use in browser console
window.testLocalConnection = testLocalConnection;

// Auto-run if called directly
if (typeof window !== 'undefined') {
  console.log('🔧 Local connection test utility loaded');
  console.log('Run: testLocalConnection() to test the connection');
}

export default testLocalConnection;