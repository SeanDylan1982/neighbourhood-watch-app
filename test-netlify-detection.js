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
global.window = { location: { hostname: 'localhost' } };

const result2 = getApiUrl1();
console.log('Result:', result2);
console.log('Expected: /.netlify/functions');
console.log('✅ Test 2:', result2 === NETLIFY_FUNCTIONS_URL ? 'PASSED' : 'FAILED');

console.log('\nTest 3: Netlify Environment (hostname detection)');
console.log('================================================');

// Mock Netlify environment with hostname
delete process.env.NETLIFY;
global.window = { location: { hostname: 'app.netlify.app' } };

const result3 = getApiUrl1();
console.log('Result:', result3);
console.log('Expected: /.netlify/functions');
console.log('✅ Test 3:', result3 === NETLIFY_FUNCTIONS_URL ? 'PASSED' : 'FAILED');

console.log('\nTest 4: Environment Variable Override');
console.log('====================================');

// Test environment variable override
process.env.REACT_APP_API_URL = 'https://custom-api.com';
global.window = { location: { hostname: 'app.netlify.app' } };

const result4 = getApiUrl1();
console.log('Result:', result4);
console.log('Expected: https://custom-api.com');
console.log('✅ Test 4:', result4 === 'https://custom-api.com' ? 'PASSED' : 'FAILED');

console.log('\n🎉 All tests completed!');