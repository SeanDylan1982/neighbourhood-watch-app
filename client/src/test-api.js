// Simple API test - run this in browser console
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5001/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@neighbourhood.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login test:', loginData);
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Run the test
testAPI();