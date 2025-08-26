/**
 * Simple test to create messages with reply and forward data
 */

const mongoose = require('mongoose');
const Message = require('./models/Message');

// Test creating a message with reply data
function testReplyMessage() {
  console.log('Testing reply message creation...');
  
  const replyMessage = new Message({
    chatId: new mongoose.Types.ObjectId(),
    chatType: 'group',
    senderId: new mongoose.Types.ObjectId(),
    senderName: 'Test User',
    content: 'This is a reply message',
    messageType: 'text',
    replyTo: {
      messageId: new mongoose.Types.ObjectId(),
      content: 'Original message content',
      senderName: 'Original Sender',
      type: 'text'
    }
  });
  
  // Validate the message
  const validationError = replyMessage.validateSync();
  if (validationError) {
    console.log('✗ Reply message validation failed:', validationError.message);
    return false;
  } else {
    console.log('✓ Reply message validation passed');
    console.log('  - Reply to message ID:', replyMessage.replyTo.messageId);
    console.log('  - Reply to content:', replyMessage.replyTo.content);
    console.log('  - Reply to sender:', replyMessage.replyTo.senderName);
    return true;
  }
}

// Test creating a message with forward data
function testForwardMessage() {
  console.log('\nTesting forward message creation...');
  
  const forwardMessage = new Message({
    chatId: new mongoose.Types.ObjectId(),
    chatType: 'group',
    senderId: new mongoose.Types.ObjectId(),
    senderName: 'Test User',
    content: 'This is a forwarded message',
    messageType: 'text',
    isForwarded: true,
    forwardedFrom: {
      messageId: new mongoose.Types.ObjectId(),
      originalSenderId: new mongoose.Types.ObjectId(),
      originalSenderName: 'Original Sender',
      originalChatId: new mongoose.Types.ObjectId(),
      originalChatName: 'Original Chat',
      forwardedBy: new mongoose.Types.ObjectId(),
      forwardedByName: 'Forwarder',
      forwardedAt: new Date()
    }
  });
  
  // Validate the message
  const validationError = forwardMessage.validateSync();
  if (validationError) {
    console.log('✗ Forward message validation failed:', validationError.message);
    return false;
  } else {
    console.log('✓ Forward message validation passed');
    console.log('  - Is forwarded:', forwardMessage.isForwarded);
    console.log('  - Original sender:', forwardMessage.forwardedFrom.originalSenderName);
    console.log('  - Original chat:', forwardMessage.forwardedFrom.originalChatName);
    console.log('  - Forwarded by:', forwardMessage.forwardedFrom.forwardedByName);
    return true;
  }
}

// Test creating a message with both reply and forward data
function testReplyForwardMessage() {
  console.log('\nTesting message with both reply and forward data...');
  
  const complexMessage = new Message({
    chatId: new mongoose.Types.ObjectId(),
    chatType: 'group',
    senderId: new mongoose.Types.ObjectId(),
    senderName: 'Test User',
    content: 'This is a forwarded reply message',
    messageType: 'text',
    replyTo: {
      messageId: new mongoose.Types.ObjectId(),
      content: 'Original message being replied to',
      senderName: 'Original Sender',
      type: 'text'
    },
    isForwarded: true,
    forwardedFrom: {
      messageId: new mongoose.Types.ObjectId(),
      originalSenderId: new mongoose.Types.ObjectId(),
      originalSenderName: 'Original Sender',
      originalChatId: new mongoose.Types.ObjectId(),
      originalChatName: 'Original Chat',
      forwardedBy: new mongoose.Types.ObjectId(),
      forwardedByName: 'Forwarder',
      forwardedAt: new Date()
    }
  });
  
  // Validate the message
  const validationError = complexMessage.validateSync();
  if (validationError) {
    console.log('✗ Complex message validation failed:', validationError.message);
    return false;
  } else {
    console.log('✓ Complex message validation passed');
    console.log('  - Has reply data:', !!complexMessage.replyTo);
    console.log('  - Has forward data:', complexMessage.isForwarded);
    return true;
  }
}

// Run all tests
function runTests() {
  console.log('=== Message Creation Tests ===\n');
  
  const results = {
    reply: testReplyMessage(),
    forward: testForwardMessage(),
    complex: testReplyForwardMessage()
  };
  
  console.log('\n=== Test Results ===');
  console.log('Reply message:', results.reply ? 'PASS' : 'FAIL');
  console.log('Forward message:', results.forward ? 'PASS' : 'FAIL');
  console.log('Complex message:', results.complex ? 'PASS' : 'FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\nOverall result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  
  return allPassed;
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testReplyMessage,
  testForwardMessage,
  testReplyForwardMessage,
  runTests
};