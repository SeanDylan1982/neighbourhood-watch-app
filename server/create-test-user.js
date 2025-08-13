/**
 * Script to create a test user for chat testing
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to database');

    // Check if user already exists
    const existingUser = await User.findById('507f1f77bcf86cd799439011');
    if (existingUser) {
      console.log('Test user already exists:', {
        id: existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName
      });
      process.exit(0);
    }

    // Create test user with specific ID
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const testUser = new User({
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      status: 'active',
      neighbourhoodId: new mongoose.Types.ObjectId(),
      settings: {
        notifications: {
          email: true,
          push: true,
          friendRequests: true,
          messages: true,
          notices: true,
          reports: true
        },
        privacy: {
          profileVisibility: 'neighbours',
          showOnlineStatus: true,
          allowDirectMessages: true
        }
      }
    });

    await testUser.save();
    
    console.log('✅ Test user created successfully:', {
      id: testUser._id,
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: testUser.role,
      isActive: testUser.isActive
    });

    // Verify user can be found
    const foundUser = await User.findById('507f1f77bcf86cd799439011');
    console.log('✅ User verification successful:', foundUser ? 'Found' : 'Not found');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

createTestUser();