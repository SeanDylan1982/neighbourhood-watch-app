/**
 * Script to create test flagged content for testing the FlaggedContentService integration
 * Run with: node scripts/create-test-flagged-content.js
 */

const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Report = require('../models/Report');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function createTestFlaggedContent() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to database');

    // Find or create test users
    let testUser = await User.findOne({ email: 'testuser@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'hashedpassword',
        role: 'user'
      });
      await testUser.save();
      console.log('Created test user');
    }

    let reporterUser = await User.findOne({ email: 'reporter@example.com' });
    if (!reporterUser) {
      reporterUser = new User({
        firstName: 'Reporter',
        lastName: 'User',
        email: 'reporter@example.com',
        password: 'hashedpassword',
        role: 'user'
      });
      await reporterUser.save();
      console.log('Created reporter user');
    }

    // Create flagged notices
    const flaggedNotices = [
      {
        title: 'Suspicious Activity in Park',
        content: 'I saw some people acting suspiciously near the playground last night. They were looking around nervously and seemed to be up to no good.',
        category: 'safety',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: testUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: reporterUser._id,
            reason: 'Potentially false or misleading information',
            reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            reporterId: testUser._id,
            reason: 'Inappropriate content',
            reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          }
        ]
      },
      {
        title: 'Noise Complaint - Loud Music',
        content: 'The neighbors at 123 Main St have been playing extremely loud music every night this week. It\'s disrupting everyone\'s sleep and needs to stop immediately!',
        category: 'general',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: reporterUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: testUser._id,
            reason: 'Harassment or targeting of individuals',
            reportedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          }
        ]
      }
    ];

    // Create flagged reports
    const flaggedReports = [
      {
        title: 'Broken Streetlight on Oak Avenue',
        description: 'The streetlight at the corner of Oak Avenue and 2nd Street has been broken for weeks. This is creating a safety hazard for pedestrians and drivers.',
        category: 'maintenance',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        reporterId: testUser._id,
        isFlagged: true,
        flaggedAt: new Date(),
        reports: [
          {
            reporterId: reporterUser._id,
            reason: 'Spam or repetitive content',
            reportedAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
          }
        ]
      }
    ];

    // Remove existing test content
    await Notice.deleteMany({ 
      $or: [
        { title: { $in: flaggedNotices.map(n => n.title) } },
        { authorId: { $in: [testUser._id, reporterUser._id] } }
      ]
    });
    await Report.deleteMany({ 
      $or: [
        { title: { $in: flaggedReports.map(r => r.title) } },
        { reporterId: { $in: [testUser._id, reporterUser._id] } }
      ]
    });

    // Insert new test content
    await Notice.insertMany(flaggedNotices);
    await Report.insertMany(flaggedReports);

    console.log(`Created ${flaggedNotices.length} flagged notices`);
    console.log(`Created ${flaggedReports.length} flagged reports`);
    console.log('Test flagged content created successfully!');

    // Verify the content was created
    const totalFlaggedNotices = await Notice.countDocuments({ isFlagged: true });
    const totalFlaggedReports = await Report.countDocuments({ isFlagged: true });
    
    console.log(`\nVerification:`);
    console.log(`Total flagged notices in database: ${totalFlaggedNotices}`);
    console.log(`Total flagged reports in database: ${totalFlaggedReports}`);

  } catch (error) {
    console.error('Error creating test flagged content:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  createTestFlaggedContent();
}

module.exports = { createTestFlaggedContent };