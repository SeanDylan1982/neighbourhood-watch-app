/**
 * Test utility to verify chat cache functionality
 * Add this to your browser console to test the cache
 */

import ChatCacheService from '../services/ChatCacheService';

// Make it available globally for browser console testing
window.testChatCache = function() {
  console.log('=== TESTING CHAT CACHE ===');
  
  // Test 1: Check if cache is initialized
  console.log('1. Cache validity:', ChatCacheService.isCacheValid());
  
  // Test 2: Get current cache stats
  const stats = ChatCacheService.getCacheStats();
  console.log('2. Cache stats:', stats);
  
  // Test 3: Check what's in localStorage
  const expectedKeys = [
    'neibrly_chat_groups',
    'neibrly_chat_messages', 
    'neibrly_chat_cache_meta',
    'neibrly_user_data'
  ];
  
  console.log('3. localStorage keys check:');
  expectedKeys.forEach(key => {
    const exists = localStorage.getItem(key) !== null;
    console.log(`   ${key}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    if (exists) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (key === 'neibrly_chat_messages') {
          const chatIds = Object.keys(data);
          console.log(`     Contains messages for ${chatIds.length} chats:`, chatIds);
          chatIds.forEach(chatId => {
            console.log(`       ${chatId}: ${data[chatId].count} messages`);
          });
        } else if (key === 'neibrly_chat_groups') {
          console.log(`     Contains ${data.count} chat groups`);
        } else {
          console.log(`     Content:`, data);
        }
      } catch (e) {
        console.log(`     Raw content:`, localStorage.getItem(key));
      }
    }
  });
  
  // Test 4: Try to manually store some test data
  console.log('4. Testing manual data storage...');
  
  const testGroups = [
    { id: 'test-1', name: 'Test Group 1', messageCount: 5 },
    { id: 'test-2', name: 'Test Group 2', messageCount: 3 }
  ];
  
  const testMessages = [
    { id: 'msg-1', content: 'Hello!', sender: 'User 1', timestamp: new Date().toISOString() },
    { id: 'msg-2', content: 'Hi there!', sender: 'User 2', timestamp: new Date().toISOString() }
  ];
  
  // Store test data
  const groupsStored = ChatCacheService.storeChatGroups(testGroups);
  const messagesStored = ChatCacheService.storeChatMessages('test-1', testMessages);
  
  console.log('   Groups stored:', groupsStored);
  console.log('   Messages stored:', messagesStored);
  
  // Test 5: Try to retrieve the test data
  console.log('5. Testing data retrieval...');
  const retrievedGroups = ChatCacheService.getChatGroups();
  const retrievedMessages = ChatCacheService.getChatMessages('test-1');
  
  console.log('   Retrieved groups:', retrievedGroups);
  console.log('   Retrieved messages:', retrievedMessages);
  
  // Test 6: Get debug info
  console.log('6. Debug info:');
  const debugInfo = ChatCacheService.getDebugInfo();
  console.log(debugInfo);
  
  return {
    cacheValid: ChatCacheService.isCacheValid(),
    stats,
    debugInfo,
    testResults: {
      groupsStored,
      messagesStored,
      retrievedGroups,
      retrievedMessages
    }
  };
};

// Also create a function to clear cache for testing
window.clearChatCache = function() {
  console.log('🗑️ Clearing chat cache...');
  const cleared = ChatCacheService.clearCache();
  console.log('Cache cleared:', cleared);
  
  // Verify it's cleared
  const expectedKeys = [
    'neibrly_chat_groups',
    'neibrly_chat_messages', 
    'neibrly_chat_cache_meta',
    'neibrly_user_data'
  ];
  
  expectedKeys.forEach(key => {
    const exists = localStorage.getItem(key) !== null;
    console.log(`${key}: ${exists ? '❌ STILL EXISTS' : '✅ CLEARED'}`);
  });
  
  return cleared;
};

// Function to manually trigger cache preload
window.triggerCachePreload = async function() {
  console.log('🚀 Manually triggering cache preload...');
  
  // This would need to be called from within a React component that has access to the hook
  console.log('⚠️ This function needs to be called from within the Chat component');
  console.log('Try running: window.chatComponent?.preloadChatData()');
};

console.log('Chat cache test functions loaded:');
console.log('- testChatCache() - Test cache functionality');
console.log('- clearChatCache() - Clear all cache data');
console.log('- triggerCachePreload() - Trigger cache preload');

export { testChatCache, clearChatCache, triggerCachePreload };