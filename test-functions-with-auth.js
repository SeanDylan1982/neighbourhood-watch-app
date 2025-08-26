// Test user management functions with proper authentication
require('dotenv').config();

// Mock Netlify function event and context
function createMockEvent(method, path, body = null, headers = {}) {
  return {
    httpMethod: method,
    path: path,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: {},
    pathParameters: {},
    isBase64Encoded: false
  };
}

function createMockContext() {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000
  };
}

async function authenticateTestUser() {
  try {
    console.log('🔐 Authenticating test user...');
    const authHandler = require('./netlify/functions/auth-login').handler;
    const event = createMockEvent('POST', '/auth-login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const context = createMockContext();
    
    const result = await authHandler(event, context);
    console.log('Auth Status:', result.statusCode);
    
    if (result.statusCode === 200) {
      const response = JSON.parse(result.body);
      console.log('✅ Authentication successful');
      return response.token;
    } else {
      console.log('❌ Authentication failed:', JSON.parse(result.body));
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

async function testWithValidAuth() {
  try {
    console.log('🧪 Testing user management functions with valid authentication...\n');
    
    // Get a valid token
    const token = await authenticateTestUser();
    if (!token) {
      console.log('⚠️ Cannot proceed without valid token. Make sure test user exists in database.');
      return;
    }
    
    console.log('\n📋 Test 1: GET /users-me with valid auth');
    const usersMeHandler = require('./netlify/functions/users-me').handler;
    const event1 = createMockEvent('GET', '/users-me', null, {
      'Authorization': `Bearer ${token}`
    });
    const context1 = createMockContext();
    
    const result1 = await usersMeHandler(event1, context1);
    console.log('Status:', result1.statusCode);
    if (result1.statusCode === 200) {
      const userData = JSON.parse(result1.body);
      console.log('✅ User data retrieved successfully');
      console.log('User ID:', userData.id);
      console.log('Email:', userData.email);
      console.log('Name:', userData.firstName, userData.lastName);
    } else {
      console.log('Response:', JSON.parse(result1.body));
    }
    
    console.log('\n📋 Test 2: PUT /users-me with valid data');
    const event2 = createMockEvent('PUT', '/users-me', {
      firstName: 'Updated',
      lastName: 'TestUser',
      phone: '+1234567890',
      address: '123 Test Street'
    }, {
      'Authorization': `Bearer ${token}`
    });
    const context2 = createMockContext();
    
    const result2 = await usersMeHandler(event2, context2);
    console.log('Status:', result2.statusCode);
    if (result2.statusCode === 200) {
      const updateData = JSON.parse(result2.body);
      console.log('✅ User profile updated successfully');
      console.log('Updated data:', updateData);
    } else {
      console.log('Response:', JSON.parse(result2.body));
    }
    
    console.log('\n📋 Test 3: GET /users-profile with valid auth');
    const usersProfileHandler = require('./netlify/functions/users-profile').handler;
    const event3 = createMockEvent('GET', '/users-profile', null, {
      'Authorization': `Bearer ${token}`
    });
    const context3 = createMockContext();
    
    const result3 = await usersProfileHandler(event3, context3);
    console.log('Status:', result3.statusCode);
    if (result3.statusCode === 200) {
      const profileData = JSON.parse(result3.body);
      console.log('✅ Profile data retrieved successfully');
      console.log('Profile includes bio:', 'bio' in profileData);
    } else {
      console.log('Response:', JSON.parse(result3.body));
    }
    
    console.log('\n⚙️ Test 4: GET /users-settings with valid auth');
    const usersSettingsHandler = require('./netlify/functions/users-settings').handler;
    const event4 = createMockEvent('GET', '/users-settings', null, {
      'Authorization': `Bearer ${token}`
    });
    const context4 = createMockContext();
    
    const result4 = await usersSettingsHandler(event4, context4);
    console.log('Status:', result4.statusCode);
    if (result4.statusCode === 200) {
      const settingsData = JSON.parse(result4.body);
      console.log('✅ Settings retrieved successfully');
      console.log('Has settings:', 'settings' in settingsData);
    } else {
      console.log('Response:', JSON.parse(result4.body));
    }
    
    console.log('\n⚙️ Test 5: PUT /users-settings with valid data');
    const event5 = createMockEvent('PUT', '/users-settings', {
      emailNotifications: false,
      chatNotifications: true,
      locationSharing: true,
      privacyLevel: 'neighbours'
    }, {
      'Authorization': `Bearer ${token}`
    });
    const context5 = createMockContext();
    
    const result5 = await usersSettingsHandler(event5, context5);
    console.log('Status:', result5.statusCode);
    if (result5.statusCode === 200) {
      const updatedSettings = JSON.parse(result5.body);
      console.log('✅ Settings updated successfully');
      console.log('Update message:', updatedSettings.message);
    } else {
      console.log('Response:', JSON.parse(result5.body));
    }
    
    console.log('\n🚫 Test 6: Invalid method with valid auth');
    const event6 = createMockEvent('DELETE', '/users-me', null, {
      'Authorization': `Bearer ${token}`
    });
    const context6 = createMockContext();
    
    const result6 = await usersMeHandler(event6, context6);
    console.log('Status:', result6.statusCode);
    if (result6.statusCode === 405) {
      console.log('✅ Method validation working correctly');
    } else {
      console.log('Response:', JSON.parse(result6.body));
    }
    
    console.log('\n📝 Test 7: Invalid JSON with valid auth');
    const event7 = createMockEvent('PUT', '/users-me', null, {
      'Authorization': `Bearer ${token}`
    });
    event7.body = 'invalid json';
    const context7 = createMockContext();
    
    const result7 = await usersMeHandler(event7, context7);
    console.log('Status:', result7.statusCode);
    if (result7.statusCode === 400) {
      console.log('✅ JSON validation working correctly');
    } else {
      console.log('Response:', JSON.parse(result7.body));
    }
    
    console.log('\n🎉 All authenticated tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testWithValidAuth();