/**
 * Admin Dashboard Test Utility
 * 
 * This script can be pasted into the browser console when logged in as an admin
 * to test various admin dashboard functionality.
 */

// Test admin stats
async function testAdminStats() {
  console.group('Testing Admin Stats');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    console.log('Stats data:', data);
    console.log('Test passed: Admin stats API working');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.groupEnd();
}

// Test system stats
async function testSystemStats() {
  console.group('Testing System Stats');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch('/api/admin/system-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    console.log('System stats data:', data);
    
    // Verify data structure
    const requiredSections = ['users', 'content', 'engagement', 'performance'];
    const missingSection = requiredSections.find(section => !data[section]);
    
    if (missingSection) {
      console.error(`Missing section: ${missingSection}`);
    } else {
      console.log('Test passed: System stats API working with correct structure');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.groupEnd();
}

// Test user management
async function testUserManagement() {
  console.group('Testing User Management');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const users = await response.json();
    console.log(`Found ${users.length} users`);
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log('Sample user:', {
        id: firstUser._id,
        name: `${firstUser.firstName} ${firstUser.lastName}`,
        email: firstUser.email,
        role: firstUser.role,
        status: firstUser.status
      });
    }
    
    console.log('Test passed: User management API working');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.groupEnd();
}

// Test content moderation
async function testContentModeration() {
  console.group('Testing Content Moderation');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    
    // Test notices
    const noticesResponse = await fetch('/api/notices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!noticesResponse.ok) throw new Error(`HTTP error ${noticesResponse.status}`);
    
    const notices = await noticesResponse.json();
    console.log(`Found ${notices.length} notices`);
    
    // Test reports
    const reportsResponse = await fetch('/api/reports', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!reportsResponse.ok) throw new Error(`HTTP error ${reportsResponse.status}`);
    
    const reports = await reportsResponse.json();
    console.log(`Found ${reports.length} reports`);
    
    console.log('Test passed: Content moderation APIs working');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.groupEnd();
}

// Test audit logs
async function testAuditLogs() {
  console.group('Testing Audit Logs');
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch('/api/admin/audit-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    console.log(`Found ${data.logs.length} audit logs`);
    console.log('Pagination:', {
      page: data.page,
      totalPages: data.totalPages,
      total: data.total
    });
    
    console.log('Test passed: Audit logs API working');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.groupEnd();
}

// Run all tests
async function runAllTests() {
  console.log('Starting Admin Dashboard Tests...');
  
  await testAdminStats();
  await testSystemStats();
  await testUserManagement();
  await testContentModeration();
  await testAuditLogs();
  
  console.log('All tests completed!');
}

// Export functions to global scope
window.testAdminStats = testAdminStats;
window.testSystemStats = testSystemStats;
window.testUserManagement = testUserManagement;
window.testContentModeration = testContentModeration;
window.testAuditLogs = testAuditLogs;
window.runAllTests = runAllTests;

console.log('Admin Dashboard Test Utility loaded!');
console.log('Run tests using: runAllTests() or individual test functions');