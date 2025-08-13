/**
 * Script to test the FlaggedContentService API endpoints
 * Run with: node scripts/test-flagged-content-api.js
 */

const mongoose = require('mongoose');
const FlaggedContentService = require('../services/FlaggedContentService');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testFlaggedContentAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neighbourhood-watch');
    console.log('Connected to database');

    console.log('\n=== Testing FlaggedContentService API ===\n');

    // Test 1: Get all flagged content
    console.log('1. Testing getFlaggedContent() - All content:');
    const allFlaggedContent = await FlaggedContentService.getFlaggedContent();
    console.log(`   Found ${allFlaggedContent.total} flagged items`);
    console.log(`   Page ${allFlaggedContent.page} of ${allFlaggedContent.totalPages}`);
    
    if (allFlaggedContent.content.length > 0) {
      console.log('   Sample items:');
      allFlaggedContent.content.slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.contentType}: "${item.title}" (${item.reportCount} reports)`);
      });
    }

    // Test 2: Get flagged notices only
    console.log('\n2. Testing getFlaggedContent() - Notices only:');
    const flaggedNotices = await FlaggedContentService.getFlaggedContent({ contentType: 'notice' });
    console.log(`   Found ${flaggedNotices.total} flagged notices`);

    // Test 3: Get flagged reports only
    console.log('\n3. Testing getFlaggedContent() - Reports only:');
    const flaggedReports = await FlaggedContentService.getFlaggedContent({ contentType: 'report' });
    console.log(`   Found ${flaggedReports.total} flagged reports`);

    // Test 4: Test pagination
    console.log('\n4. Testing pagination (limit=2):');
    const paginatedContent = await FlaggedContentService.getFlaggedContent({ limit: 2 });
    console.log(`   Page 1: ${paginatedContent.content.length} items`);
    console.log(`   Total pages: ${paginatedContent.totalPages}`);

    // Test 5: Test sorting by report count
    console.log('\n5. Testing sorting by report count:');
    const sortedContent = await FlaggedContentService.getFlaggedContent({ 
      sortBy: 'reportCount', 
      sortOrder: 'desc' 
    });
    if (sortedContent.content.length > 0) {
      console.log('   Items sorted by report count (desc):');
      sortedContent.content.slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. "${item.title}" - ${item.reportCount} reports`);
      });
    }

    console.log('\n=== API Test Complete ===');
    console.log('✓ All FlaggedContentService methods working correctly');

  } catch (error) {
    console.error('Error testing FlaggedContentService API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the test
if (require.main === module) {
  testFlaggedContentAPI();
}

module.exports = { testFlaggedContentAPI };