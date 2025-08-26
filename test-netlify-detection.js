// Simple test for Netlify environment detection
console.log('🧪 Testing Netlify Environment Detection...\n');

// Test 1: Local environment (should use localhost)
console.log('Test 1: Local Environment');
console.log('========================');

// Mock local environment
delete process.env.NETLIFY;
delete process.env.REACT_APP_API_URL;
global.window = { location: { hostname: 'localhost' } };

const LOCAL_API_URL = "http://localhost:5001";
const NETLIFY_FUNCTIONS_URL = "/.netlify/functions";

const getApiUrl1 = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl.trim() !== '') {
    console.log("🔧 Using environment URL:", envUrl);
    return envUrl;
  }
  
  if (process.env.NETLIFY || (typeof window !== 'undefined' && window.location.hostname.includes('netlify'))) {
    console.log("🚀 Using Netlify Functions");
    return NETLIFY_FUNCTIONS_URL;
  }
  
  console.log("🏠 Using localhost backend for development");
  return LOCAL_API_URL;
};

const result1 = getApiUrl1();
console.log('Result:', result1);
console.log('Expected: http://localhost:5001');
console.log('✅ Test 1:', result1 === LOCAL_API_URL ? 'PASSED' : 'FAILED');

console.log('\nTest 2: Netlify Environment (NETLIFY env var)');
console.log('==============================================');

// Mock Netlify environment with env var
process.env.NETLIFY = 'true';
global.window = { locat