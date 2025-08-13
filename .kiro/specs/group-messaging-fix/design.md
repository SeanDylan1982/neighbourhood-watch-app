# Design Document

## Overview

This design document outlines the solution for fixing critical group messaging functionality that is currently failing with 500 server errors. The root cause analysis reveals that while database queries work correctly, there are inconsistencies between the Message model schema and the API route implementation that cause server errors during message fetching and display.

## Architecture

### Problem Analysis

Based on debugging, the issues identified are:

1. **Schema Mismatch**: The route attempts to populate `replyToId` but the Message model uses `replyTo.messageId`
2. **Legacy Field Mapping**: The route uses both `media` and `attachments` fields inconsistently
3. **Error Handling**: Insufficient error logging makes debugging difficult
4. **Frontend-Backend Contract**: Mismatch between expected data format and actual response

### Solution Architecture

The fix involves three main components:

```
API Route Layer (server/routes/chat.js)
├── Fix populate field references
├── Standardize response format
├── Add comprehensive error logging
└── Ensure consistent field mapping

Message Model (server/models/Message.js)
├── Validate schema consistency
└── Ensure proper indexing

Frontend Integration
├── Update MessageContext to handle corrected response format
└── Add better error handling and retry logic
```

## Components and Interfaces

### 1. Fixed Group Messages Route

**Purpose**: Correctly fetch and format group messages without server errors

**Key Changes**:
- Fix populate field reference from `replyToId` to `replyTo.messageId`
- Standardize attachment field mapping
- Add comprehensive error logging
- Ensure consistent response format

**Interface**:
```javascript
GET /api/chat/groups/:groupId/messages
Query Parameters:
- limit: number (1-100, default: 50)
- offset: number (min: 0, default: 0)
- before: ISO8601 date string

Response Format:
{
  id: string,
  content: string,
  type: string,
  messageType: string, // Legacy support
  media: Array<Attachment>,
  attachments: Array<Attachment>, // Mapped from media
  senderId: string,
  senderName: string,
  senderAvatar: string,
  replyTo: {
    id: string,
    content: string,
    senderId: string
  } | null,
  reactions: Array<Reaction>,
  isEdited: boolean,
  isForwarded: boolean,
  forwardedFrom: ForwardedInfo,
  status: string,
  createdAt: string,
  updatedAt: string,
  timestamp: string // Frontend compatibility
}
```

### 2. Enhanced Error Logging

**Purpose**: Provide detailed error information for debugging

**Key Features**:
- Log request parameters and user context
- Log database query details
- Log populate operation failures
- Structured error responses

**Implementation**:
```javascript
// Enhanced error logging middleware
const logError = (error, context) => {
  console.error('=== GROUP MESSAGES ERROR ===');
  console.error('Context:', context);
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('Time:', new Date().toISOString());
  console.error('=============================');
};
```

### 3. Message Format Standardization

**Purpose**: Ensure consistent data format between database and frontend

**Key Features**:
- Map `media` field to `attachments` for frontend compatibility
- Handle both new and legacy field names
- Ensure proper null handling for optional fields
- Consistent timestamp formatting

### 4. Frontend Error Handling Enhancement

**Purpose**: Improve error handling and user feedback in MessageContext

**Key Features**:
- Better error messages for different failure types
- Retry logic with exponential backoff
- Loading state management
- Fallback UI for failed message loads

## Data Models

### Fixed Message Response Format

```javascript
interface MessageResponse {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact';
  messageType: string; // Legacy support
  media: Attachment[];
  attachments: Attachment[]; // Mapped from media
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  reactions: Reaction[];
  isEdited: boolean;
  isForwarded: boolean;
  forwardedFrom?: ForwardedInfo;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
  timestamp: string; // Frontend compatibility
}
```

### Error Response Format

```javascript
interface ErrorResponse {
  message: string;
  error?: string; // Development only
  context?: {
    groupId: string;
    userId: string;
    query: object;
  }; // Development only
}
```

## Error Handling

### Server-Side Error Handling

1. **Database Connection Errors**:
   - Log connection status and retry attempts
   - Return appropriate HTTP status codes
   - Provide user-friendly error messages

2. **Query Execution Errors**:
   - Log query parameters and execution context
   - Handle populate failures gracefully
   - Fallback to basic message data if populate fails

3. **Data Formatting Errors**:
   - Validate data before formatting
   - Handle missing or null fields gracefully
   - Log formatting failures with context

### Client-Side Error Handling

1. **Network Errors**:
   - Implement retry logic with exponential backoff
   - Show appropriate loading states
   - Provide manual refresh options

2. **Server Errors**:
   - Display user-friendly error messages
   - Log detailed error information for debugging
   - Offer fallback functionality where possible

3. **Data Validation Errors**:
   - Validate received data structure
   - Handle missing fields gracefully
   - Provide default values for optional fields

## Testing Strategy

### Unit Testing

1. **Route Testing**:
   - Test successful message fetching
   - Test error scenarios (invalid group ID, unauthorized access)
   - Test query parameter validation
   - Test populate operation handling

2. **Data Formatting Testing**:
   - Test message response format consistency
   - Test attachment field mapping
   - Test null/undefined field handling
   - Test legacy field support

### Integration Testing

1. **Database Integration**:
   - Test with real database connections
   - Test populate operations with actual data
   - Test query performance with large datasets
   - Test error scenarios (connection failures, timeouts)

2. **Frontend Integration**:
   - Test MessageContext with corrected API responses
   - Test error handling and retry logic
   - Test loading states and user feedback
   - Test real-time message updates

### Error Scenario Testing

1. **Server Error Scenarios**:
   - Database connection failures
   - Invalid ObjectId formats
   - Missing user permissions
   - Populate operation failures

2. **Client Error Scenarios**:
   - Network connectivity issues
   - Invalid server responses
   - Timeout scenarios
   - Malformed data handling

## Implementation Phases

### Phase 1: Fix Core Route Issues
- Fix populate field reference in group messages route
- Standardize attachment field mapping
- Add comprehensive error logging
- Test basic message fetching functionality

### Phase 2: Enhance Error Handling
- Implement structured error responses
- Add request context logging
- Improve client-side error handling
- Add retry logic with exponential backoff

### Phase 3: Data Format Standardization
- Ensure consistent response format
- Handle legacy field support
- Add data validation
- Test with various message types

### Phase 4: Testing and Validation
- Comprehensive route testing
- Integration testing with frontend
- Performance testing with large datasets
- Error scenario validation

## Technical Considerations

### Performance Optimizations

1. **Query Optimization**: Ensure proper indexing for message queries
2. **Populate Efficiency**: Only populate required fields to reduce data transfer
3. **Pagination**: Implement efficient pagination for large message lists
4. **Caching**: Consider caching frequently accessed group information

### Security Considerations

1. **Authorization**: Verify user membership before returning messages
2. **Data Sanitization**: Ensure message content is properly sanitized
3. **Rate Limiting**: Implement appropriate rate limiting for message endpoints
4. **Input Validation**: Validate all query parameters and request data

### Monitoring and Debugging

1. **Error Tracking**: Implement structured error logging for production debugging
2. **Performance Monitoring**: Track query execution times and response sizes
3. **Health Checks**: Add health check endpoints for message functionality
4. **Metrics Collection**: Collect metrics on message fetch success rates

## Backward Compatibility

### Legacy Field Support

1. **messageType vs type**: Support both field names in responses
2. **media vs attachments**: Map media field to attachments for frontend compatibility
3. **timestamp vs createdAt**: Provide both timestamp formats
4. **Gradual Migration**: Allow gradual migration of frontend code to new field names

### API Versioning

1. **Current Version**: Maintain current API contract while fixing bugs
2. **Future Versions**: Plan for API versioning if major changes are needed
3. **Deprecation Strategy**: Provide clear deprecation timeline for legacy fields