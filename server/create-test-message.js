const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('./models/Message');
const User = require('./models/User');
const ChatGroup = require('./models/ChatGroup');

async function createTestMessage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-app');
    console.log('Connected to MongoDB');

    // Find a user and chat group
    const user = await User.findOne();
    const chatGroup = await ChatGroup.findOne();

    if (!user) {
      console.log('No users found');
      return;
    }

    if (!chatGroup) {
      console.log('No chat groups found');
      return;
    }

    console.log('Using user:', user.firstName, user.lastName);
    console.log('Using chat group:', chatGroup.name);

    // Create a test message with various fields
    const testMessage = new Message({
      chatId: chatGroup._id,
      chatType: 'group',
      senderId: user._id,
      senderName: `${user.firstName} ${user.lastName}`,
      content: 'This is a test message with attachments and reactions',
      messageType: 'text',
      attachments: [
        {
          id: new mongoose.Types.ObjectId(),
          type: 'image',
          url: 'https://example.com/image.jpg',
          filename: 'test-image.jpg',
          size: 1024000,
          thumbnail: 'https://example.com/thumb.jpg',
          metadata: {
            width: 800,
            height: 600,
            format: 'jpeg'
          }
        }
      ],
      reactions: [
        {
          type: 'thumbs_up',
          users: [user._id],
          count: 1
        },
        {
          type: 'heart',
          users: [user._id],
          count: 1
        }
      ],
      isEdited: false,
      isForwarded: false,
      status: 'sent',
      moderationStatus: 'active'
    });

    await testMessage.save();
    console.log('Test message created:', testMessage._id);

    // Create another message with reply
    const replyMessage = new Message({
      chatId: chatGroup._id,
      chatType: 'group',
      senderId: user._id,
      senderName: `${user.firstName} ${user.lastName}`,
      content: 'This is a reply to the previous message',
      messageType: 'text',
      replyTo: {
        messageId: testMessage._id,
        content: testMessage.content,
        senderName: testMessage.senderName,
        type: 'text'
      },
      status: 'sent',
      moderationStatus: 'active'
    });

    await replyMessage.save();
    console.log('Reply message created:', replyMessage._id);

    console.log('Test messages created successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestMessage();