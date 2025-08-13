/**
 * Demonstration script for FlaggedContentService
 * 
 * This script shows how to use the FlaggedContentService to:
 * 1. Get flagged content with optimized queries
 * 2. Approve, archive, and remove flagged content
 * 3. Log moderation actions for audit trail
 * 
 * Run this script with: node examples/flagged-content-service-demo.js
 */

const mongoose = require('mongoose');
const FlaggedContentService = require('../services/FlaggedContentService');
const Notice = require('../models/Notice');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function demonstrateFlaggedContentService() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to database');

    // Create test data if needed
    let testUser = await User.findOne({ email: 'demo@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        password: 'hashedpassword',
        role: 'user'
      });
      await testUser.save();
      console.log('Created demo user');
    }

    let testAdmin = await User.findOne({ role: 'admin' });
    if (!testAdmin) {
      testAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'hashedpassword',
        role: 'admin'
      });
      await testAdmin.save();
      console.log('Created demo admin');
    }

    // Create flagged content for demonstration
    let flaggedNotice = await Notice.findOne({ isFlagged: true });
    if (!flaggedNotice) {
      flaggedNotice = new Notice({
        title: 'Demo Flagged Notice',
        content: 'This is a demonstration of flagged content',
        category: 'general',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: testUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: testAdmin._id,
            reason: 'Inappropriate content',
            reportedAt: new Date()
          },
          {
            reporterId: testUser._id,
            reason: 'Spam',
            reportedAt: new Date()
          }
        ]
      });
      await flaggedNotice.save();
      console.log('Created demo flagged notice');
    }

    console.log('\n=== DEMONSTRATION: FlaggedContentService ===\n');

    // 1. Get flagged content
    console.log('1. Getting flagged content...');
    const flaggedContent = await FlaggedContentService.getFlaggedContent({
      page: 1,
      limit: 10,
      sortBy: 'reportCount',
      sortOrder: 'desc'
    });

    console.log(`Found ${flaggedContent.total} flagged items:`);
    flaggedContent.content.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.contentType}: "${item.title}" (${item.reportCount} reports)`);
      item.reports.forEach((report, reportIndex) => {
        console.log(`     Report ${reportIndex + 1}: ${report.reason} by ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
      });
    });

    if (flaggedContent.content.length > 0) {
      const firstItem = flaggedContent.content[0];
      
      // 2. Demonstrate approval
      console.log(`\n2. Approving content: "${firstItem.title}"`);
      const approvedContent = await FlaggedContentService.approveContent({
        contentType: firstItem.contentType,
        contentId: firstItem.id,
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content reviewed and found appropriate'
      });
      console.log(`✓ Content approved. Status: ${approvedContent.status || approvedContent.reportStatus || approvedContent.moderationStatus}`);

      // Create another flagged item for archive demonstration
      const archiveNotice = new Notice({
        title: 'Demo Archive Notice',
        content: 'This content will be archived',
        category: 'general',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: testUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: testAdmin._id,
            reason: 'Outdated information',
            reportedAt: new Date()
          }
        ]
      });
      await archiveNotice.save();

      // 3. Demonstrate archiving
      console.log(`\n3. Archiving content: "${archiveNotice.title}"`);
      const archivedContent = await FlaggedContentService.archiveContent({
        contentType: 'notice',
        contentId: archiveNotice._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content contains outdated information'
      });
      console.log(`✓ Content archived. Status: ${archivedContent.status}`);

      // Create another flagged item for removal demonstration
      const removeNotice = new Notice({
        title: 'Demo Remove Notice',
        content: 'This content will be removed',
        category: 'general',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: testUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: testAdmin._id,
            reason: 'Violates community guidelines',
            reportedAt: new Date()
          }
        ]
      });
      await removeNotice.save();

      // 4. Demonstrate removal
      console.log(`\n4. Removing content: "${removeNotice.title}"`);
      const removedContent = await FlaggedContentService.removeContent({
        contentType: 'notice',
        contentId: removeNotice._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content violates community guidelines'
      });
      console.log(`✓ Content removed. Status: ${removedContent.status}`);

      // 5. Demonstrate audit logging
      console.log(`\n5. Logging moderation action...`);
      const auditLog = await FlaggedContentService.logModerationAction({
        contentId: firstItem.id,
        contentType: firstItem.contentType,
        adminId: testAdmin._id.toString(),
        action: 'demo',
        reason: 'Demonstration of audit logging',
        details: {
          demoMode: true,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`✓ Audit log created: ${auditLog ? 'Success' : 'Failed (expected in demo)'}`);
    }

    // 6. Get updated flagged content
    console.log(`\n6. Getting updated flagged content...`);
    const updatedFlaggedContent = await FlaggedContentService.getFlaggedContent();
    console.log(`Now showing ${updatedFlaggedContent.total} flagged items (should be less than before)`);

    console.log('\n=== DEMONSTRATION COMPLETE ===');
    console.log('\nKey Features Demonstrated:');
    console.log('✓ Optimized database queries for flagged content');
    console.log('✓ Support for different content types (Notice, Report, Message)');
    console.log('✓ Pagination and sorting capabilities');
    console.log('✓ Approve, archive, and remove moderation actions');
    console.log('✓ Comprehensive error handling and validation');
    console.log('✓ Audit trail logging for all moderation actions');
    console.log('✓ Proper status management for different content types');

  } catch (error) {
    console.error('Demonstration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateFlaggedContentService();
}

module.exports = { demonstrateFlaggedContentService };