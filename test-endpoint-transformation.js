// Test endpoint transformation for Netlify Functions
console.log('🧪 Testing Endpoint Transformation...\n');

const NETLIFY_FUNCTIONS_URL = "/.netlify/functions";
const LOCAL_API_URL = "http://localhost:5001";

// Helper function to get the correct endpoint based on environment
const getEndpoint = (path, baseUrl) => {
  // If using Netlify Functions, endpoints are direct function names
  if (baseUrl === NETLIFY_FUNCTIONS_URL) {
    // Convert /api/auth/login to auth-login for Netlify Functions
    return path.replace('/api/', '').replace(/\//g, '-');
  }
  
  // For traditional server, use the full path
  return path;
};

console.log('Test 1: Local Server Endpoints');
console.log('==============================');
const localEndpoints = {
  LOGIN: getEndpoint("/api/auth/login", LOCAL_API_URL),
  REGISTER: getEndpoint("/api/auth/register", LOCAL_API_URL),
  REFRESH: getEndpoint("/api/auth/refresh", LOCAL_API_URL),
  PROFILE: getEndpoint("/api/users/profile", LOCAL_API_URL),
  MESSAGES: getEndpoint("/api/chat/messages", LOCAL_API_URL),
};

console.log('Local endpoints:', localEndpoints);
console.log('✅ Local endpoints should remain unchanged');

console.log('\nTest 2: Netlify Functions Endpoints');
console.log('===================================');
const netlifyEndpoints = {
  LOGIN: getEndpoint("/api/auth/login", NETLIFY_FUNCTIONS_URL),
  REGISTER: getEndpoint("/api/auth/register", NETLIFY_FUNCTIONS_URL),
  REFRESH: getEndpoint("/api/auth/refresh", NETLIFY_FUNCTIONS_URL),
  PROFILE: getEndpoint("/api/users/profile", NETLIFY_FUNCTIONS_URL),
  MESSAGES: getEndpoint("/api/chat/messages", NETLIFY_FUNCTIONS_URL),
};

console.log('Netlify endpoints:', netlifyEndpoints);

// Verify transformations
const expectedNetlify = {
  LOGIN: "auth-login",
  REGISTER: "auth-register", 
  REFRESH: "auth-refresh",
  PROFILE: "users-profile",
  MESSAGES: "chat-messages"
};

console.log('\nVerification:');
Object.keys(expectedNetlify).forEach(key => {
  const actual = netlifyEndpoints[key];
  const expected = expectedNetlify[key];
  console.log(`${key}: ${actual} ${actual === expected ? '✅' : '❌'} (expected: ${expected})`);
});

console.log('\n🎉 Endpoint transformation test completed!');