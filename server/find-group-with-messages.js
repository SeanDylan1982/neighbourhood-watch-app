const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('./models/Message');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

async function findGroupWithMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find groups that have messages
    const messagesWithGroups = await Message.aggregate([
      { $match: { chatType: 'group', moderationStatus: 'active' } },
      { $group: { _id: '$chatId', messageCount: { $sum: 1 } } },
      { $sort: { messageCount: -1 } }
    ]);

    console.log('Groups with messages:');
    for (const group of messagesWithGroups) {
      const chatGroup = await ChatGroup.findById(group._id);
      console.log(`- Group ID: ${group._id}, Name: ${chatGroup?.name || 'Unknown'}, Messages: ${group.messageCount}`);
    }

    if (messagesWithGroups.length > 0) {
      const groupId = messagesWithGroups[0]._id;
      console.log(`\nUsing group ${groupId} for testing...`);
      
      // Get sample messages from this group
      const messages = await Message.find({ 
        chatId: groupId, 
        chatType: 'group', 
        moderationStatus: 'active' 
      })
      .populate('senderId', 'firstName lastName profileImageUrl')
      .limit(3);

      console.log('\nSample messages:');
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.content?.substring(0, 50)}... (${msg.senderId?.firstName} ${msg.senderId?.lastName})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findGroupWithMessages();