/**
 * Script to query all users from MongoDB Atlas database
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const User = require('./models/User');

async function queryAllUsers() {
  try {
    // Connect to MongoDB Atlas using connection string from .env
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB Atlas...');
    console.log('Connection string:', mongoUri ? 'Found in .env' : 'Not found in .env');
    
    await mongoose.connect(mongoUri || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('✅ Connected to MongoDB Atlas successfully');

    // Query all users
    console.log('\n=== QUERYING ALL USERS ===\n');
    
    const users = await User.find({})
      .select('_id firstName lastName email role status isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${users.length} users in the database:\n`);

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      console.log('This explains why chat authentication is failing!');
    } else {
      console.log('Users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'user'}`);
        console.log(`   Status: ${user.status || 'unknown'}`);
        console.log(`   Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}`);
        console.log('');
      });
    }

    // Additional database statistics
    console.log('\n=== DATABASE STATISTICS ===\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Count documents in key collections
    const ChatGroup = require('./models/ChatGroup');
    const Notice = require('./models/Notice');
    const Report = require('./models/Report');
    const Message = require('./models/Message');

    const [chatGroupCount, noticeCount, reportCount, messageCount] = await Promise.all([
      ChatGroup.countDocuments(),
      Notice.countDocuments(),
      Report.countDocuments(),
      Message.countDocuments()
    ]);

    console.log('\nDocument counts:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Chat Groups: ${chatGroupCount}`);
    console.log(`- Notices: ${noticeCount}`);
    console.log(`- Reports: ${reportCount}`);
    console.log(`- Messages: ${messageCount}`);

    // Check if the specific test user ID exists
    const testUserId = '507f1f77bcf86cd799439011';
    const testUser = await User.findById(testUserId);
    console.log(`\nTest user (${testUserId}): ${testUser ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (testUser) {
      console.log(`Test user details:`, {
        name: `${testUser.firstName} ${testUser.lastName}`,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive,
        status: testUser.status
      });
    }

  } catch (error) {
    console.error('❌ Error querying users:', error);
    if (error.message.includes('ENOTFOUND') || error.message.includes('connection')) {
      console.log('\n💡 Connection troubleshooting:');
      console.log('1. Check if MONGO_URI is correctly set in .env.local');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Check if IP address is whitelisted in MongoDB Atlas');
      console.log('4. Verify database user credentials');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the query
queryAllUsers();