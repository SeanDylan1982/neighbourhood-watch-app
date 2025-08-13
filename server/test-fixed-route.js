const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

// Import the fixed chat routes
const chatRoutes = require('./routes/chat');

async function testFixedRoute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create test app
    const app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req, res, next) => {
      // Use a real user ID from the database for testing
      req.user = { userId: '688d5969e715295e76c93f27' }; // Maria Garcia's ID
      next();
    });

    app.use('/api/chat', chatRoutes);

    console.log('\n=== TESTING FIXED ROUTE ===');
    
    // Test the fixed route
    const groupId = '688d596ee715295e76c93f4e';
    console.log('Testing group messages endpoint for group:', groupId);

    const response = await request(app)
      .get(`/api/chat/groups/${groupId}/messages`)
      .expect(200);

    console.log('✅ Route test successful!');
    console.log('Response status:', response.status);
    console.log('Messages returned:', response.body.length);
    
    if (response.body.length > 0) {
      console.log('\nSample formatted message:');
      const sampleMessage = response.body[0];
      console.log({
        id: sampleMessage.id,
        content: sampleMessage.content.substring(0, 50) + '...',
        senderName: sampleMessage.senderName,
        senderId: sampleMessage.senderId,
        type: sampleMessage.type,
        messageType: sampleMessage.messageType,
        hasAttachments: sampleMessage.attachments?.length > 0,
        hasReplyTo: !!sampleMessage.replyTo,
        timestamp: sampleMessage.timestamp,
        createdAt: sampleMessage.createdAt
      });
    }

    console.log('\n✅ All tests passed! The route fix is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.body);
    }
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testFixedRoute();