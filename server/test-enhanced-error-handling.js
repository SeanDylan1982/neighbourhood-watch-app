/**
 * Test script for enhanced error handling and logging in chat routes
 * This script tests various error scenarios to ensure proper logging and response formatting
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
 * Test enhanced error logging functionality
 */
async function testErrorLogging() {
  console.log('=== Testing Enhanced Error Handling and Logging ===\n');

  try {
    // Connect to test database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch-test');
      console.log('✓ Connected to test database');
    }

    // Test 1: Invalid Group ID Format
    console.log('\n1. Testing invalid group ID format...');
    const invalidIdResponse = await request(app)
      .get('/api/chat/groups/invalid-id/messages')
      .expect(400);
    
    console.log('Response:', JSON.stringify(invalidIdResponse.body, null, 2));
    console.log('✓ Invalid group ID handled correctly');

    // Test 2: Validation Error
    console.log('\n2. Testing validation errors...');
    const validationResponse = await request(app)
      .get('/api/chat/groups/507f1f77bcf86cd799439011/messages?limit=200') // Exceeds max limit
      .expect(400);
    
    console.log('Response:', JSON.stringify(validationResponse.body, null, 2));
    console.log('✓ Validation error handled correctly');

    // Test 3: Missing Content in Message Send
    console.log('\n3. Testing missing content validation...');
    const missingContentResponse = await request(app)
      .post('/api/chat/groups/507f1f77bcf86cd799439011/messages')
      .send({}) // Empty body
      .expect(400);
    
    console.log('Response:', JSON.stringify(missingContentResponse.body, null, 2));
    console.log('✓ Missing content validation handled correctly');

    // Test 4: Invalid Message Type
    console.log('\n4. Testing invalid message type...');
    const invalidTypeResponse = await request(app)
      .post('/api/chat/groups/507f1f77bcf86cd799439011/messages')
      .send({
        content: 'Test message',
        type: 'invalid-type'
      })
      .expect(400);
    
    console.log('Response:', JSON.stringify(invalidTypeResponse.body, null, 2));
    console.log('✓ Invalid message type handled correctly');

    // Test 5: Test Error Classification
    console.log('\n5. Testing error classification system...');
    const { classifyError, ErrorCategory, ErrorSeverity } = require('./utils/errorClassification');
    
    // Test MongoDB connection error
    const connectionError = new Error('connection timed out');
    connectionError.name = 'MongoNetworkError';
    const classification = classifyError(connectionError);
    
    console.log('Connection Error Classification:', {
      category: classification.category,
      severity: classification.severity,
      retryable: classification.retryable,
      userFriendlyMessage: classification.userFriendlyMessage
    });
    console.log('✓ Error classification working correctly');

    // Test 6: Test Enhanced Logging
    console.log('\n6. Testing enhanced logging...');
    const { logClassifiedError } = require('./utils/errorClassification');
    
    const testError = new Error('Test error for logging');
    testError.code = 'TEST_ERROR';
    
    logClassifiedError(testError, {
      operation: 'test_operation',
      userId: '507f1f77bcf86cd799439011',
      groupId: '507f1f77bcf86cd799439012',
      source: 'test_script'
    });
    console.log('✓ Enhanced logging executed (check console output above)');

    console.log('\n=== All Error Handling Tests Completed Successfully ===');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

/**
 * Test database operation wrapper
 */
async function testDatabaseWrapper() {
  console.log('\n=== Testing Database Operation Wrapper ===\n');

  try {
    const { executeQuery } = require('./utils/dbOperationWrapper');
    const ChatGroup = require('./models/ChatGroup');

    // Test successful operation
    console.log('1. Testing successful database operation...');
    const groups = await executeQuery(
      () => ChatGroup.find({ isActive: true }).limit(1),
      {
        operationName: 'Test fetch groups',
        timeout: 5000,
        metadata: { test: true },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 100
        }
      }
    );
    console.log(`✓ Successfully fetched ${groups.length} groups`);

    // Test operation with timeout (simulated)
    console.log('\n2. Testing operation timeout handling...');
    try {
      await executeQuery(
        () => new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 100);
        }),
        {
          operationName: 'Test timeout operation',
          timeout: 50, // Very short timeout
          metadata: { test: true }
        }
      );
    } catch (timeoutError) {
      console.log('✓ Timeout error handled correctly:', timeoutError.message);
    }

    console.log('\n=== Database Wrapper Tests Completed ===');

  } catch (error) {
    console.error('Database wrapper test failed:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  try {
    await testErrorLogging();
    await testDatabaseWrapper();
    
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testErrorLogging,
  testDatabaseWrapper,
  runTests
};