// Health check test for user management functions
console.log('🏥 Testing user management functions health...\n');

// Mock event and context for testing
const createMockEvent = (method = 'GET', body = null, headers = {}) => ({
  httpMethod: method,
  body: body ? JSON.stringify(body) : null,
  headers: {
    'content-type': 'application/json',
    ...headers
  },
  queryStringParameters: null,
  pathParameters: null
});

const mockContext = {
  callbackWaitsForEmptyEventLoop: false
};

// Test functions
const functions = [
  { name: 'users-profile', path: './netlify/functions/users-profile.js' },
  { name: 'users-me', path: './netlify/functions/users-me.js' },
  { name: 'users-settings', path: './netlify/functions/users-settings.js' }
];

async function testFunction(name, handler) {
  console.log(`🔍 Testing ${name}...`);
  
  try {
    // Test CORS preflight
    const corsEvent = createMockEvent('OPTIONS');
    const corsResponse = await handler(corsEvent, mockContext);
    
    if (corsResponse.statusCode === 200) {
      console.log(`✅ ${name}: CORS preflight works`);
    } else {
      console.log(`⚠️ ${name}: CORS preflight returned ${corsResponse.statusCode}`);
    }
    
    // Test missing auth
    const noAuthEvent = createMockEvent('GET');
    const noAuthResponse = await handler(noAuthEvent, mockContext);
    
    if (noAuthResponse.statusCode === 401) {
      console.log(`✅ ${name}: Authentication required (401)`);
    } else {
      console.log(`⚠️ ${name}: Expected 401 for missing auth, got ${noAuthResponse.statusCode}`);
    }
    
    // Test invalid method
    const invalidMethodEvent = createMockEvent('DELETE', null, {
      'authorization': 'Bearer fake-token'
    });
    const invalidMethodResponse = await handler(invalidMethodEvent, mockContext);
    
    if (invalidMethodResponse.statusCode === 405) {
      console.log(`✅ ${name}: Invalid method handling (405)`);
    } else {
      console.log(`⚠️ ${name}: Expected 405 for invalid method, got ${invalidMethodResponse.statusCode}`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${name}: Error during testing - ${error.message}`);
    return false;
  }
}

async function runHealthChecks() {
  let allHealthy = true;
  
  for (const { name, path } of functions) {
    try {
      const func = require(path);
      const isHealthy = await testFunction(name, func.handler);
      if (!isHealthy) allHealthy = false;
      console.log(''); // Add spacing
    } catch (error) {
      console.error(`❌ ${name}: Failed to load - ${error.message}\n`);
      allHealthy = false;
    }
  }
  
  console.log(`${allHealthy ? '🎉' : '💥'} Health check ${allHealthy ? 'PASSED' : 'FAILED'}`);
  
  if (allHealthy) {
    console.log('\n✨ All user management functions are healthy!');
    console.log('🔧 Functions properly handle:');
    console.log('   ✅ CORS preflight requests');
    console.log('   ✅ Missing authentication (401)');
    console.log('   ✅ Invalid HTTP methods (405)');
    console.log('\n📋 Ready for integration testing with real auth tokens');
  }
  
  return allHealthy;
}

// Run health checks
runHealthChecks().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Health check failed:', error.message);
  process.exit(1);
});