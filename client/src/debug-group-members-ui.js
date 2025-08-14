/**
 * Debug script to test group members UI functionality
 * This will help identify why member names are not displaying
 */

// Test the API endpoint directly
async function testGroupMembersAPI() {
  console.log('🔍 Testing Group Members API...');
  
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      return;
    }
    
    console.log('✅ Found auth token');
    
    // First, get the list of groups to find a group ID
    const groupsResponse = await fetch('/api/chat/groups', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!groupsResponse.ok) {
      console.error('❌ Failed to fetch groups:', groupsResponse.status, groupsResponse.statusText);
      return;
    }
    
    const groups = await groupsResponse.json();
    console.log('✅ Groups response:', groups);
    
    if (!groups || groups.length === 0) {
      console.log('❌ No groups found');
      return;
    }
    
    // Test the members endpoint for the first group
    const testGroupId = groups[0].id;
    console.log('🧪 Testing members endpoint for group:', testGroupId);
    
    const membersResponse = await fetch(`/api/chat/groups/${testGroupId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Members API response status:', membersResponse.status);
    
    if (!membersResponse.ok) {
      const errorText = await membersResponse.text();
      console.error('❌ Members API failed:', membersResponse.status, errorText);
      return;
    }
    
    const members = await membersResponse.json();
    console.log('✅ Members API response:', members);
    
    // Validate member data structure
    if (Array.isArray(members)) {
      console.log(`✅ Members is array with ${members.length} items`);
      
      members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          fullName: member.fullName,
          displayName: member.displayName
        });
      });
    } else {
      console.error('❌ Members response is not an array:', typeof members);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

// Test the frontend state
function testFrontendState() {
  console.log('🔍 Testing Frontend State...');
  
  // Check if we're in the chat page
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath);
  
  // Look for React components in the DOM
  const chatElements = document.querySelectorAll('[data-testid*="chat"], [class*="chat"], [class*="Chat"]');
  console.log('Found chat elements:', chatElements.length);
  
  // Check for member-related elements
  const memberElements = document.querySelectorAll('[class*="member"], [class*="Member"]');
  console.log('Found member elements:', memberElements.length);
  
  // Check localStorage for cached data
  const keys = Object.keys(localStorage);
  const chatKeys = keys.filter(key => key.includes('chat') || key.includes('member'));
  console.log('Chat-related localStorage keys:', chatKeys);
  
  chatKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, JSON.parse(value));
    } catch (e) {
      console.log(`${key}:`, value);
    }
  });
}

// Test member display logic
function testMemberDisplayLogic() {
  console.log('🔍 Testing Member Display Logic...');
  
  // Mock member data
  const mockMembers = [
    {
      _id: '1',
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'admin',
      profileImageUrl: 'https://example.com/alice.jpg'
    },
    {
      _id: '2',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'member',
      profileImageUrl: null
    }
  ];
  
  // Test enhancement logic
  const enhancedMembers = mockMembers.map(member => ({
    ...member,
    id: member._id,
    fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
    displayName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
    initials: getInitials(member.firstName, member.lastName),
    hasProfileImage: !!member.profileImageUrl
  }));
  
  console.log('✅ Enhanced members:', enhancedMembers);
  
  // Test sorting logic
  const sortedMembers = [...enhancedMembers].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const aOrder = roleOrder[a.role?.toLowerCase()] ?? 2;
    const bOrder = roleOrder[b.role?.toLowerCase()] ?? 2;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    return a.displayName.localeCompare(b.displayName);
  });
  
  console.log('✅ Sorted members:', sortedMembers);
}

// Helper function
function getInitials(firstName, lastName) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  } else if (first) {
    return first.charAt(0).toUpperCase();
  } else if (last) {
    return last.charAt(0).toUpperCase();
  }
  
  return '?';
}

// Main debug function
async function debugGroupMembersUI() {
  console.log('🚀 Starting Group Members UI Debug...\n');
  
  // Test 1: API functionality
  await testGroupMembersAPI();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Frontend state
  testFrontendState();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Display logic
  testMemberDisplayLogic();
  
  console.log('\n✅ Debug complete! Check the console output above for issues.');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  // Add to window for manual testing
  window.debugGroupMembersUI = debugGroupMembersUI;
  window.testGroupMembersAPI = testGroupMembersAPI;
  
  console.log('🔧 Group Members UI Debug tools loaded!');
  console.log('Run debugGroupMembersUI() to start debugging');
  console.log('Run testGroupMembersAPI() to test API only');
}

export { debugGroupMembersUI, testGroupMembersAPI, testFrontendState, testMemberDisplayLogic };