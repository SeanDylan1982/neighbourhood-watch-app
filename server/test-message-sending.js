const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');

// Import models and routes
const Message = require('./models/Message');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');
const chatRoutes = require('./routes/chat');
const { setupSocketHandlers } = require('./socket/handlers');

// Test configuration
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://localhost:27017/neighbourhood_watch_test';
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Create test app
const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.set('io', io);

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    userId: '507f1f77bcf86cd799439011', // Test user ID
    email: 'test@example.com',
    role: 'user'
  };
  next();
};

app.use('/api/chat', mockAuth, chatRoutes);

// Setup socket handlers
setupSocketHandlers(io);

describe('Message Sending Functionality', () => {
  let testUser, testGroup, clientSocket;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB_URI);
    
    // Clear test data
    await Message.deleteMany({});
    await ChatGroup.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      neighbourhoodId: '507f1f77bcf86cd799439012',
      status: 'active'
    });

    // Create test group
    testGroup = await ChatGroup.create({
      _id: '507f1f77bcf86cd799439013',
      name: 'Test Group',
      description: 'Test group for message sending',
      type: 'public',
      neighbourhoodId: '507f1f77bcf86cd799439012',
      createdBy: testUser._id,
      members: [{
        userId: testUser._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      isActive: true
    });

    // Start server
    await new Promise((resolve) => {
      server.listen(0, resolve);
    });

    // Create socket client
    const port = server.address().port;
    const token = jwt.sign({ userId: testUser._id }, JWT_SECRET);
    
    clientSocket = new Client(`http://localhost:${port}`, {
      auth: { token }
    });

    await new Promise((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    server.close();
    await mongoose.connection.close();
  });

  describe('POST /api/chat/groups/:groupId/messages', () => {
    test('should send a message successfully', async () => {
      const messageContent = 'Hello, this is a test message!';
      
      const response = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: messageContent,
          type: 'text'
        })
        .expect(201);

      // Verify response format
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', messageContent);
      expect(response.body).toHaveProperty('type', 'text');
      expect(response.body).toHaveProperty('messageType', 'text'); // Legacy support
      expect(response.body).toHaveProperty('senderId', testUser._id.toString());
      expect(response.body).toHaveProperty('senderName', 'Test User');
      expect(response.body).toHaveProperty('status', 'sent');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('createdAt');

      // Verify message was saved to database
      const savedMessage = await Message.findById(response.body.id);
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.content).toBe(messageContent);
      expect(savedMessage.status).toBe('sent');
      expect(savedMessage.chatId.toString()).toBe(testGroup._id.toString());
      expect(savedMessage.chatType).toBe('group');
    });

    test('should handle message with attachments', async () => {
      const messageContent = 'Message with attachment';
      const attachments = [{
        id: new mongoose.Types.ObjectId(),
        type: 'image',
        url: 'https://example.com/image.jpg',
        filename: 'test-image.jpg',
        size: 1024
      }];
      
      const response = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: messageContent,
          type: 'text',
          attachments
        })
        .expect(201);

      expect(response.body).toHaveProperty('attachments');
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toHaveProperty('type', 'image');
      expect(response.body.attachments[0]).toHaveProperty('url', 'https://example.com/image.jpg');
      
      // Verify both media and attachments fields for backward compatibility
      expect(response.body).toHaveProperty('media');
      expect(response.body.media).toEqual(response.body.attachments);
    });

    test('should handle reply messages', async () => {
      // First, create a message to reply to
      const originalMessage = await Message.create({
        chatId: testGroup._id,
        chatType: 'group',
        senderId: testUser._id,
        senderName: 'Test User',
        content: 'Original message',
        messageType: 'text',
        status: 'sent'
      });

      const replyContent = 'This is a reply';
      
      const response = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: replyContent,
          type: 'text',
          replyToId: originalMessage._id.toString()
        })
        .expect(201);

      expect(response.body).toHaveProperty('replyTo');
      expect(response.body.replyTo).toHaveProperty('id', originalMessage._id.toString());
    });

    test('should broadcast message via socket.io', (done) => {
      const messageContent = 'Socket broadcast test message';
      
      // Listen for the new message event
      clientSocket.on('new_message', (data) => {
        expect(data).toHaveProperty('content', messageContent);
        expect(data).toHaveProperty('senderId', testUser._id.toString());
        expect(data).toHaveProperty('type', 'text');
        done();
      });

      // Join the group room first
      clientSocket.emit('join_group', testGroup._id.toString());

      // Send message via HTTP API
      setTimeout(() => {
        request(app)
          .post(`/api/chat/groups/${testGroup._id}/messages`)
          .send({
            content: messageContent,
            type: 'text'
          })
          .expect(201)
          .end((err) => {
            if (err) done(err);
          });
      }, 100);
    });

    test('should handle message creation failures gracefully', async () => {
      const response = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: '', // Empty content should fail
          type: 'text'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code', 'EMPTY_MESSAGE_CONTENT');
    });

    test('should validate group membership', async () => {
      // Create a group where the user is not a member
      const otherGroup = await ChatGroup.create({
        name: 'Other Group',
        description: 'Group where user is not a member',
        type: 'public',
        neighbourhoodId: '507f1f77bcf86cd799439012',
        createdBy: new mongoose.Types.ObjectId(),
        members: [], // User is not a member
        isActive: true
      });

      const response = await request(app)
        .post(`/api/chat/groups/${otherGroup._id}/messages`)
        .send({
          content: 'This should fail',
          type: 'text'
        })
        .expect(403);

      expect(response.body).toHaveProperty('code', 'GROUP_ACCESS_DENIED');
    });

    test('should validate message format consistency between send and fetch', async () => {
      // Send a message
      const messageContent = 'Format consistency test';
      
      const sendResponse = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: messageContent,
          type: 'text'
        })
        .expect(201);

      // Fetch messages
      const fetchResponse = await request(app)
        .get(`/api/chat/groups/${testGroup._id}/messages`)
        .expect(200);

      // Find the sent message in the fetched messages
      const sentMessage = fetchResponse.body.find(msg => msg.id === sendResponse.body.id);
      
      expect(sentMessage).toBeTruthy();
      
      // Verify format consistency
      expect(sentMessage.content).toBe(sendResponse.body.content);
      expect(sentMessage.type).toBe(sendResponse.body.type);
      expect(sentMessage.messageType).toBe(sendResponse.body.messageType);
      expect(sentMessage.senderId).toBe(sendResponse.body.senderId);
      expect(sentMessage.senderName).toBe(sendResponse.body.senderName);
      expect(sentMessage.status).toBe(sendResponse.body.status);
      expect(sentMessage.timestamp).toBe(sendResponse.body.timestamp);
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running message sending functionality tests...');
  
  // Simple test runner
  const runTests = async () => {
    try {
      console.log('✓ Starting message sending tests');
      
      // Connect to database
      await mongoose.connect(TEST_DB_URI);
      console.log('✓ Connected to test database');
      
      // Clean up
      await Message.deleteMany({});
      await ChatGroup.deleteMany({});
      await User.deleteMany({});
      console.log('✓ Cleaned test data');
      
      // Create test data
      const testUser = await User.create({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        neighbourhoodId: '507f1f77bcf86cd799439012',
        status: 'active'
      });

      const testGroup = await ChatGroup.create({
        _id: '507f1f77bcf86cd799439013',
        name: 'Test Group',
        description: 'Test group for message sending',
        type: 'public',
        neighbourhoodId: '507f1f77bcf86cd799439012',
        createdBy: testUser._id,
        members: [{
          userId: testUser._id,
          role: 'admin',
          joinedAt: new Date()
        }],
        isActive: true
      });
      console.log('✓ Created test data');
      
      // Test basic message sending
      const messageContent = 'Test message from script';
      const response = await request(app)
        .post(`/api/chat/groups/${testGroup._id}/messages`)
        .send({
          content: messageContent,
          type: 'text'
        });
      
      if (response.status === 201) {
        console.log('✓ Message sending test passed');
        console.log('  - Message ID:', response.body.id);
        console.log('  - Content:', response.body.content);
        console.log('  - Status:', response.body.status);
      } else {
        console.log('✗ Message sending test failed');
        console.log('  - Status:', response.status);
        console.log('  - Response:', response.body);
      }
      
      // Verify message was saved
      const savedMessage = await Message.findById(response.body.id);
      if (savedMessage) {
        console.log('✓ Message saved to database');
      } else {
        console.log('✗ Message not found in database');
      }
      
      console.log('✓ All tests completed');
      
    } catch (error) {
      console.error('✗ Test failed:', error.message);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  };
  
  runTests();
}

module.exports = { app, server };