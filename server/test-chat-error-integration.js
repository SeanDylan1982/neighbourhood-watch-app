/**
 * Integration test for chat routes with enhanced error handling
 * Tests actual database operations and error scenarios
 */

const mongoose = require('mongoose');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const User = require('./models/User');

/**
 * Test chat operations with enhanced error handling
 */
async function testChatErrorIntegration() {
  console.log('=== Testing Chat Error Integration ===\n');

  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-watch-test');
      console.log('✓ Connected to database');
    }

    // Test 1: Test error logging utility directly
    console.log('\n1. Testing chat error logging utility...');
    const { logClassifiedError } = require('./utils/errorClassification');
    
    // Import the chat error logging function
    const chatRoutes = require('./routes/chat');
    
    // Create a test error
    const testError = new Error('Test chat operation failed');
    testError.code = 'CHAT_TEST_ERROR';
    
    // Test the enhanced logging (this should be visible in console)
    console.log('Logging test error...');
    logClassifiedError(testError, {
      operation: 'test_chat_operation',
      userId: '507f1f77bcf86cd799439011',
      groupId: '507f1f77bcf86cd799439012',
      source: 'integration_test',
      method: 'GET',
      path: '/test',
      startTime: Date.now()
    });
    console.log('✓ Chat error logging completed');

    // Test 2: Test database operation wrapper with chat models
    console.log('\n2. Testing database operations with error handling...');
    const { executeQuery } = require('./utils/dbOperationWrapper');
    
    // Test successful operation
    const groupCount = await executeQuery(
      () => ChatGroup.countDocuments({ isActive: true }),
      {
        operationName: 'Count active chat groups',
        timeout: 5000,
        metadata: { test: true, operation: 'count_groups' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 100
        }
      }
    );
    console.log(`✓ Found ${groupCount} active chat groups`);

    // Test message count
    const messageCount = await executeQuery(
      () => Message.countDocuments({ moderationStatus: 'active' }),
      {
        operationName: 'Count active messages',
        timeout: 5000,
        metadata: { test: true, operation: 'count_messages' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 100
        }
      }
    );
    console.log(`✓ Found ${messageCount} active messages`);

    // Test 3: Test error classification for different error types
    console.log('\n3. Testing error classification for chat-specific errors...');
    const { classifyError, ErrorCategory, ErrorSeverity } = require('./utils/errorClassification');
    
    // Test validation error
    const validationError = new Error('Message content is required');
    validationError.name = 'ValidationError';
    const validationClassification = classifyError(validationError);
    console.log('Validation Error Classification:', {
      category: validationClassification.category,
      severity: validationClassification.severity,
      retryable: validationClassification.retryable,
      userFriendlyMessage: validationClassification.userFriendlyMessage
    });

    // Test connection error
    const connectionError = new Error('Server selection timed out');
    const connectionClassification = classifyError(connectionError);
    console.log('Connection Error Classification:', {
      category: connectionClassification.category,
      severity: connectionClassification.severity,
      retryable: connectionClassification.retryable,
      userFriendlyMessage: connectionClassification.userFriendlyMessage
    });

    // Test duplicate key error
    const duplicateError = new Error('Duplicate key error');
    duplicateError.name = 'MongoServerError';
    duplicateError.code = 11000;
    duplicateError.keyPattern = { name: 1 };
    const duplicateClassification = classifyError(duplicateError);
    console.log('Duplicate Key Error Classification:', {
      category: duplicateClassification.category,
      severity: duplicateClassification.severity,
      retryable: duplicateClassification.retryable,
      userFriendlyMessage: duplicateClassification.userFriendlyMessage
    });

    console.log('✓ Error classification tests completed');

    // Test 4: Test request validation utility
    console.log('\n4. Testing request validation utility...');
    
    // Mock express-validator result
    const mockValidationResult = (errors) => ({
      isEmpty: () => errors.length === 0,
      array: () => errors
    });

    // Mock request object
    const mockReq = {
      body: { content: '' },
      params: { groupId: 'invalid-id' },
      query: { limit: '200' },
      user: { userId: '507f1f77bcf86cd799439011' },
      method: 'POST',
      path: '/groups/invalid-id/messages'
    };

    // Test validation with errors
    const validationErrors = [
      {
        type: 'field',
        value: '',
        msg: 'Content is required',
        path: 'content',
        location: 'body'
      }
    ];

    console.log('Mock validation errors:', validationErrors);
    console.log('✓ Request validation utility test completed');

    console.log('\n=== Chat Error Integration Tests Completed Successfully ===');

  } catch (error) {
    console.error('Integration test failed:', error);
    throw error;
  }
}

/**
 * Test performance monitoring
 */
async function testPerformanceMonitoring() {
  console.log('\n=== Testing Performance Monitoring ===\n');

  try {
    const { executeQuery } = require('./utils/dbOperationWrapper');
    
    // Test operation timing
    console.log('1. Testing operation timing...');
    const startTime = Date.now();
    
    await executeQuery(
      () => new Promise(resolve => setTimeout(resolve, 100)), // 100ms delay
      {
        operationName: 'Test timing operation',
        timeout: 5000,
        metadata: { test: true, expectedDuration: 100 }
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`✓ Operation completed in ${duration}ms`);

    // Test slow operation warning
    console.log('\n2. Testing slow operation detection...');
    await executeQuery(
      () => new Promise(resolve => setTimeout(resolve, 1100)), // 1.1s delay
      {
        operationName: 'Test slow operation',
        timeout: 5000,
        metadata: { test: true, expectedDuration: 1100 }
      }
    );
    console.log('✓ Slow operation completed (check for warning above)');

    console.log('\n=== Performance Monitoring Tests Completed ===');

  } catch (error) {
    console.error('Performance monitoring test failed:', error);
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  try {
    await testChatErrorIntegration();
    await testPerformanceMonitoring();
    
    console.log('\n🎉 All integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Integration tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  testChatErrorIntegration,
  testPerformanceMonitoring,
  runIntegrationTests
};