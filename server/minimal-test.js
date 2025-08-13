/**
 * Minimal server test to isolate the issue
 */

const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Basic middleware
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server is working', timestamp: new Date() });
});

// Chat test endpoint
app.get('/api/chat/test', (req, res) => {
  res.json({ message: 'Chat endpoint is working', timestamp: new Date() });
});

const PORT = 5003;

async function startServer() {
  try {
    console.log('Starting minimal server...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('MongoDB connected successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Minimal server running on port ${PORT}`);
      console.log(`Test endpoint: http://localhost:${PORT}/test`);
      console.log(`Chat test endpoint: http://localhost:${PORT}/api/chat/test`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();