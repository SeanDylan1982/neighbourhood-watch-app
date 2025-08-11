// Simple debug script to test admin endpoints
// Run this in the browser console when logged in as admin
import { Analytics } from "@vercel/analytics/react";
async function testAdminEndpoints() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('Testing admin endpoints...');

  try {
    // Test admin stats
    console.log('\n1. Testing /api/admin/stats');
    const statsResponse = await fetch('/api/admin/stats', { headers });
    const statsData = await statsResponse.json();
    console.log('Stats response:', statsData);

    // Test users endpoint
    console.log('\n2. Testing /api/users');
    const usersResponse = await fetch('/api/users', { headers });
    const usersData = await usersResponse.json();
    console.log('Users response:', usersData);

    // Test system stats
    console.log('\n3. Testing /api/admin/system-stats');
    const systemStatsResponse = await fetch('/api/admin/system-stats', { headers });
    const systemStatsData = await systemStatsResponse.json();
    console.log('System stats response:', systemStatsData);

    // Test audit logs
    console.log('\n4. Testing /api/admin/audit-logs');
    const auditResponse = await fetch('/api/admin/audit-logs', { headers });
    const auditData = await auditResponse.json();
    console.log('Audit logs response:', auditData);

  } catch (error) {
    console.error('Error testing admin endpoints:', error);
  }
}

// Test regular dashboard endpoints too
async function testDashboardEndpoints() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('Testing dashboard endpoints...');

  try {
    // Test dashboard stats
    console.log('\n1. Testing /api/statistics/dashboard');
    const dashboardResponse = await fetch('/api/statistics/dashboard', { headers });
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard response:', dashboardData);

    // Test recent notices
    console.log('\n2. Testing /api/statistics/recent-notices');
    const noticesResponse = await fetch('/api/statistics/recent-notices?limit=3', { headers });
    const noticesData = await noticesResponse.json();
    console.log('Recent notices response:', noticesData);

    // Test recent reports
    console.log('\n3. Testing /api/statistics/recent-reports');
    const reportsResponse = await fetch('/api/statistics/recent-reports?limit=3', { headers });
    const reportsData = await reportsResponse.json();
    console.log('Recent reports response:', reportsData);

  } catch (error) {
    console.error('Error testing dashboard endpoints:', error);
  }
}

// Export functions to global scope for console use
window.testAdminEndpoints = testAdminEndpoints;
window.testDashboardEndpoints = testDashboardEndpoints;

console.log('Debug functions loaded. Run testAdminEndpoints() or testDashboardEndpoints() in console.');