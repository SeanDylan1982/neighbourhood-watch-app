const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

// Mock authentication middleware for testing
const mockAuth = (req, res, next) => {
  // Use the first user as the authenticated user
  User.findOne({}).then(user => {
    if (user) {
      req.user = { userId: user._id };
      next();
    } else {
      res.status(401).json({ message: 'No test user found' });
    }
  }).catch(err => {
    res.status(500).json({ message: 'Auth error', error: err.message });
  });
};

async function testGroupMembersAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to MongoDB');
    
    // Find the test group
    const group = await ChatGroup.findOne({ name: 'Test Neighborhood Group' });
    if (!group) {
      console.log('Test group not found. Please run create-test-group-data.js first.');
      return;
    }
    
    console.log('Found test group:', group.name);
    console.log('Group ID:', group._id);
    
    // Create Express app for testing
    const app = express();
    app.use(express.json());
    app.use(mockAuth);
    
    // Import the chat routes
    const chatRoutes = require('./routes/chat');
    app.use('/api/chat', chatRoutes);
    
    // Start server
    const server = app.listen(3001, () => {
      console.log('Test server running on port 3001');
    });
    
    // Test the API endpoint
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/chat/groups/${group._id}/members`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nAPI Response Status:', res.statusCode);
        console.log('API Response Headers:', res.headers);
        
        try {
          const responseData = JSON.parse(data);
          console.log('\nAPI Response Data:');
          console.log(JSON.stringify(responseData, null, 2));
          
          // Validate response structure
          if (Array.isArray(responseData)) {
            console.log('\n✅ Response is an array');
            console.log('✅ Member count:', responseData.length);
            
            responseData.forEach((member, index) => {
              console.log(`\nMember ${index + 1}:`);
              console.log('  ✅ Has _id:', !!member._id);
              console.log('  ✅ Has firstName:', !!member.firstName);
              console.log('  ✅ Has lastName:', !!member.lastName);
              console.log('  ✅ Has role:', !!member.role);
              console.log('  ✅ Has joinedAt:', !!member.joinedAt);
              console.log('  ✅ Has profileImageUrl:', !!member.profileImageUrl);
              console.log(`  Name: ${member.firstName} ${member.lastName}`);
              console.log(`  Role: ${member.role}`);
            });
          } else {
            console.log('❌ Response is not an array');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          console.log('Raw response:', data);
        }
        
        server.close();
        mongoose.disconnect();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      server.close();
      mongoose.disconnect();
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testGroupMembersAPI();