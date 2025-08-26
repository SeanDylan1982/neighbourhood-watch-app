// Database connection utility for Netlify Functions
const mongoose = require('mongoose');

let cachedConnection = null;

const connectToDatabase = async () => {
  // Return cached connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create new connection
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 1, // Limit connections for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });

    cachedConnection = connection;
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

const disconnectFromDatabase = async () => {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};