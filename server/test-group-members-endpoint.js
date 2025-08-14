const mongoose = require('mongoose');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

async function testGroupMembersEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to MongoDB');
    
    // Find the test group
    const group = await ChatGroup.findOne({ name: 'Test Neighborhood Group' })
      .populate('members.userId', 'firstName lastName profileImageUrl');
    
    if (!group) {
      console.log('❌ Test group not found');
      return;
    }
    
    console.log('✅ Found test group:', group.name);
    console.log('✅ Group ID:', group._id);
    console.log('✅ Members count:', group.members.length);
    
    // Test the endpoint logic directly
    const userId = group.members[0].userId._id; // Use first member as test user
    console.log('✅ Test user ID:', userId);
    
    // Simulate the API endpoint logic
    const testGroup = await ChatGroup.findOne({
      _id: group._id,
      'members.userId': userId,
      isActive: true
    }).populate('members.userId', 'firstName lastName profileImageUrl');
    
    if (!testGroup) {
      console.log('❌ Group access check failed');
      return;
    }
    
    console.log('✅ Group access check passed');
    
    // Format the response as the API does
    const members = testGroup.members.map(member => ({
      _id: member.userId._id,
      firstName: member.userId.firstName,
      lastName: member.userId.lastName,
      profileImageUrl: member.userId.profileImageUrl,
      role: member.role,
      joinedAt: member.joinedAt
    }));
    
    console.log('✅ Formatted members response:');
    console.log(JSON.stringify(members, null, 2));
    
    // Validate each member has required fields
    let allValid = true;
    members.forEach((member, index) => {
      console.log(`\nValidating member ${index + 1}:`);
      const checks = [
        { field: '_id', value: member._id, valid: !!member._id },
        { field: 'firstName', value: member.firstName, valid: !!member.firstName },
        { field: 'lastName', value: member.lastName, valid: !!member.lastName },
        { field: 'role', value: member.role, valid: !!member.role },
        { field: 'joinedAt', value: member.joinedAt, valid: !!member.joinedAt }
      ];
      
      checks.forEach(check => {
        const status = check.valid ? '✅' : '❌';
        console.log(`  ${status} ${check.field}: ${check.value}`);
        if (!check.valid) allValid = false;
      });
    });
    
    if (allValid) {
      console.log('\n✅ All member data is valid and complete');
    } else {
      console.log('\n❌ Some member data is missing or invalid');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testGroupMembersEndpoint();