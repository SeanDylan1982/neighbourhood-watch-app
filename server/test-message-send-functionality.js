const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models and routes
const User = require('./models/User');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const chatRoutes = require('./routes/chat');
const { authenticateToken } = require('./middleware/auth');

// Create test app
const app = express();
app.use(express.json());

// Mock socket.io
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
};
app.set('io', mockIo);

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    userId: '507f1f77bcf86cd799439011', // Test user ID
    email: 'test@example.com',
    role: 'user'
  };
  next();
};

app.use(mockAuth);
app.use('/api/chat', chatRoutes);

/**
 * Test Message Sending Functionality
 * Tests all aspects of task 4: Fix message sending functionality
 */
describe('Message Sending Functionality Tests', () => {
  let testUser;
  let testGroup;
  let testGroupId;
  let testUserId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch-test');
    }

    // Create test user
    testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    testUser = await User.findOneAndUpdate(
      { _id: testUserId },
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // Create test group
    testGroupId = new mongoose.Types.ObjectId();
    testGroup = await ChatGroup.findOneAndUpdate(
      { _id: testGroupId },
      {
        name: 'Test Group',
        description: 'Test group for message sending',
        type: 'public',
        neighbourhoodId: testUser.neighbourhoodId,
        createdBy: testUserId,
        members: [
          {
            userId: testUserId,
            role: 'admin',
            joinedAt: new Date()
          },
          {
            userId: new mongoose.Types.ObjectId(),
            role: 'member',
            joinedAt: new Date()
          }
        ],
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('Test setup completed');
    console.log('Test User ID:', testUserId);
    console.log('Test Group ID:', testGroupId);
  });

  afterAll(async () => {
    // Clean up test data
    await Message.deleteMany({ chatId: testGroupId });
    await ChatGroup.deleteOne({ _id: testGroupId });
    await User.deleteOne({ _id: testUserId });
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    // Reset mock functions
    jest.clearAllMocks();
  });

  describe('Basic Message Sending', () => {
    test('should successfully send a text message to group', async () => {
      const messageContent = 'Hello, this is a test message!';
      
      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: messageContent,
          type: 'text'
        })
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', messageContent);
      expect(response.body).toHaveProperty('type', 'text');
      expect(response.body).toHaveProperty('messageType', 'text'); // Legacy support
      expect(response.body).toHaveProperty('senderId', testUserId.toString());
      expect(response.body).toHaveProperty('senderName', 'Test User');
      expect(response.body).toHaveProperty('status', 'sent');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('createdAt');

      // Verify message was saved to database
      const savedMessage = await Message.findById(response.body.id);
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.content).toBe(messageContent);
      expect(savedMessage.chatId.toString()).toBe(testGroupId.toString());
      expect(savedMessage.chatType).toBe('group');
      expect(savedMessage.status).toBe('sent');

      console.log('✓ Basic text message sending works correctly');
    });

    test('should handle empty message content with proper error', async () => {
      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: '',
          type: 'text'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code', 'EMPTY_MESSAGE_CONTENT');
      
      console.log('✓ Empty message validation works correctly');
    });

    test('should handle invalid group ID with proper error', async () => {
      const invalidGroupId = 'invalid-id';
      
      const response = await request(app)
        .post(`/api/chat/groups/${invalidGroupId}/messages`)
        .send({
          content: 'Test message',
          type: 'text'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'INVALID_GROUP_ID');
      
      console.log('✓ Invalid group ID validation works correctly');
    });
  });

  describe('Real-time Broadcasting', () => {
    test('should broadcast message via socket.io when sent', async () => {
      const messageContent = 'Real-time test message';
      
      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: messageContent,
          type: 'text'
        })
        .expect(201);

      // Verify socket.io broadcasting was called
      expect(mockIo.to).toHaveBeenCalledWith(`group_${testGroupId}`);
      expect(mockIo.to).toHaveBeenCalledWith(`user_${testUserId}`);
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.objectContaining({
        content: messageContent,
        type: 'text'
      }));
      expect(mockIo.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
        content: messageContent,
        type: 'text'
      }));

      console.log('✓ Real-time socket broadcasting works correctly');
    });
  });

  describe('Message Format Consistency', () => {
    test('should maintain consistent format between send and fetch', async () => {
      // Send a message
      const sendResponse = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: 'Format consistency test',
          type: 'text'
        })
        .expect(201);

      // Fetch messages
      const fetchResponse = await request(app)
        .get(`/api/chat/groups/${testGroupId}/messages`)
        .expect(200);

      // Find the sent message in the fetched messages
      const sentMessage = sendResponse.body;
      const fetchedMessage = fetchResponse.body.find(msg => msg.id === sentMessage.id);

      expect(fetchedMessage).toBeTruthy();
      
      // Verify key fields match
      expect(fetchedMessage.id).toBe(sentMessage.id);
      expect(fetchedMessage.content).toBe(sentMessage.content);
      expect(fetchedMessage.type).toBe(sentMessage.type);
      expect(fetchedMessage.messageType).toBe(sentMessage.messageType);
      expect(fetchedMessage.senderId).toBe(sentMessage.senderId);
      expect(fetchedMessage.senderName).toBe(sentMessage.senderName);
      expect(fetchedMessage.status).toBe(sentMessage.status);
      
      // Verify both have required fields
      const requiredFields = ['id', 'content', 'type', 'messageType', 'senderId', 'senderName', 'status', 'timestamp', 'createdAt'];
      for (const field of requiredFields) {
        expect(sentMessage).toHaveProperty(field);
        expect(fetchedMessage).toHaveProperty(field);
      }

      console.log('✓ Message format consistency between send and fetch verified');
    });
  });

  describe('Advanced Message Features', () => {
    test('should handle message with attachments', async () => {
      const messageData = {
        content: 'Message with attachment',
        type: 'image',
        attachments: [
          {
            id: new mongoose.Types.ObjectId(),
            type: 'image',
            url: 'https://example.com/image.jpg',
            filename: 'test-image.jpg',
            size: 1024000
          }
        ]
      };

      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('attachments');
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toHaveProperty('type', 'image');
      expect(response.body.attachments[0]).toHaveProperty('url', 'https://example.com/image.jpg');

      console.log('✓ Message with attachments works correctly');
    });

    test('should handle reply messages', async () => {
      // First, create a message to reply to
      const originalResponse = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: 'Original message',
          type: 'text'
        })
        .expect(201);

      // Now send a reply
      const replyResponse = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: 'This is a reply',
          type: 'text',
          replyToId: originalResponse.body.id
        })
        .expect(201);

      expect(replyResponse.body).toHaveProperty('replyTo');
      expect(replyResponse.body.replyTo).toHaveProperty('id', originalResponse.body.id);

      console.log('✓ Reply messages work correctly');
    });

    test('should handle forwarded messages', async () => {
      const forwardedMessageData = {
        content: 'Forwarded message content',
        type: 'text',
        isForwarded: true,
        forwardedFrom: {
          messageId: new mongoose.Types.ObjectId(),
          originalSenderId: new mongoose.Types.ObjectId(),
          originalSenderName: 'Original Sender',
          originalChatId: new mongoose.Types.ObjectId(),
          originalChatName: 'Original Chat'
        }
      };

      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send(forwardedMessageData)
        .expect(201);

      expect(response.body).toHaveProperty('isForwarded', true);
      expect(response.body).toHaveProperty('forwardedFrom');
      expect(response.body.forwardedFrom).toHaveProperty('originalSenderName', 'Original Sender');

      console.log('✓ Forwarded messages work correctly');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-member trying to send message', async () => {
      // Create a group where the test user is not a member
      const nonMemberGroupId = new mongoose.Types.ObjectId();
      await ChatGroup.create({
        _id: nonMemberGroupId,
        name: 'Non-member Group',
        type: 'public',
        neighbourhoodId: testUser.neighbourhoodId,
        createdBy: new mongoose.Types.ObjectId(),
        members: [
          {
            userId: new mongoose.Types.ObjectId(),
            role: 'admin',
            joinedAt: new Date()
          }
        ],
        isActive: true
      });

      const response = await request(app)
        .post(`/api/chat/groups/${nonMemberGroupId}/messages`)
        .send({
          content: 'Unauthorized message',
          type: 'text'
        })
        .expect(403);

      expect(response.body).toHaveProperty('code', 'GROUP_ACCESS_DENIED');

      // Clean up
      await ChatGroup.deleteOne({ _id: nonMemberGroupId });

      console.log('✓ Non-member access control works correctly');
    });

    test('should handle invalid reply message ID', async () => {
      const invalidReplyId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: 'Reply to non-existent message',
          type: 'text',
          replyToId: invalidReplyId
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'REPLY_MESSAGE_NOT_FOUND');

      console.log('✓ Invalid reply message validation works correctly');
    });

    test('should handle invalid attachment data', async () => {
      const response = await request(app)
        .post(`/api/chat/groups/${testGroupId}/messages`)
        .send({
          content: 'Message with invalid attachment',
          type: 'image',
          attachments: [
            {
              // Missing required url or filename
              type: 'image',
              size: 1024
            }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'INVALID_ATTACHMENT_DATA');

      console.log('✓ Invalid attachment validation works correctly');
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle multiple concurrent message sends', async () => {
      const messagePromises = [];
      const messageCount = 5;

      for (let i = 0; i < messageCount; i++) {
        messagePromises.push(
          request(app)
            .post(`/api/chat/groups/${testGroupId}/messages`)
            .send({
              content: `Concurrent message ${i + 1}`,
              type: 'text'
            })
        );
      }

      const responses = await Promise.all(messagePromises);
      
      // All messages should be successful
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.content).toBe(`Concurrent message ${index + 1}`);
      });

      console.log('✓ Concurrent message sending works correctly');
    });

    test('should maintain message order', async () => {
      const messageContents = ['First', 'Second', 'Third'];
      const messageIds = [];

      // Send messages sequentially
      for (const content of messageContents) {
        const response = await request(app)
          .post(`/api/chat/groups/${testGroupId}/messages`)
          .send({
            content,
            type: 'text'
          })
          .expect(201);
        
        messageIds.push(response.body.id);
      }

      // Fetch messages and verify order
      const fetchResponse = await request(app)
        .get(`/api/chat/groups/${testGroupId}/messages`)
        .expect(200);

      const messages = fetchResponse.body;
      const sentMessages = messages.filter(msg => messageIds.includes(msg.id));
      
      // Messages should be in chronological order (oldest first in response)
      expect(sentMessages).toHaveLength(3);
      expect(sentMessages[0].content).toBe('First');
      expect(sentMessages[1].content).toBe('Second');
      expect(sentMessages[2].content).toBe('Third');

      console.log('✓ Message ordering works correctly');
    });
  });
});

// Run the tests
if (require.main === module) {
  console.log('🧪 Starting Message Sending Functionality Tests...\n');
  
  // Use Jest programmatically
  const { runCLI } = require('jest');
  
  runCLI({
    testPathPattern: [__filename],
    verbose: true,
    detectOpenHandles: true,
    forceExit: true
  }, [process.cwd()]).then((result) => {
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${result.results.numPassedTests}`);
    console.log(`❌ Failed: ${result.results.numFailedTests}`);
    console.log(`⏭️  Skipped: ${result.results.numPendingTests}`);
    
    if (result.results.numFailedTests === 0) {
      console.log('\n🎉 All message sending functionality tests passed!');
      console.log('✓ Message posting works correctly for group chats');
      console.log('✓ Proper error handling for message creation failures');
      console.log('✓ Real-time message broadcasting implemented');
      console.log('✓ Message format consistency between send and fetch validated');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
    
    process.exit(result.results.numFailedTests === 0 ? 0 : 1);
  }).catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testUser,
  testGroup,
  testGroupId,
  testUserId
};