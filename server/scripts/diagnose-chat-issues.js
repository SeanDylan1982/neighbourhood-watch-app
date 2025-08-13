/**
 * Script to diagnose chat-related issues
 * Run with: node scripts/diagnose-chat-issues.js
 */

const mongoose = require('mongoose');
const ChatGroup = require('../models/ChatGroup');
const Message = require('../models/Message');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function diagnoseChatIssues() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('✅ Connected to database');

    console.log('\n=== CHAT SYSTEM DIAGNOSTICS ===\n');

    // 1. Check Users
    console.log('1. Checking Users...');
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);

    if (totalUsers === 0) {
      console.log('   ❌ No users found - this could cause chat issues');
    } else {
      console.log('   ✅ Users exist');
    }

    // 2. Check Chat Groups
    console.log('\n2. Checking Chat Groups...');
    const totalChatGroups = await ChatGroup.countDocuments();
    const activeChatGroups = await ChatGroup.countDocuments({ isActive: true });
    console.log(`   Total chat groups: ${totalChatGroups}`);
    console.log(`   Active chat groups: ${activeChatGroups}`);

    if (totalChatGroups === 0) {
      console.log('   ⚠️  No chat groups found - users will see empty chat list');
    } else {
      console.log('   ✅ Chat groups exist');
      
      // Show sample chat groups
      const sampleGroups = await ChatGroup.find({ isActive: true })
        .limit(3)
        .populate('createdBy', 'firstName lastName')
        .select('name description memberCount createdBy createdAt');
      
      console.log('   Sample chat groups:');
      sampleGroups.forEach((group, index) => {
        console.log(`     ${index + 1}. "${group.name}" - ${group.memberCount || 0} members`);
      });
    }

    // 3. Check Messages
    console.log('\n3. Checking Messages...');
    const totalMessages = await Message.countDocuments();
    const activeMessages = await Message.countDocuments({ moderationStatus: 'active' });
    console.log(`   Total messages: ${totalMessages}`);
    console.log(`   Active messages: ${activeMessages}`);

    if (totalMessages === 0) {
      console.log('   ⚠️  No messages found - chats will appear empty');
    } else {
      console.log('   ✅ Messages exist');
    }

    // 4. Check for common issues
    console.log('\n4. Checking for Common Issues...');
    
    // Check for orphaned messages (messages without valid chat groups)
    const messagesWithInvalidChats = await Message.aggregate([
      {
        $lookup: {
          from: 'chatgroups',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chatGroup'
        }
      },
      {
        $match: {
          chatType: 'group',
          'chatGroup.0': { $exists: false }
        }
      },
      {
        $count: 'count'
      }
    ]);

    const orphanedCount = messagesWithInvalidChats[0]?.count || 0;
    if (orphanedCount > 0) {
      console.log(`   ❌ Found ${orphanedCount} orphaned messages (messages without valid chat groups)`);
    } else {
      console.log('   ✅ No orphaned messages found');
    }

    // Check for chat groups without members
    const emptyGroups = await ChatGroup.countDocuments({
      isActive: true,
      $or: [
        { members: { $size: 0 } },
        { members: { $exists: false } }
      ]
    });

    if (emptyGroups > 0) {
      console.log(`   ❌ Found ${emptyGroups} chat groups with no members`);
    } else {
      console.log('   ✅ All active chat groups have members');
    }

    // 5. Test a sample query that the frontend might make
    console.log('\n5. Testing Sample Frontend Query...');
    try {
      // Simulate what the frontend does when loading chat groups
      const sampleUserId = await User.findOne({ status: 'active' }).select('_id');
      
      if (sampleUserId) {
        const userGroups = await ChatGroup.find({
          'members.userId': sampleUserId._id,
          isActive: true
        })
        .populate('createdBy', 'firstName lastName')
        .populate('members.userId', 'firstName lastName')
        .sort({ lastActivity: -1, createdAt: -1 });

        console.log(`   ✅ Sample user can access ${userGroups.length} chat groups`);
        
        if (userGroups.length > 0) {
          // Test message loading for first group
          const firstGroup = userGroups[0];
          const messages = await Message.find({
            chatId: firstGroup._id,
            chatType: 'group',
            moderationStatus: 'active'
          })
          .sort({ createdAt: -1 })
          .limit(10);

          console.log(`   ✅ First group "${firstGroup.name}" has ${messages.length} messages`);
        }
      } else {
        console.log('   ❌ No active users found to test with');
      }
    } catch (error) {
      console.log(`   ❌ Sample query failed: ${error.message}`);
    }

    // 6. Check database indexes
    console.log('\n6. Checking Database Indexes...');
    try {
      const chatGroupIndexes = await ChatGroup.collection.getIndexes();
      const messageIndexes = await Message.collection.getIndexes();
      
      console.log(`   ChatGroup indexes: ${Object.keys(chatGroupIndexes).length}`);
      console.log(`   Message indexes: ${Object.keys(messageIndexes).length}`);
      console.log('   ✅ Database indexes are present');
    } catch (error) {
      console.log(`   ❌ Error checking indexes: ${error.message}`);
    }

    console.log('\n=== DIAGNOSTICS COMPLETE ===');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    if (totalUsers === 0) {
      console.log('❌ CRITICAL: No users in database');
    }
    if (totalChatGroups === 0) {
      console.log('⚠️  WARNING: No chat groups - users will see empty chat interface');
    }
    if (totalMessages === 0) {
      console.log('⚠️  INFO: No messages - chats will appear empty but functional');
    }
    if (orphanedCount > 0) {
      console.log('❌ ISSUE: Orphaned messages detected - may cause display issues');
    }
    if (emptyGroups > 0) {
      console.log('❌ ISSUE: Empty chat groups detected - may cause access issues');
    }
    
    if (totalUsers > 0 && totalChatGroups > 0 && orphanedCount === 0 && emptyGroups === 0) {
      console.log('✅ Chat system appears to be healthy');
    }

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the diagnostics
if (require.main === module) {
  diagnoseChatIssues();
}

module.exports = { diagnoseChatIssues };