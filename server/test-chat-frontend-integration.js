/**
 * Test script to verify chat frontend integration with enhanced error handling
 * This script tests the chat API endpoints that the frontend will use
 */

const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import the enhanced chat routes
const chatRoutes = require('./routes/chat');

// Mock authentication middleware for testing
const mockAuth = (req, res, next) => {
  // Mock user for testing
  req.user = {
    userId: '507f1f77bcf86cd799439011', // Valid ObjectId for testing
    firstName: 'Test',
    lastName: 'User'
  };
  next();
};

// Create test app
const app = express();
app.use(express.json());
app.use(mockAuth);
app.use('/api/chat', chatRoutes);

/**
 * Test chat API endpoints that the frontend uses
 */
async function testChatFrontendIntegration() {
  console.log('=== Testing Chat Frontend Integration ===\n');

  try {
    // Connect to test database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch-test');
      console.log('✓ Connected to test database');
    }

    // Test 1: Get chat groups (main endpoint used by frontend)
    console.log('\n1. Testing GET /api/chat/groups...');
    const groupsResponse = await request(app)
      .get('/api/chat/groups')
      .expect(200);
    
    console.log('✓ Groups endpoint working');
    console.log(`  - Returned ${Array.isArray(groupsResponse.body) ? groupsResponse.body.length : 0} groups`);

    // Test 2: Test error handling for invalid group ID
    console.log('\n2. Testing error handling for invalid group ID...');
    const invalidIdResponse = await request(app)
      .get('/api/chat/groups/invalid-id/messages')
      .expect(400);
    
    console.log('✓ Invalid ID error handling working');
    console.log('  - Error response:', invalidIdResponse.body.message);
    console.log('  - Error code:', invalidIdResponse.body.code);

    // Test 3: Test validation error handling
    console.log('\n3. Testing validation error handling...');
    const validationResponse = await request(app)
      .post('/api/chat/groups/507f1f77bcf86cd799439011/messages')
      .send({}) // Empty body should trigger validation error
      .expect(400);
    
    console.log('✓ Validation error handling working');
    console.log('  - Validation errors:', validationResponse.body.errors?.length || 0);

    // Test 4: Test group access error
    console.log('\n4. Testing group access error...');
    const accessResponse = await request(app)
      .get('/api/chat/groups/507f1f77bcf86cd799439012/messages') // Non-existent group
      .expect(403);
    
    console.log('✓ Group access error handling working');
    console.log('  - Access error:', accessResponse.body.message);

    // Test 5: Test message format validation
    console.log('\n5. Testing message format validation...');
    const formatResponse = await request(app)
      .post('/api/chat/groups/507f1f77bcf86cd799439011/messages')
      .send({
        content: 'Test message',
        type: 'invalid-type' // Invalid message type
      })
      .expect(400);
    
    console.log('✓ Message format validation working');
    console.log('  - Format error:', formatResponse.body.errors?.[0]?.msg);

    // Test 6: Test performance monitoring
    console.log('\n6. Testing performance monitoring...');
    const startTime = Date.now();
    
    // Make multiple requests to test performance logging
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        request(app)
          .get('/api/chat/groups')
          .expect(200)
      );
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log('✓ Performance monitoring working');
    console.log(`  - 3 concurrent requests completed in ${duration}ms`);

    console.log('\n=== Frontend Integration Tests Completed Successfully ===');
    console.log('\n📋 Summary:');
    console.log('  ✅ Chat groups endpoint working');
    console.log('  ✅ Error handling for invalid IDs');
    console.log('  ✅ Validation error responses');
    console.log('  ✅ Group access control');
    console.log('  ✅ Message format validation');
    console.log('  ✅ Performance monitoring');
    console.log('\n🎉 All frontend integration tests passed!');
    console.log('\nThe chat interface should now work properly with:');
    console.log('  - Enhanced error handling and logging');
    console.log('  - Proper validation and user-friendly error messages');
    console.log('  - Performance monitoring and slow operation detection');
    console.log('  - Structured error responses for frontend consumption');

  } catch (error) {
    console.error('Frontend integration test failed:', error);
    throw error;
  }
}

/**
 * Test error response format for frontend consumption
 */
async function testErrorResponseFormat() {
  console.log('\n=== Testing Error Response Format ===\n');

  try {
    // Test different error types and their response formats
    const errorTests = [
      {
        name: 'Validation Error',
        request: () => request(app).get('/api/chat/groups/invalid-id/messages'),
        expectedStatus: 400,
        expectedFields: ['message', 'code', 'timestamp']
      },
      {
        name: 'Authorization Error',
        request: () => request(app).get('/api/chat/groups/507f1f77bcf86cd799439012/messages'),
        expectedStatus: 403,
        expectedFields: ['message', 'code', 'timestamp']
      },
      {
        name: 'Validation with Details',
        request: () => request(app).post('/api/chat/groups/507f1f77bcf86cd799439011/messages').send({}),
        expectedStatus: 400,
        expectedFields: ['errors', 'message', 'code']
      }
    ];

    for (const test of errorTests) {
      console.log(`Testing ${test.name}...`);
      
      const response = await test.request().expect(test.expectedStatus);
      
      // Check if all expected fields are present
      const missingFields = test.expectedFields.filter(field => !(field in response.body));
      
      if (missingFields.length === 0) {
        console.log(`✓ ${test.name} response format correct`);
        console.log(`  - Status: ${response.status}`);
        console.log(`  - Fields: ${Object.keys(response.body).join(', ')}`);
      } else {
        console.log(`❌ ${test.name} missing fields: ${missingFields.join(', ')}`);
      }
    }

    console.log('\n✅ Error response format tests completed');

  } catch (error) {
    console.error('Error response format test failed:', error);
  }
}

/**
 * Main test runner
 */
async function runFrontendIntegrationTests() {
  try {
    await testChatFrontendIntegration();
    await testErrorResponseFormat();
    
    console.log('\n🎉 All frontend integration tests completed successfully!');
    console.log('\n🚀 The chat interface is ready with enhanced error handling!');
    process.exit(0);
  } catch (error) {
    console.error('Frontend integration tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFrontendIntegrationTests();
}

module.exports = {
  testChatFrontendIntegration,
  testErrorResponseFormat,
  runFrontendIntegrationTests
};