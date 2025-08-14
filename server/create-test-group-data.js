const mongoose = require('mongoose');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

async function createTestGroupData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to MongoDB');
    
    // Find existing users
    const users = await User.find({ isActive: true }).limit(5);
    console.log('Found users:', users.length);
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create a group. Creating test users...');
      
      // Create test users
      const testUsers = [
        {
          email: 'alice@test.com',
          password: 'password123',
          firstName: 'Alice',
          lastName: 'Johnson',
          profileImageUrl: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AJ'
        },
        {
          email: 'bob@test.com',
          password: 'password123',
          firstName: 'Bob',
          lastName: 'Smith',
          profileImageUrl: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=BS'
        },
        {
          email: 'charlie@test.com',
          password: 'password123',
          firstName: 'Charlie',
          lastName: 'Brown',
          profileImageUrl: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=CB'
        }
      ];
      
      for (const userData of testUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
          users.push(user);
          console.log(`Created user: ${user.firstName} ${user.lastName}`);
        } else {
          users.push(existingUser);
          console.log(`User already exists: ${existingUser.firstName} ${existingUser.lastName}`);
        }
      }
    }
    
    // Create a test group
    const testGroup = new ChatGroup({
      name: 'Test Neighborhood Group',
      description: 'A test group for neighborhood discussions',
      type: 'public',
      neighbourhoodId: new mongoose.Types.ObjectId(), // Dummy neighbourhood ID
      createdBy: users[0]._id,
      members: users.slice(0, 3).map((user, index) => ({
        userId: user._id,
        role: index === 0 ? 'admin' : 'member',
        joinedAt: new Date()
      })),
      isActive: true,
      lastActivity: new Date()
    });
    
    await testGroup.save();
    console.log('Created test group:', testGroup.name);
    console.log('Group ID:', testGroup._id);
    console.log('Members:', testGroup.members.length);
    
    // Verify the group with populated members
    const populatedGroup = await ChatGroup.findById(testGroup._id)
      .populate('members.userId', 'firstName lastName profileImageUrl');
    
    console.log('\nGroup members with populated data:');
    populatedGroup.members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.userId.firstName} ${member.userId.lastName} (${member.role})`);
      console.log('   User ID:', member.userId._id);
      console.log('   Profile Image:', member.userId.profileImageUrl || 'None');
      console.log('   Joined:', member.joinedAt);
    });
    
    await mongoose.disconnect();
    console.log('\nTest data created successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestGroupData();