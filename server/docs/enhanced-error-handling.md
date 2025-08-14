# Enhanced Error Handling and Logging System

## Overview

This document describes the comprehensive error handling and logging system implemented for the chat routes in the neighbourhood watch application. The system provides structured error logging, classification, and user-friendly error responses.

## Features

### 1. Structured Error Classification
- **Error Categories**: Connection, Validation, Authentication, Authorization, Business Logic, etc.
- **Severity Levels**: Critical, High, Medium, Low, Info
- **Retry Logic**: Automatic determination of whether errors are retryable
- **User Impact Assessment**: Individual, Group, or All users affected

### 2. Enhanced Logging
- **Contextual Information**: Request details, user information, operation metadata
- **Performance Monitoring**: Operation timing and slow operation detection
- **Database State Tracking**: Connection status and query performance
- **Memory Usage Monitoring**: Resource consumption tracking

### 3. Request Validation
- **Parameter Validation**: Comprehensive validation with detailed error messages
- **ObjectId Validation**: MongoDB ObjectId format validation
- **Content Validation**: Message content, attachment, and metadata validation
- **Business Rule Validation**: Group membership, permissions, etc.

### 4. Database Operation Wrapper
- **Retry Logic**: Exponential backoff for transient errors
- **Timeout Handling**: Configurable timeouts for database operations
- **Connection Management**: Automatic reconnection attempts
- **Performance Tracking**: Query execution time monitoring

## Implementation Details

### Error Logging Utility

```javascript
const logChatError = (error, context = {}, operationName = 'Chat operation') => {
  // Enhance error with classification
  const enhancedError = enhanceError(error);
  
  // Create comprehensive context
  const chatContext = {
    operation: operationName,
    timestamp: new Date().toISOString(),
    source: 'chat_routes',
    ...context,
    dbConnectionState: mongoose.connection.readyState,
    memoryUsage: process.memoryUsage(),
    requestDuration: context.startTime ? Date.now() - context.startTime : null
  };
  
  // Use comprehensive error classification system
  logClassifiedError(enhancedError, chatContext);
  
  return enhancedError;
};
```

### Request Validation

```javascript
const validateAndLogRequest = (req, context = {}) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = createError('Request validation failed', {
      code: 'VALIDATION_ERROR',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        validationErrors: errors.array(),
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query
      }
    });
    
    logChatError(validationError, context, 'Request validation');
    
    return {
      errors: errors.array(),
      message: 'Invalid request parameters',
      code: 'VALIDATION_ERROR'
    };
  }
  
  return null;
};
```

### Error Response Creation

```javascript
const createChatErrorResponse = (error, context = {}, operationName = 'Chat operation') => {
  const enhancedError = logChatError(error, context, operationName);
  const classification = enhancedError.classification;
  
  const errorResponse = {
    message: classification?.userFriendlyMessage || 'An error occurred while processing your request',
    code: classification?.code || 'CHAT_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Add retry information for transient errors
  if (classification?.retryable) {
    errorResponse.retryable = true;
    errorResponse.retryAfter = 1;
  }
  
  // Add validation details if available
  if (classification?.category === ErrorCategory.VALIDATION && classification.validationErrors) {
    errorResponse.details = classification.validationErrors;
  }
  
  // Development debug information
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      originalMessage: error.message,
      stack: error.stack,
      classification: {
        type: classification?.type,
        category: classification?.category,
        severity: classification?.severity,
        reason: classification?.reason
      },
      context: {
        operation: operationName,
        userId: context.userId,
        groupId: context.groupId,
        method: context.method,
        path: context.path
      }
    };
  }
  
  return errorResponse;
};
```

## Usage Examples

### 1. Route Implementation with Enhanced Error Handling

```javascript
router.get('/groups/:groupId/messages', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('before').optional().isISO8601().withMessage('Before parameter must be a valid ISO8601 date')
], async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    groupId: req.params.groupId,
    userId: req.user?.userId,
    query: req.query,
    method: req.method,
    path: req.path,
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  try {
    // Enhanced request validation
    const validationError = validateAndLogRequest(req, requestContext);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      const invalidIdError = createError('Invalid group ID format', {
        code: 'INVALID_GROUP_ID',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM
      });
      
      const errorResponse = createChatErrorResponse(invalidIdError, requestContext, 'Group ID validation');
      return res.status(400).json(errorResponse);
    }

    // Database operations with retry logic
    const messages = await executeQuery(
      () => Message.find(messageQuery)
        .populate('senderId', 'firstName lastName profileImageUrl')
        .populate('replyTo.messageId', 'content senderId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      {
        operationName: 'Fetch group messages',
        timeout: 15000,
        metadata: { groupId, userId, limit, offset },
        retryOptions: {
          maxRetries: 3,
          initialDelayMs: 1000,
          shouldRetry: (error) => {
            const classification = error.classification;
            return classification?.retryable && 
                   classification?.category !== ErrorCategory.VALIDATION;
          }
        }
      }
    );

    res.json(formattedMessages);
  } catch (error) {
    const errorResponse = createChatErrorResponse(error, requestContext, 'Fetch group messages');
    
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.VALIDATION:
          statusCode = 400;
          break;
        case ErrorCategory.AUTHORIZATION:
          statusCode = 403;
          break;
        case ErrorCategory.CONNECTION:
          statusCode = 503;
          break;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});
```

### 2. Database Operation with Error Handling

```javascript
const group = await executeQuery(
  () => ChatGroup.findOne({
    _id: groupId,
    'members.userId': userId,
    isActive: true
  }),
  {
    operationName: 'Verify group membership',
    timeout: 10000,
    metadata: { groupId, userId },
    retryOptions: {
      maxRetries: 2,
      initialDelayMs: 500
    }
  }
);
```

## Error Types and Responses

### Validation Errors (400)
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-value",
      "msg": "Field validation message",
      "path": "fieldName",
      "location": "body"
    }
  ],
  "message": "Invalid request parameters",
  "code": "VALIDATION_ERROR"
}
```

### Authorization Errors (403)
```json
{
  "message": "You don't have permission to access this resource",
  "code": "GROUP_ACCESS_DENIED",
  "timestamp": "2025-08-14T08:39:36.444Z"
}
```

### Connection Errors (503)
```json
{
  "message": "We're having trouble connecting to the database. Please try again shortly.",
  "code": "CONNECTION_ERROR",
  "timestamp": "2025-08-14T08:39:36.444Z",
  "retryable": true,
  "retryAfter": 1
}
```

### Server Errors (500)
```json
{
  "message": "Something went wrong. Please try again later.",
  "code": "INTERNAL_ERROR",
  "timestamp": "2025-08-14T08:39:36.444Z"
}
```

## Performance Monitoring

### Slow Operation Detection
Operations taking longer than expected thresholds are automatically logged as warnings:

```
[SLOW OPERATION] Group messages fetch took 2500ms for group 507f1f77bcf86cd799439011 (50 messages)
```

### Memory Usage Tracking
Each error log includes current memory usage:

```json
{
  "memoryUsage": {
    "rss": 96174080,
    "heapTotal": 61521920,
    "heapUsed": 28056224,
    "external": 20858019,
    "arrayBuffers": 18264983
  }
}
```

## Configuration

### Environment Variables
- `NODE_ENV`: Controls debug information inclusion in error responses
- `MONGODB_URI`: Database connection string for error context

### Timeouts
- **Default Query Timeout**: 15 seconds
- **User Info Fetch**: 5 seconds
- **Group Verification**: 10 seconds
- **Message Save**: 10 seconds

### Retry Configuration
- **Max Retries**: 3 for critical operations, 2 for standard operations
- **Initial Delay**: 500ms - 1000ms depending on operation
- **Backoff Strategy**: Exponential with jitter

## Testing

### Unit Tests
Run the enhanced error handling tests:
```bash
node server/test-enhanced-error-handling.js
```

### Integration Tests
Run the chat error integration tests:
```bash
node server/test-chat-error-integration.js
```

## Monitoring and Alerts

### Critical Error Alerts
Critical errors (severity: CRITICAL) are logged with special formatting and can be configured to trigger alerts in production:

```
=== CRITICAL CHAT ERROR ALERT ===
Operation: Fetch group messages
User ID: 507f1f77bcf86cd799439011
Group ID: 507f1f77bcf86cd799439012
Error Category: connection
Error Type: transient
Retryable: true
User Impact: group
Time: 2025-08-14T08:39:36.444Z
================================
```

### Performance Metrics
- Operation duration tracking
- Slow operation warnings (>2s for fetch, >3s for send)
- Memory usage monitoring
- Database connection state tracking

## Best Practices

1. **Always use enhanced error handling** for all chat-related operations
2. **Include comprehensive context** in error logs for debugging
3. **Validate input parameters** before database operations
4. **Use appropriate HTTP status codes** based on error classification
5. **Provide user-friendly error messages** while logging technical details
6. **Monitor performance** and log slow operations
7. **Test error scenarios** regularly to ensure proper handling
8. **Use retry logic** for transient errors only
9. **Log critical errors** with special attention for monitoring
10. **Include request context** in all error logs for traceability

## Future Enhancements

1. **External Monitoring Integration**: Send critical errors to monitoring services
2. **Error Rate Limiting**: Prevent error spam from malicious requests
3. **Error Analytics**: Aggregate error patterns for system health insights
4. **Custom Error Pages**: User-friendly error pages for web interface
5. **Error Recovery Suggestions**: Provide specific recovery actions for different error types