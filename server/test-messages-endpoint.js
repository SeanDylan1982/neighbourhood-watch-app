/**
 * Test script to debug the messages endpoint
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const Message = require('./models/Message');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

async function testMessagesEndpoint() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('✅ Connected to database');

    const chatId = '688d596ee715295e76c93f4e'; // General Discussion chat
    console.log(`\n🔍 Testing messages for chat: ${chatId}`);

    // Check if chat group exists
    const chatGroup = await ChatGroup.findById(chatId);
    console.log('Chat group exists:', chatGroup ? `"${chatGroup.name}"` : 'NOT FOUND');

    if (!chatGroup) {
      console.log('❌ Chat group not found - this would cause a 500 error');
      return;
    }

    // Check messages for this chat
    console.log('\n📨 Querying messages...');
    const messages = await Message.find({
      chatId: chatId,
      chatType: 'group',
      moderationStatus: 'active'
    })
    .populate('senderId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50);

    console.log(`Found ${messages.length} messages for this chat`);

    if (messages.length > 0) {
      console.log('\nSample messages:');
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`${index + 1}. "${msg.content}" by ${msg.senderName || 'Unknown'} at ${msg.createdAt}`);
      });
    } else {
      console.log('No messages found for this chat');
    }

    // Test the exact query that the API endpoint would use
    console.log('\n🔍 Testing API endpoint query logic...');
    
    try {
      // Simulate what the chat route does
      const userId = '688d5961e715295e76c93f17'; // Sarah Administrator
      
      // Check if user exists
      const user = await User.findById(userId);
      console.log('User exists:', user ? `${user.firstName} ${user.lastName}` : 'NOT FOUND');
      
      // Check if user is member of this chat
      const isMember = chatGroup.members.some(member => 
        member.userId.toString() === userId.toString()
      );
      console.log('User is member of chat:', isMember);
      
      if (!isMember) {
        console.log('❌ User is not a member of this chat - this could cause access issues');
      }

      // Test the exact query from the route
      const routeMessages = await Message.find({
        chatId: chatId,
        chatType: 'group',
        moderationStatus: 'active'
      })
      .populate('senderId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

      console.log(`Route query returned ${routeMessages.length} messages`);

    } catch (queryError) {
      console.error('❌ Query error:', queryError);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testMessagesEndpoint();