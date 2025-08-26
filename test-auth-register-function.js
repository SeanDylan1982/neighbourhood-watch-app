const axios = require('axios');

async function testAuthRegister() {
  console.log('🧪 Testing auth-register Netlify Function...');
  
  const testUser = {
    email: 'test-netlify@example.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    address: '123 Test Street',
    acceptedTerms: {
      termsOfService: true,
      privacyPolicy: true
    }
  };

  try {
    // Test the function locally (assuming Netlify CLI is running)
    const response = await axios.post('http://localhost:8888/.netlify/functions/auth-register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    throw error;
  }
}

// Run the test
testAuthRegister()
  .then(() => {
    console.log('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch(() => {
    console.log('💥 Test failed');
    process.exit(1);
  });