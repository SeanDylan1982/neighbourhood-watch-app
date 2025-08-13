/**
 * Simple test script to verify chat routes are working
 */

const express = require('express');
const chatRoutes = require('./routes/chat');

const app = express();

// Basic middleware
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
  req.user = { userId: '507f1f77bcf86cd799439011' };
  next();
});

// Mount chat routes
app.use('/api/chat', chatRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working' });
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test chat routes at: http://localhost:${PORT}/api/chat/groups`);
  console.log(`Test endpoint at: http://localhost:${PORT}/test`);
});