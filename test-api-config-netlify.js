// Test script to verify API configuration for Netlify Functions
const path = require('path');

// Mock environment variables for testing
process.env.NODE_ENV = 'development';
process.env.REACT_APP_API_URL = undefined; // Test auto-detection

// Mock window object for browser environment simulation
global.window = {
  location: {
    hostname: 'localhost' // Change to 'app.netlify.app' to test Netlify detection
  }
};

// Mock navigator for browser environment
global.navigator = {
  userAgent: 'Test User Agent'
};

// Mock console methods to capture output
const originalLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(' '));
  originalLog(...args);
};

console.log('🧪 Testing API Configuration for Netlify Functions...\n');

try {
  // Clear require cache to ensure fresh import
  delete require.cache[require.resolve('./client/src/config/api.js')];
  
  // Import the API configuration
  const apiConfig = require('./client/src/config/api.js');
  
  console.log('📊 Test Results:');
  console.log('================');
  console.log('API_BASE_URL:', apiConfig.API_BASE_URL);
  console.log('AUTH.LOGIN endpoint:', apiConfig.default.ENDPOINTS.AUTH.LOGIN);
  console.log('AUTH.REGISTER endpoint:', apiConfig.default.ENDPOINTS.AUTH.REGISTER);
  console.log('AUTH.REFRESH endpoint:', apiConfig.default.ENDPOINTS.AUTH.REFRESH);
  
  console.log('\n📝 Configuration Logs:');
  console.log('======================');
  logs.forEach(log => console.log('  ', log));
  
  // Test Netlify environment simulation
  console.log('\n🚀 Testing Netlify Environment Detection:');
  console.log('==========================================');
  
  // Clear logs for Netlify test
  logs.length = 0;
  
  // Simulate Netlify environment
  global.window.location.hostname = 'app.netlify.app';
  process.env.NETLIFY = 'true';
  process.env.REACT_APP_API_URL = undefined; // Ensure no env override
  
  // Clear cache and re-import
  delete require.cache[require.resolve('./client/src/config/api.js')];
  const netlifyConfig = require('./client/src/config/api.js');
  
  console.log('Netlify API_BASE_URL:', netlifyConfig.API_BASE_URL);
  console.log('Netlify AUTH.LOGIN endpoint:', netlifyConfig.default.ENDPOINTS.AUTH.LOGIN);
  console.log('Netlify AUTH.REGISTER endpoint:', netlifyConfig.default.ENDPOINTS.AUTH.REGISTER);
  
  console.log('\n✅ API Configuration test completed successfully!');
  
} catch (error) {
  console.error('❌ API Configuration test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}