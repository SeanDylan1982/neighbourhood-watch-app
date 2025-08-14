const mongoose = require('mongoose');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

async function testGroupMembers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to MongoDB');
    
    // Find a group with members
    const group = await ChatGroup.findOne({ isActive: true })
      .populate('members.userId', 'firstName lastName profileImageUrl');
    
    if (group) {
      console.log('Found group:', group.name);
      console.log('Group ID:', group._id);
      console.log('Members count:', group.members.length);
      console.log('Members data:');
      group.members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.userId.firstName} ${member.userId.lastName} (${member.role})`);
        console.log('   User ID:', member.userId._id);
        console.log('   Profile Image:', member.userId.profileImageUrl || 'None');
        console.log('   Joined:', member.joinedAt);
      });
      
      // Test the API endpoint format
      const apiResponse = group.members.map(member => ({
        _id: member.userId._id,
        firstName: member.userId.firstName,
        lastName: member.userId.lastName,
        profileImageUrl: member.userId.profileImageUrl,
        role: member.role,
        joinedAt: member.joinedAt
      }));
      
      console.log('\nAPI Response format:');
      console.log(JSON.stringify(apiResponse, null, 2));
    } else {
      console.log('No active groups found');
      
      // Check if there are any groups at all
      const allGroups = await ChatGroup.find({});
      console.log('Total groups in database:', allGroups.length);
      
      if (allGroups.length > 0) {
        console.log('Groups found:');
        allGroups.forEach(g => {
          console.log(`- ${g.name} (active: ${g.isActive}, members: ${g.members.length})`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testGroupMembers();