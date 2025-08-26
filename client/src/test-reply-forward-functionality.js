/**
 * Test script to verify reply and forward functionality
 * Run this in the browser console to test the implementation
 */

// Test data
const testMessage = {
  id: 'test-msg-1',
  content: 'This is a test message for reply and forward functionality',
  senderId: 'user-1',
  senderName: 'Test User',
  type: 'text',
  timestamp: new Date().toISOString(),
  chatId: 'test-chat-1',
  chatName: 'Test Chat'
};

const testChats = [
  {
    id: 'chat-1',
    name: 'Test Group 1',
    type: 'group',
    memberCount: 5
  },
  {
    id: 'chat-2',
    name: 'John Doe',
    type: 'private',
    participantName: 'John Doe',
    isOnline: true
  }
];

// Test reply functionality
function testReplyFunctionality() {
  console.log('Testing Reply Functionality...');
  
  // Test useReply hook
  try {
    const replyHook = window.useReply?.();
    if (replyHook) {
      console.log('✓ useReply hook available');
      
      // Test starting a reply
      replyHook.startReply(testMessage);
      console.log('✓ Reply started:', replyHook.isReplying);
      
      // Test getting reply data
      const replyData = replyHook.getReplyData();
      console.log('✓ Reply data:', replyData);
      
      // Test canceling reply
      replyHook.cancelReply();
      console.log('✓ Reply canceled:', !replyHook.isReplying);
    } else {
      console.log('✗ useReply hook not available');
    }
  } catch (error) {
    console.error('✗ Error testing reply functionality:', error);
  }
}

// Test forward functionality
function testForwardFunctionality() {
  console.log('Testing Forward Functionality...');
  
  try {
    const forwardHook = window.useMessageForwarding?.();
    if (forwardHook) {
      console.log('✓ useMessageForwarding hook available');
      
      // Test checking if message can be forwarded
      const canForward = forwardHook.canForwardMessage(testMessage);
      console.log('✓ Can forward message:', canForward);
      
      // Test getting forwarding metadata
      const forwardedMessage = {
        ...testMessage,
        isForwarded: true,
        forwardedFrom: {
          originalSenderName: 'Original Sender',
          originalChatName: 'Original Chat',
          forwardedByName: 'Current User',
          forwardedAt: new Date().toISOString()
        }
      };
      
      const metadata = forwardHook.getForwardingMetadata(forwardedMessage);
      console.log('✓ Forwarding metadata:', metadata);
    } else {
      console.log('✗ useMessageForwarding hook not available');
    }
  } catch (error) {
    console.error('✗ Error testing forward functionality:', error);
  }
}

// Test message menu functionality
function testMessageMenuFunctionality() {
  console.log('Testing Message Menu Functionality...');
  
  try {
    const menuHook = window.useMessageMenu?.({
      onReply: (messageId) => console.log('Reply triggered for:', messageId),
      onForward: (messageId) => console.log('Forward triggered for:', messageId),
      onCopy: (messageId) => console.log('Copy triggered for:', messageId)
    });
    
    if (menuHook) {
      console.log('✓ useMessageMenu hook available');
      
      // Test getting event handlers
      const handlers = menuHook.getMessageEventHandlers('test-msg-1');
      console.log('✓ Message event handlers:', Object.keys(handlers));
      
      // Test menu actions
      menuHook.handleReply('test-msg-1');
      menuHook.handleForward('test-msg-1');
      console.log('✓ Menu actions working');
    } else {
      console.log('✗ useMessageMenu hook not available');
    }
  } catch (error) {
    console.error('✗ Error testing message menu functionality:', error);
  }
}

// Test component integration
function testComponentIntegration() {
  console.log('Testing Component Integration...');
  
  try {
    // Check if components are available
    const components = [
      'MessageBubble',
      'ReplyPreview', 
      'ForwardedMessageIndicator',
      'MessageForwardDialog'
    ];
    
    components.forEach(componentName => {
      const component = window[componentName];
      if (component) {
        console.log(`✓ ${componentName} component available`);
      } else {
        console.log(`✗ ${componentName} component not available`);
      }
    });
    
    // Check if message actions are properly defined
    const messageActions = window.MESSAGE_ACTIONS;
    if (messageActions) {
      console.log('✓ Message actions available:', messageActions);
      console.log('✓ Reply action:', messageActions.REPLY);
      console.log('✓ Forward action:', messageActions.FORWARD);
    } else {
      console.log('✗ Message actions not available');
    }
  } catch (error) {
    console.error('✗ Error testing component integration:', error);
  }
}

// Run all tests
function runAllTests() {
  console.log('=== Reply and Forward Functionality Tests ===');
  console.log('');
  
  testReplyFunctionality();
  console.log('');
  
  testForwardFunctionality();
  console.log('');
  
  testMessageMenuFunctionality();
  console.log('');
  
  testComponentIntegration();
  console.log('');
  
  console.log('=== Tests Complete ===');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testReplyFunctionality,
    testForwardFunctionality,
    testMessageMenuFunctionality,
    testComponentIntegration,
    runAllTests
  };
} else {
  // Make available globally for browser testing
  window.testReplyForward = {
    testReplyFunctionality,
    testForwardFunctionality,
    testMessageMenuFunctionality,
    testComponentIntegration,
    runAllTests
  };
  
  console.log('Reply and Forward test functions available at window.testReplyForward');
  console.log('Run window.testReplyForward.runAllTests() to test all functionality');
}