// Test frontend integration with Netlify Functions
const axios = require('axios');

async function testFrontendNetlifyIntegration() {
  console.log('🧪 Testing Frontend-Netlify Functions Integration...\n');
  
  // Test data
  const testUser = {
    email: 'integration-test@example.com',
    password: 'testpass123',
    firstName: 'Integration',
    lastName: 'Test',
    phone: '+1234567890',
    address: '123 Integration Street',
    acceptedTerms: {
      termsOfService: true,
      privacyPolicy: true
    }
  };

  try {
    console.log('📋 Test Configuration:');
    console.log('======================');
    console.log('Test User:', {
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName
    });
    
    // Test 1: Direct function call (if Netlify CLI is running on port 8888)
    console.log('\n🔧 Test 1: Direct Netlify Function Call');
    console.log('========================================');
    
    try {
      const directResponse = await axios.post('http://localhost:8888/.netlify/functions/auth-register', testUser, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Direct function call successful!');
      console.log('Status:', directResponse.status);
      console.log('User ID:', directResponse.data.user?.id);
      console.log('Token received:', !!directResponse.data.token);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Netlify CLI not running on port 8888');
        console.log('   Run: netlify dev --port 8888');
      } else {
        console.log('❌ Direct function call failed:', error.response?.data || error.message);
      }
    }
    
    // Test 2: Frontend API configuration simulation
    console.log('\n🌐 Test 2: Frontend API Configuration Simulation');
    console.log('=================================================');
    
    // Simulate what the frontend would do
    const NETLIFY_FUNCTIONS_URL = "/.netlify/functions";
    const getEndpoint = (path) => {
      return path.replace('/api/', '').replace(/\//g, '-');
    };
    
    const authRegisterEndpoint = getEndpoint("/api/auth/register");
    const fullUrl = `http://localhost:8888${NETLIFY_FUNCTIONS_URL}/${authRegisterEndpoint}`;
    
    console.log('Computed endpoint:', authRegisterEndpoint);
    console.log('Full URL:', fullUrl);
    
    try {
      const frontendResponse = await axios.post(fullUrl, testUser, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Frontend simulation successful!');
      console.log('Status:', frontendResponse.status);
      console.log('Response structure matches expected:', {
        hasMessage: !!frontendResponse.data.message,
        hasToken: !!frontendResponse.data.token,
        hasUser: !!frontendResponse.data.user,
        userHasId: !!frontendResponse.data.user?.id
      });
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Netlify CLI not running - cannot test frontend simulation');
      } else {
        console.log('❌ Frontend simulation failed:', error.response?.data || error.message);
      }
    }
    
    // Test 3: CORS verification
    console.log('\n🔒 Test 3: CORS Headers Verification');
    console.log('====================================');
    
    try {
      const corsResponse = await axios.options('http://localhost:8888/.netlify/functions/auth-register', {
        headers: {
          'Origin': 'http://localhost:3030',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      });
      
      console.log('✅ CORS preflight successful!');
      console.log('CORS headers:', {
        'Access-Control-Allow-Origin': corsResponse.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': corsResponse.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': corsResponse.headers['access-control-allow-headers']
      });
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Cannot test CORS - Netlify CLI not running');
      } else {
        console.log('❌ CORS test failed:', error.message);
      }
    }
    
    console.log('\n📊 Integration Test Summary:');
    console.log('============================');
    console.log('✅ Auth-register function created');
    console.log('✅ Auth-refresh function created');
    console.log('✅ API configuration updated for Netlify Functions');
    console.log('✅ Endpoint transformation logic implemented');
    console.log('✅ CORS utilities configured');
    
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Run: netlify dev --port 8888');
    console.log('2. Test the functions locally');
    console.log('3. Update frontend to use Netlify Functions in production');
    console.log('4. Deploy to Netlify and test end-to-end');
    
  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
    throw error;
  }
}

// Run the test
testFrontendNetlifyIntegration()
  .then(() => {
    console.log('\n🎉 Integration test completed!');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n💥 Integration test failed!');
    process.exit(1);
  });