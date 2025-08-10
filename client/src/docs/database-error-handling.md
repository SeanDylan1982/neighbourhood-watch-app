# Database Error Handling and User Feedback

This document describes the enhanced database error handling and user feedback system implemented in the Neighborhood Watch application.

## Overview

The database error handling system provides user-friendly feedback for database issues, implements retry mechanisms for recoverable errors, and adds offline mode indicators when the database is unavailable. This system improves user experience by providing clear information about database issues and appropriate recovery options.

## Components

### 1. DatabaseErrorIndicator

A specialized component for displaying database-specific error messages with appropriate user feedback and retry options.

**Features:**
- Displays user-friendly error messages based on error classification
- Shows appropriate icons and severity levels
- Provides retry buttons for recoverable errors
- Includes technical details for debugging (expandable)
- Supports both inline and toast notification styles

**Usage Example:**
```jsx
import DatabaseErrorIndicator from '../components/Common/DatabaseErrorIndicator';

// In your component
return (
  <DatabaseErrorIndicator
    error={dbError}
    onRetry={handleRetry}
    onDismiss={clearError}
    showDetails={isDevelopment}
    isRetrying={isRetrying}
  />
);
```

### 2. DatabaseOfflineIndicator

A persistent indicator that appears when the database is unavailable, providing information about offline capabilities and retry options.

**Features:**
- Shows offline duration
- Provides automatic retry with exponential backoff
- Lists available offline capabilities
- Minimizable to reduce screen space usage
- Displays reconnection status

**Usage Example:**
```jsx
import DatabaseOfflineIndicator from '../components/Common/DatabaseOfflineIndicator';

// In your component
return (
  <DatabaseOfflineIndicator
    onRetry={retryConnection}
    offlineSince={offlineSince}
    retryInProgress={isRetrying}
    offlineCapabilities={[
      'View cached data',
      'Create draft messages',
      'Prepare reports (will be sent when online)'
    ]}
  />
);
```

### 3. useDatabaseErrorHandler Hook

A custom hook for handling database-specific errors with enhanced user feedback and automatic retry capabilities.

**Features:**
- Detects database-specific errors
- Implements retry logic with exponential backoff
- Tracks database offline status
- Provides methods for manual retry
- Integrates with the health check API

**Usage Example:**
```jsx
import useDatabaseErrorHandler from '../hooks/useDatabaseErrorHandler';

function MyComponent() {
  const {
    dbError,
    isRetrying,
    isDbOffline,
    offlineSince,
    retryConnection,
    handleDatabaseError,
    withDatabaseErrorHandling
  } = useDatabaseErrorHandler();

  const fetchData = async () => {
    try {
      // Use the wrapper for automatic error handling
      const data = await withDatabaseErrorHandling(
        () => api.get('/api/data'),
        'fetching data'
      );
      return data;
    } catch (error) {
      // Non-database errors can be handled here
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {dbError && (
        <DatabaseErrorIndicator
          error={dbError}
          onRetry={retryConnection}
          isRetrying={isRetrying}
        />
      )}
      
      {isDbOffline && (
        <DatabaseOfflineIndicator
          onRetry={retryConnection}
          offlineSince={offlineSince}
          retryInProgress={isRetrying}
        />
      )}
      
      {/* Rest of your component */}
    </div>
  );
}
```

## Error Classification

Database errors are classified along multiple dimensions:

### 1. Error Categories

- **Connection**: Database connection issues
- **Query**: Query execution errors
- **Transaction**: Transaction-related errors
- **Validation**: Data validation errors
- **Schema**: Schema-related errors
- **Authentication**: Auth-related errors
- **Authorization**: Permission-related errors

### 2. Error Severity

- **Critical**: Requires immediate attention, system functionality severely impacted
- **High**: Significant impact on functionality, requires prompt attention
- **Medium**: Moderate impact, should be addressed soon
- **Low**: Minor impact, can be addressed in regular maintenance

### 3. Retryability

Errors are classified as retryable or non-retryable:

- **Retryable**: Temporary issues that can be resolved with retries (e.g., network timeouts)
- **Non-retryable**: Persistent issues that won't be resolved by retrying (e.g., validation errors)

## User-Friendly Messages

The system provides user-friendly error messages based on error category and severity:

- **Connection Errors**: "We're having trouble connecting to the database. Please try again shortly."
- **Authentication Errors**: "Authentication failed. Please check your credentials and try again."
- **Validation Errors**: "The information provided contains errors. Please check your input and try again."
- **Transaction Errors**: "Your request couldn't be completed. Please try again."

## Retry Mechanism

For retryable errors, the system implements an exponential backoff retry mechanism:

1. Initial retry after a short delay (e.g., 1 second)
2. Subsequent retries with exponentially increasing delays
3. Maximum retry delay cap (e.g., 30 seconds)
4. Jitter to prevent thundering herd problem
5. Maximum number of retry attempts

## Offline Mode

When the database is unavailable, the system enters offline mode:

1. Displays a persistent offline indicator
2. Shows available offline capabilities
3. Automatically attempts reconnection with exponential backoff
4. Provides manual retry option
5. Shows offline duration

## Health Check API

The system includes a health check API endpoint for monitoring database status:

- `GET /api/health/database`: Returns database health status
- Response includes detailed error classification for better client-side handling

## Integration with Existing Components

The enhanced error handling system integrates with existing components:

- **ErrorDisplay**: General error display component
- **OfflineIndicator**: General offline status indicator
- **useApi**: API request hook
- **useErrorHandler**: General error handling hook

## Best Practices

When implementing database operations:

1. Use the `useDatabaseErrorHandler` hook for database-specific error handling
2. Wrap database operations with `withDatabaseErrorHandling`
3. Display appropriate error indicators based on error type
4. Implement offline capabilities where possible
5. Use the health check API to monitor database status

## Example Implementation

```jsx
import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress } from '@mui/material';
import useApi from '../hooks/useApi';
import useDatabaseErrorHandler from '../hooks/useDatabaseErrorHandler';
import DatabaseErrorIndicator from '../components/Common/DatabaseErrorIndicator';
import DatabaseOfflineIndicator from '../components/Common/DatabaseOfflineIndicator';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { get } = useApi();
  const {
    dbError,
    isRetrying,
    isDbOffline,
    offlineSince,
    retryConnection,
    withDatabaseErrorHandling
  } = useDatabaseErrorHandler();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await withDatabaseErrorHandling(
        () => get('/api/users'),
        'fetching users'
      );
      setUsers(data);
    } catch (error) {
      // Non-database errors handled here
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      {dbError && (
        <DatabaseErrorIndicator
          error={dbError}
          onRetry={fetchUsers}
          isRetrying={isRetrying}
        />
      )}
      
      {isDbOffline && (
        <DatabaseOfflineIndicator
          onRetry={retryConnection}
          offlineSince={offlineSince}
          retryInProgress={isRetrying}
          offlineCapabilities={[
            'View cached user data',
            'Create draft messages'
          ]}
        />
      )}
      
      <Typography variant="h5">Users</Typography>
      
      <Button 
        onClick={fetchUsers} 
        disabled={loading || isRetrying}
        startIcon={loading ? <CircularProgress size={16} /> : null}
      >
        Refresh
      </Button>
      
      {loading ? (
        <CircularProgress />
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserList;
```

## Conclusion

This enhanced database error handling system improves user experience by providing clear information about database issues, implementing appropriate retry mechanisms, and supporting offline capabilities. By categorizing errors and providing user-friendly messages, the system helps users understand and recover from database issues more effectively.
</content>