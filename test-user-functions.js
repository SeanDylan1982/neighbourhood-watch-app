// Test script for user management serverless functions
const axios = require('axios');

// Configuration
const BASE_URL = process.env.NETLIFY_FUNCTIONS_URL || 'http://localhost:8888/.netlify/functions';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

// Test authentication first
async function authenticateUser() {
  try {
    console.log('🔐 Authenticating user...');
    const response = await axios.post(`${BASE_URL}/auth-login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (response.data.token) {
      console.log('✅ Authentication successful');
      return response.data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-me function (GET)
async function testUsersMe(token) {
  try {
    console.log('\n📋 Testing GET /users-me...');
    const response = await axios.get(`${BASE_URL}/users-me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GET /users-me successful');
    console.log('User data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ GET /users-me failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-me function (PUT)
async function testUpdateUsersMe(token) {
  try {
    console.log('\n✏️ Testing PUT /users-me...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'User',
      phone: '+1234567890',
      address: '123 Test Street, Test City'
    };
    
    const response = await axios.put(`${BASE_URL}/users-me`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ PUT /users-me successful');
    console.log('Updated user data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ PUT /users-me failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-profile function (GET)
async function testUsersProfile(token) {
  try {
    console.log('\n📋 Testing GET /users-profile...');
    const response = await axios.get(`${BASE_URL}/users-profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GET /users-profile successful');
    console.log('Profile data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ GET /users-profile failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-profile function (PUT)
async function testUpdateUsersProfile(token) {
  try {
    console.log('\n✏️ Testing PUT /users-profile...');
    const updateData = {
      firstName: 'Profile',
      lastName: 'Updated',
      bio: 'This is my updated bio for testing purposes.',
      phone: '+9876543210'
    };
    
    const response = await axios.put(`${BASE_URL}/users-profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ PUT /users-profile successful');
    console.log('Updated profile data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ PUT /users-profile failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-settings function (GET)
async function testUsersSettings(token) {
  try {
    console.log('\n⚙️ Testing GET /users-settings...');
    const response = await axios.get(`${BASE_URL}/users-settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GET /users-settings successful');
    console.log('Settings data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ GET /users-settings failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test users-settings function (PUT)
async function testUpdateUsersSettings(token) {
  try {
    console.log('\n⚙️ Testing PUT /users-settings...');
    const settingsData = {
      emailNotifications: false,
      chatNotifications: true,
      locationSharing: true,
      privacyLevel: 'neighbours',
      dismissedWelcomeMessages: {
        chat: true,
        noticeBoard: false
      },
      welcomeMessageStates: {
        chat: {
          dismissed: true,
          collapsed: false
        },
        reports: {
          dismissed: false,
          collapsed: true
        }
      }
    };
    
    const response = await axios.put(`${BASE_URL}/users-settings`, settingsData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ PUT /users-settings successful');
    console.log('Updated settings:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ PUT /users-settings failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test error handling
async function testErrorHandling(token) {
  try {
    console.log('\n🚫 Testing error handling...');
    
    // Test invalid JSON
    try {
      await axios.put(`${BASE_URL}/users-me`, 'invalid json', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid JSON error handling works');
      } else {
        console.log('⚠️ Unexpected error for invalid JSON:', error.response?.status);
      }
    }
    
    // Test missing authorization
    try {
      await axios.get(`${BASE_URL}/users-me`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Missing authorization error handling works');
      } else {
        console.log('⚠️ Unexpected error for missing auth:', error.response?.status);
      }
    }
    
    // Test invalid method
    try {
      await axios.delete(`${BASE_URL}/users-me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 405) {
        console.log('✅ Invalid method error handling works');
      } else {
        console.log('⚠️ Unexpected error for invalid method:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🧪 Starting user management functions tests...\n');
    
    // Authenticate first
    const token = await authenticateUser();
    
    // Test all user functions
    await testUsersMe(token);
    await testUpdateUsersMe(token);
    await testUsersProfile(token);
    await testUpdateUsersProfile(token);
    await testUsersSettings(token);
    await testUpdateUsersSettings(token);
    
    // Test error handling
    await testErrorHandling(token);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  authenticateUser,
  testUsersMe,
  testUpdateUsersMe,
  testUsersProfile,
  testUpdateUsersProfile,
  testUsersSettings,
  testUpdateUsersSettings
};