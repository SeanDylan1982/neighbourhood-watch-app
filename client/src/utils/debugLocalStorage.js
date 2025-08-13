/**
 * Debug utility to check what's actually stored in localStorage
 * Run this in the browser console: window.debugLocalStorage()
 */

window.debugLocalStorage = function() {
  console.log('=== LOCALSTORAGE DEBUG ===');
  console.log('Total items in localStorage:', localStorage.length);
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    allKeys.push(localStorage.key(i));
  }
  
  console.log('All localStorage keys:', allKeys);
  
  // Check for chat-related keys
  const chatKeys = allKeys.filter(key => 
    key.includes('chat') || 
    key.includes('message') || 
    key.includes('neibrly')
  );
  
  console.log('Chat-related keys:', chatKeys);
  
  // Show content of chat-related keys
  chatKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value);
      console.log(`${key}:`, parsed);
    } catch (error) {
      console.log(`${key} (raw):`, localStorage.getItem(key));
    }
  });
  
  // Check for the specific keys I created
  const expectedKeys = [
    'neibrly_chat_groups',
    'neibrly_chat_messages', 
    'neibrly_chat_cache_meta',
    'neibrly_user_data'
  ];
  
  console.log('Expected chat cache keys:');
  expectedKeys.forEach(key => {
    const exists = localStorage.getItem(key) !== null;
    console.log(`${key}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  Content:`, data);
      } catch (e) {
        console.log(`  Raw content:`, localStorage.getItem(key));
      }
    }
  });
  
  return {
    totalKeys: localStorage.length,
    allKeys,
    chatKeys,
    expectedKeysStatus: expectedKeys.map(key => ({
      key,
      exists: localStorage.getItem(key) !== null
    }))
  };
};

// Also create a function to manually populate localStorage with test data
window.populateTestChatData = function() {
  const testChatGroups = [
    {
      id: "test-group-1",
      name: "Test Group 1", 
      memberCount: 5,
      messageCount: 10
    },
    {
      id: "test-group-2",
      name: "Test Group 2",
      memberCount: 3, 
      messageCount: 7
    }
  ];
  
  const testMessages = {
    "test-group-1": {
      data: [
        {
          id: "msg-1",
          content: "Hello everyone!",
          sender: "Test User",
          timestamp: new Date().toISOString()
        },
        {
          id: "msg-2", 
          content: "How is everyone doing?",
          sender: "Another User",
          timestamp: new Date().toISOString()
        }
      ],
      timestamp: new Date().toISOString(),
      count: 2,
      chatId: "test-group-1"
    }
  };
  
  // Store using the ChatCacheService keys
  localStorage.setItem('neibrly_chat_groups', JSON.stringify({
    data: testChatGroups,
    timestamp: new Date().toISOString(),
    count: testChatGroups.length
  }));
  
  localStorage.setItem('neibrly_chat_messages', JSON.stringify(testMessages));
  
  localStorage.setItem('neibrly_chat_cache_meta', JSON.stringify({
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }));
  
  console.log('✅ Test chat data populated in localStorage');
  console.log('Run debugLocalStorage() to verify');
};

console.log('Debug functions loaded:');
console.log('- debugLocalStorage() - Check what\'s in localStorage');
console.log('- populateTestChatData() - Add test chat data');

export { debugLocalStorage, populateTestChatData };