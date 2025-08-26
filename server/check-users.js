#!/usr/bin/env node

/**
 * Check Users in Database
 * List all users in the database to see what accounts exist
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Get all users
    const users = await User.find({}).select('email firstName lastName role isActive createdAt');
    
    console.log(`\n📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You may need to run the seed script:');
      console.log('   cd server && node scripts/seed.js');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

checkUsers();