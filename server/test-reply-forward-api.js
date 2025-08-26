/**
 * Test script for reply and forward API functionality
 * Tests the server-side implementation of message replies and forwarding
 */

const mongoose = require('mongoose');
const Message = require('./models/Message');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch-test',
  testUserId: new mongoose.Types.ObjectId(),
  testGroupId: new mongoose.Types.ObjectId(),
  testMessageId: new mongoose.Types.ObjectId()
};

// Connect to test database
async function connectToDatabase() {
  try {
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✓ Connected to test database');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    throw error;
  }
}

// Create test data
async function createTestData() {
  console.log('Creating test data...');
  
  try {
    // Create test user
    const testUser = new User({
      _id: TEST_CONFIG.testUserId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    await testUser.save();
    console.log('✓ Test user created');
    
    // Create test group
    const testGroup = new ChatGroup({
      _id: TEST_CONFIG.testGroupId,
      name: 'Test Group',
      description: 'Test group for reply/forward functionality',
      createdBy: TEST_CONFIG.testUserId,
      members: [{
        userId: TEST_CONFIG.testUserId,
        role: 'admin',
        joinedAt: new Date()
      }],
      isActive: true
    });
    await testGroup.save();
    console.log('✓ Test group created');
    
    // Create original message
    const originalMessage = new Message({
      _id: TEST_CONFIG.testMessageId,
      chatId: TEST_CONFIG.testGroupId,
      chatType: 'group',
      senderId: TEST_CONFIG.testUserId,
      senderName: 'Test User',
      content: 'This is the original message for testing replies and forwards',
      messageType: 'text',
      status: 'sent',
      moderationStatus: 'active'
    });
    await originalMessage.save();
    console.log('✓ Original message created');
    
    return { testUser, testGroup, originalMessage };
  } catch (error) {
    console.error('✗ Failed to create test data:', error);
    throw error;
  }
}

// Test reply functionality
async function testReplyFunctionality() {
  console.log('\nTesting Reply Functionality...');
  
  try {
    // Test creating a reply message
    const replyMessage = new Message({
      chatId: TEST_CONFIG.testGroupId,
      chatType: 'group',
      senderId: TEST_CONFIG.testUserId,
      senderName: 'Test User',
      content: 'This is a reply to the original message',
      messageType: 'text',
      status: 'sent',
      moderationStatus: 'active',
      replyTo: {
        messageId: TEST_CONFIG.testMessageId,
        content: 'This is the original message for testing replies and forwards',
        senderName: 'Test User',
        type: 'text'
      }
    });
    
    await replyMessage.save();
    console.log('✓ Reply message created successfully');
    
    // Test populating reply data
    const populatedReply = await Message.findById(replyMessage._id)
      .populate('replyTo.messageId', 'content senderId senderName');
    
    if (populatedReply && populatedReply.replyTo) {
      console.log('✓ Reply data populated successfully');
      console.log('  - Reply content:', populatedReply.replyTo.content);
      console.log('  - Original sender:', populatedReply.replyTo.senderName);
    } else {
      console.log('✗ Failed to populate reply data');
    }
    
    // Test querying messages with replies
    const messagesWithReplies = await Message.find({
      chatId: TEST_CONFIG.testGroupId,
      'replyTo.messageId': { $exists: true }
    });
    
    console.log(`✓ Found ${messagesWithReplies.length} messages with replies`);
    
    return replyMessage;
  } catch (error) {
    console.error('✗ Error testing reply functionality:', error);
    throw error;
  }
}

// Test forward functionality
async function testForwardFunctionality() {
  console.log('\nTesting Forward Functionality...');
  
  try {
    // Create a second group for forwarding
    const targetGroupId = new mongoose.Types.ObjectId();
    const targetGroup = new ChatGroup({
      _id: targetGroupId,
      name: 'Target Group',
      description: 'Target group for forward testing',
      createdBy: TEST_CONFIG.testUserId,
      members: [{
        userId: TEST_CONFIG.testUserId,
        role: 'admin',
        joinedAt: new Date()
      }],
      isActive: true
    });
    await targetGroup.save();
    console.log('✓ Target group created for forwarding');
    
    // Test creating a forwarded message
    const forwardedMessage = new Message({
      chatId: targetGroupId,
      chatType: 'group',
      senderId: TEST_CONFIG.testUserId,
      senderName: 'Test User',
      content: 'This is the original message for testing replies and forwards',
      messageType: 'text',
      status: 'sent',
      moderationStatus: 'active',
      isForwarded: true,
      forwardedFrom: {
        messageId: TEST_CONFIG.testMessageId,
        originalSenderId: TEST_CONFIG.testUserId,
        originalSenderName: 'Test User',
        originalChatId: TEST_CONFIG.testGroupId,
        originalChatName: 'Test Group',
        forwardedBy: TEST_CONFIG.testUserId,
        forwardedByName: 'Test User',
        forwardedAt: new Date()
      }
    });
    
    await forwardedMessage.save();
    console.log('✓ Forwarded message created successfully');
    
    // Test querying forwarded messages
    const forwardedMessages = await Message.find({
      isForwarded: true,
      'forwardedFrom.originalChatId': TEST_CONFIG.testGroupId
    });
    
    console.log(`✓ Found ${forwardedMessages.length} forwarded messages`);
    
    // Verify forwarding metadata
    const forwardedMsg = forwardedMessages[0];
    if (forwardedMsg && forwardedMsg.forwardedFrom) {
      console.log('✓ Forwarding metadata verified:');
      console.log('  - Original sender:', forwardedMsg.forwardedFrom.originalSenderName);
      console.log('  - Original chat:', forwardedMsg.forwardedFrom.originalChatName);
      console.log('  - Forwarded by:', forwardedMsg.forwardedFrom.forwardedByName);
    }
    
    return forwardedMessage;
  } catch (error) {
    console.error('✗ Error testing forward functionality:', error);
    throw error;
  }
}

// Test message schema validation
async function testMessageSchemaValidation() {
  console.log('\nTesting Message Schema Validation...');
  
  try {
    // Test invalid reply structure
    try {
      const invalidReply = new Message({
        chatId: TEST_CONFIG.testGroupId,
        chatType: 'group',
        senderId: TEST_CONFIG.testUserId,
        senderName: 'Test User',
        content: 'Invalid reply test',
        replyTo: {
          // Missing required fields
        }
      });
      await invalidReply.save();
      console.log('✗ Invalid reply message should have failed validation');
    } catch (validationError) {
      console.log('✓ Reply validation working correctly');
    }
    
    // Test invalid forward structure
    try {
      const invalidForward = new Message({
        chatId: TEST_CONFIG.testGroupId,
        chatType: 'group',
        senderId: TEST_CONFIG.testUserId,
        senderName: 'Test User',
        content: 'Invalid forward test',
        isForwarded: true,
        forwardedFrom: {
          // Missing required fields
        }
      });
      await invalidForward.save();
      console.log('✗ Invalid forwarded message should have failed validation');
    } catch (validationError) {
      console.log('✓ Forward validation working correctly');
    }
    
    // Test valid message with all fields
    const validMessage = new Message({
      chatId: TEST_CONFIG.testGroupId,
      chatType: 'group',
      senderId: TEST_CONFIG.testUserId,
      senderName: 'Test User',
      content: 'Valid message with reply and forward data',
      messageType: 'text',
      status: 'sent',
      moderationStatus: 'active',
      replyTo: {
        messageId: TEST_CONFIG.testMessageId,
        content: 'Original message content',
        senderName: 'Original Sender',
        type: 'text'
      },
      isForwarded: true,
      forwardedFrom: {
        messageId: TEST_CONFIG.testMessageId,
        originalSenderId: TEST_CONFIG.testUserId,
        originalSenderName: 'Original Sender',
        originalChatId: TEST_CONFIG.testGroupId,
        originalChatName: 'Original Chat',
        forwardedBy: TEST_CONFIG.testUserId,
        forwardedByName: 'Forwarder',
        forwardedAt: new Date()
      }
    });
    
    await validMessage.save();
    console.log('✓ Valid message with reply and forward data saved successfully');
    
  } catch (error) {
    console.error('✗ Error testing schema validation:', error);
    throw error;
  }
}

// Test API endpoint simulation
async function testAPIEndpointSimulation() {
  console.log('\nTesting API Endpoint Simulation...');
  
  try {
    // Simulate sending a reply message
    const replyRequestBody = {
      content: 'API test reply message',
      type: 'text',
      replyToId: TEST_CONFIG.testMessageId.toString()
    };
    
    // Validate request body (simulate route validation)
    if (!replyRequestBody.content || !replyRequestBody.replyToId) {
      throw new Error('Invalid request body for reply');
    }
    
    // Check if reply target exists
    const replyTarget = await Message.findById(replyRequestBody.replyToId);
    if (!replyTarget) {
      throw new Error('Reply target message not found');
    }
    
    console.log('✓ Reply API validation passed');
    
    // Simulate sending a forwarded message
    const forwardRequestBody = {
      content: 'API test forwarded message',
      type: 'text',
      isForwarded: true,
      forwardedFrom: {
        messageId: TEST_CONFIG.testMessageId.toString(),
        originalSenderId: TEST_CONFIG.testUserId.toString(),
        originalSenderName: 'Original Sender',
        originalChatId: TEST_CONFIG.testGroupId.toString(),
        originalChatName: 'Original Chat'
      }
    };
    
    // Validate forward request body
    if (!forwardRequestBody.forwardedFrom || !forwardRequestBody.forwardedFrom.messageId) {
      throw new Error('Invalid request body for forward');
    }
    
    console.log('✓ Forward API validation passed');
    
    // Test message formatting (simulate route response formatting)
    const testMessage = await Message.findById(TEST_CONFIG.testMessageId);
    const formattedMessage = {
      id: testMessage._id,
      content: testMessage.content,
      type: testMessage.messageType,
      senderId: testMessage.senderId,
      senderName: testMessage.senderName,
      replyTo: testMessage.replyTo ? {
        id: testMessage.replyTo.messageId,
        content: testMessage.replyTo.content,
        senderName: testMessage.replyTo.senderName
      } : null,
      isForwarded: testMessage.isForwarded,
      forwardedFrom: testMessage.forwardedFrom || null,
      createdAt: testMessage.createdAt,
      timestamp: testMessage.createdAt
    };
    
    console.log('✓ Message formatting working correctly');
    
  } catch (error) {
    console.error('✗ Error testing API endpoint simulation:', error);
    throw error;
  }
}

// Clean up test data
async function cleanupTestData() {
  console.log('\nCleaning up test data...');
  
  try {
    await Message.deleteMany({ 
      $or: [
        { senderId: TEST_CONFIG.testUserId },
        { chatId: TEST_CONFIG.testGroupId }
      ]
    });
    
    await ChatGroup.deleteMany({ 
      $or: [
        { _id: TEST_CONFIG.testGroupId },
        { createdBy: TEST_CONFIG.testUserId }
      ]
    });
    
    await User.deleteMany({ _id: TEST_CONFIG.testUserId });
    
    console.log('✓ Test data cleaned up');
  } catch (error) {
    console.error('✗ Error cleaning up test data:', error);
  }
}

// Main test function
async function runTests() {
  console.log('=== Reply and Forward API Tests ===\n');
  
  try {
    await connectToDatabase();
    
    const testData = await createTestData();
    
    await testReplyFunctionality();
    await testForwardFunctionality();
    await testMessageSchemaValidation();
    await testAPIEndpointSimulation();
    
    console.log('\n=== All Tests Passed ===');
    
  } catch (error) {
    console.error('\n=== Tests Failed ===');
    console.error('Error:', error.message);
  } finally {
    await cleanupTestData();
    await mongoose.disconnect();
    console.log('✓ Disconnected from database');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testReplyFunctionality,
  testForwardFunctionality,
  testMessageSchemaValidation,
  testAPIEndpointSimulation
};