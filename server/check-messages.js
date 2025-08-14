const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('./models/Message');

async function checkMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-app');
    console.log('Connected to MongoDB');

    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Try to find messages collection directly
    const db = mongoose.connection.db;
    const messageCount = await db.collection('messages').countDocuments();
    console.log('Total messages (direct query):', messageCount);

    // Try with Message model
    const modelCount = await Message.countDocuments();
    console.log('Total messages (model query):', modelCount);

    // Get sample messages directly from collection
    const directMessages = await db.collection('messages').find().limit(5).toArray();
    console.log('Sample messages (direct):');
    directMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg._id}, Type: ${msg.chatType}, Status: ${msg.moderationStatus}, Content: ${msg.content?.substring(0, 50)}...`);
    });

    // Try with model
    const messages = await Message.find().limit(5);
    console.log('Sample messages (model):');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg._id}, Type: ${msg.chatType}, Status: ${msg.moderationStatus}, Content: ${msg.content?.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMessages();