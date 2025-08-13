const mongoose = require('mongoose');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function debugGroupMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test group ID from the error logs
    const groupId = '688d596ee715295e76c93f4e';
    
    console.log('\n=== DEBUGGING GROUP MESSAGES ===');
    console.log('Group ID:', groupId);

    // Check if group exists
    console.log('\n1. Checking if group exists...');
    const group = await ChatGroup.findById(groupId);
    if (!group) {
      console.log('❌ Group not found');
      return;
    }
    console.log('✅ Group found:', group.name);
    console.log('Members:', group.members.length);
    console.log('Is Active:', group.isActive);

    // Check messages for this group
    console.log('\n2. Checking messages for this group...');
    const messageCount = await Message.countDocuments({
      chatId: groupId,
      chatType: 'group'
    });
    console.log('Total messages in group:', messageCount);

    const activeMessageCount = await Message.countDocuments({
      chatId: groupId,
      chatType: 'group',
      moderationStatus: 'active'
    });
    console.log('Active messages in group:', activeMessageCount);

    // Try to fetch messages like the route does
    console.log('\n3. Fetching messages like the route...');
    const query = {
      chatId: groupId,
      chatType: 'group',
      moderationStatus: 'active'
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    try {
      const messages = await Message.find(query)
        .populate('senderId', 'firstName lastName profileImageUrl')
        .populate('replyTo.messageId', 'content senderId') // Fixed: use replyTo.messageId instead of replyToId
        .sort({ createdAt: -1 })
        .limit(50);

      console.log('✅ Messages fetched successfully:', messages.length);
      
      if (messages.length > 0) {
        console.log('\nSample message:');
        const msg = messages[0];
        console.log({
          id: msg._id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt
        });
      }

    } catch (populateError) {
      console.log('❌ Error during populate:', populateError.message);
      console.log('Stack:', populateError.stack);
      
      // Try without populate
      console.log('\n4. Trying without populate...');
      const messagesWithoutPopulate = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(50);
      
      console.log('✅ Messages without populate:', messagesWithoutPopulate.length);
    }

    // Check if there are any users to populate
    console.log('\n5. Checking users...');
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);

    if (messageCount > 0) {
      const sampleMessage = await Message.findOne({ chatId: groupId });
      console.log('Sample message senderId:', sampleMessage.senderId);
      
      const sender = await User.findById(sampleMessage.senderId);
      if (sender) {
        console.log('✅ Sender found:', sender.firstName, sender.lastName);
      } else {
        console.log('❌ Sender not found for message');
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugGroupMessages();