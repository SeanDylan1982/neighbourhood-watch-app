/**
 * Test API configuration and connection
 * This script helps debug API connection issues
 */

import { API_BASE_URL } from '../config/api';

const testApiConfig = async () => {
  console.log('🔧 Testing API Configuration...');
  console.log('Current API Base URL:', API_BASE_URL);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  
  // Test basic fetch to health endpoint
  try {
    console.log('📡 Testing health endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check successful:', data);
      return true;
    } else {
      console.log('⚠️ Health check failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    if (error.message.includes('CORS')) {
      console.log('🚨 CORS Error - This suggests the server is running but CORS is not configured properly');
    } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.log('🚨 Connection Error - This suggests the server is not running or not accessible');
      console.log('💡 Make sure the server is running on the expected port');
    } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      console.log('🚨 DNS Error - Cannot resolve the server hostname');
    }
    
    return false;
  }
};

// Test login endpoint specifically
const testLoginEndpoint = async () => {
  console.log('🔐 Testing login endpoint CORS...');
  
  try {
    // First test OPTIONS request (CORS preflight)
    const optionsResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    console.log('OPTIONS response:', {
      status: optionsResponse.status,
      statusText: optionsResponse.statusText,
      headers: Object.fromEntries(optionsResponse.headers.entries())
    });
    
    if (optionsResponse.ok) {
      console.log('✅ CORS preflight successful');
    } else {
      console.log('⚠️ CORS preflight failed');
    }
    
    // Then test actual POST request (should fail with auth error, not CORS error)
    const postResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test'
      }),
    });
    
    console.log('POST response:', {
      status: postResponse.status,
      statusText: postResponse.statusText
    });
    
    if (postResponse.status === 400 || postResponse.status === 401) {
      console.log('✅ Login endpoint accessible (expected auth failure)');
      return true;
    } else if (postResponse.ok) {
      console.log('✅ Login endpoint accessible');
      return true;
    } else {
      console.log('⚠️ Unexpected response from login endpoint');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Login endpoint test failed:', error);
    return false;
  }
};

// Combined test function
const runAllTests = async () => {
  console.log('🚀 Running API Configuration Tests...\n');
  
  const healthTest = await testApiConfig();
  const loginTest = await testLoginEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log(`Health Endpoint: ${healthTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login Endpoint: ${loginTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthTest && loginTest) {
    console.log('\n🎉 All tests passed! API configuration is working correctly.');
  } else {
    console.log('\n🚨 Some tests failed. Check the logs above for details.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure the server is running: npm run server');
    console.log('2. Check that the server is listening on the correct port');
    console.log('3. Verify CORS configuration includes your client origin');
    console.log('4. Restart the React development server after changing .env');
  }
  
  return healthTest && loginTest;
};

// Export for use in browser console
window.testApiConfig = testApiConfig;
window.testLoginEndpoint = testLoginEndpoint;
window.runAllApiTests = runAllTests;

export { testApiConfig, testLoginEndpoint, runAllTests };
export default runAllTests;