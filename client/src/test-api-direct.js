// Direct API test without useApi hook
async function testDirectAPI() {
  const token = localStorage.getItem('token');
  const baseURL = 'http://localhost:5001';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    console.log('Testing dashboard endpoint directly...');
    const dashboardResponse = await fetch(`${baseURL}/api/statistics/dashboard`, {
      method: 'GET',
      headers
    });
    
    console.log('Dashboard response status:', dashboardResponse.status);
    console.log('Dashboard response ok:', dashboardResponse.ok);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard data:', dashboardData);
    } else {
      console.error('Dashboard response not ok');
    }

    console.log('Testing notices endpoint directly...');
    const noticesResponse = await fetch(`${baseURL}/api/statistics/recent-notices?limit=3`, {
      method: 'GET',
      headers
    });
    
    console.log('Notices response status:', noticesResponse.status);
    console.log('Notices response ok:', noticesResponse.ok);
    
    if (noticesResponse.ok) {
      const noticesData = await noticesResponse.json();
      console.log('Notices data:', noticesData);
    } else {
      console.error('Notices response not ok');
    }

  } catch (error) {
    console.error('Direct API test error:', error);
  }
}

// Run the test
testDirectAPI();