# Enhanced MessageContext Documentation

## Overview

The MessageContext has been enhanced with improved error handling, retry logic, and better user experience features. This document outlines the new capabilities and how to use them.

## New Features

### 1. Enhanced Error Handling and Retry Logic

The MessageContext now includes sophisticated error handling with exponential backoff retry logic:

```javascript
const { 
  error,
  isRetryingMessages,
  retryFailedMessage,
  refreshMessages,
  retryLastOperation 
} = useMessage();
```

#### Key Improvements:
- **Automatic Retry**: Failed requests are automatically retried with exponential backoff
- **Smart Error Classification**: Distinguishes between retryable and non-retryable errors
- **User-Friendly Messages**: Provides clear, actionable error messages
- **Toast Notifications**: Shows error notifications with retry actions

### 2. Corrected API Response Format Handling

The context now properly handles both legacy and new API response formats:

```javascript
// Handles both formats automatically
const formattedMessage = {
  id: msg.id || msg._id,
  attachments: msg.attachments || msg.media || [],
  timestamp: new Date(msg.createdAt || msg.timestamp),
  replyTo: msg.replyTo ? {
    id: msg.replyTo.id || msg.replyTo.messageId,
    // ... other fields
  } : null
};
```

#### Supported Field Mappings:
- `id` ↔ `_id`
- `attachments` ↔ `media`
- `createdAt` ↔ `timestamp`
- `type` ↔ `messageType`
- `replyTo.id` ↔ `replyTo.messageId`

### 3. Better Loading States and Error Messages

Enhanced loading indicators and error states:

```javascript
const { 
  isLoadingMessages,
  isRetryingMessages,
  error 
} = useMessage();

// Error object structure
error = {
  message: string,
  type: 'load_messages' | 'send_message' | 'retry_message',
  chatId?: string,
  messageId?: string,
  canRetry: boolean,
  timestamp: Date
}
```

### 4. Manual Refresh Option

Users can manually refresh messages when loading fails:

```javascript
const { refreshMessages, isRetryingMessages } = useMessage();

const handleRefresh = async () => {
  try {
    await refreshMessages();
    // Success handled automatically
  } catch (error) {
    // Error handled automatically with toast notification
  }
};
```

## New Components

### MessageErrorBoundary

Wraps message content and provides error handling UI:

```jsx
import MessageErrorBoundary from '../components/Chat/MessageErrorBoundary';

<MessageErrorBoundary>
  {/* Your message content */}
</MessageErrorBoundary>
```

### MessageLoadingState

Shows loading indicators with skeleton UI:

```jsx
import MessageLoadingState from '../components/Chat/MessageLoadingState';

<MessageLoadingState 
  showSkeleton={true} 
  message="Loading messages..." 
/>
```

### MessageRetryButton

Displays retry button for failed messages:

```jsx
import MessageRetryButton from '../components/Chat/MessageRetryButton';

<MessageRetryButton 
  message={message} 
  className="custom-retry-btn" 
/>
```

## Usage Examples

### Basic Error Handling

```jsx
const ChatComponent = () => {
  const { 
    messages, 
    error, 
    isLoadingMessages,
    loadMessages,
    refreshMessages 
  } = useMessage();

  return (
    <MessageErrorBoundary>
      <MessageLoadingState />
      
      {messages.map(message => (
        <div key={message.id}>
          {message.content}
          <MessageRetryButton message={message} />
        </div>
      ))}
    </MessageErrorBoundary>
  );
};
```

### Manual Retry Operations

```jsx
const ChatControls = () => {
  const { 
    error,
    isRetryingMessages,
    refreshMessages,
    retryLastOperation,
    clearError 
  } = useMessage();

  return (
    <div className="chat-controls">
      <button 
        onClick={refreshMessages}
        disabled={isRetryingMessages}
      >
        {isRetryingMessages ? 'Refreshing...' : 'Refresh'}
      </button>
      
      {error?.canRetry && (
        <button onClick={retryLastOperation}>
          Retry Last Operation
        </button>
      )}
      
      {error && (
        <button onClick={clearError}>
          Clear Error
        </button>
      )}
    </div>
  );
};
```

### Toast Notifications with Actions

The enhanced MessageContext automatically shows toast notifications with retry actions:

```javascript
// Automatic toast for failed message load
showToast({
  message: 'Failed to load messages. You can try refreshing.',
  type: 'error',
  duration: 5000,
  action: {
    label: 'Retry',
    onClick: () => loadMessages(chatId, options)
  }
});

// Automatic toast for failed message send
showToast({
  message: 'Message failed to send. Tap to retry.',
  type: 'error',
  duration: 8000,
  action: {
    label: 'Retry',
    onClick: () => retryFailedMessage(messageId)
  }
});
```

## Error Types

### Load Messages Errors
- **Type**: `load_messages`
- **Retry**: Automatic with exponential backoff
- **UI**: Error boundary with refresh button
- **Toast**: Error notification with retry action

### Send Message Errors
- **Type**: `send_message`
- **Retry**: Manual via retry button or toast action
- **UI**: Failed message status with retry button
- **Toast**: Error notification with retry action

### Retry Message Errors
- **Type**: `retry_message`
- **Retry**: Manual via retry button
- **UI**: Failed message status persists
- **Toast**: Error notification with retry option

## Configuration

### Retry Settings

The retry logic uses these default settings:
- **Max Retries**: 3 for message loading, 2 for message sending
- **Base Delay**: 1000ms
- **Backoff Multiplier**: 2x
- **Jitter**: 10% random variation

### Toast Settings

Default toast configurations:
- **Error Duration**: 5000ms (load errors), 8000ms (send errors)
- **Success Duration**: 3000ms
- **Action Timeout**: No timeout (persistent until dismissed)

## Migration Guide

### From Basic MessageContext

1. **Update imports** to include new functions:
```javascript
// Before
const { messages, sendMessage, loadMessages } = useMessage();

// After
const { 
  messages, 
  sendMessage, 
  loadMessages,
  refreshMessages,
  retryFailedMessage,
  error,
  isRetryingMessages 
} = useMessage();
```

2. **Add error boundary** around message content:
```jsx
// Before
<div className="messages">
  {messages.map(msg => <Message key={msg.id} message={msg} />)}
</div>

// After
<MessageErrorBoundary>
  <div className="messages">
    {messages.map(msg => <Message key={msg.id} message={msg} />)}
  </div>
</MessageErrorBoundary>
```

3. **Add retry buttons** for failed messages:
```jsx
// Before
<div className="message">
  {message.content}
</div>

// After
<div className="message">
  {message.content}
  <MessageRetryButton message={message} />
</div>
```

### Error Handling Migration

```javascript
// Before - Manual error handling
try {
  await loadMessages(chatId);
} catch (error) {
  setError(error.message);
  // Manual retry logic
}

// After - Automatic error handling
await loadMessages(chatId);
// Errors handled automatically with toast notifications and retry options
```

## Best Practices

1. **Always wrap message content** in `MessageErrorBoundary`
2. **Use `MessageLoadingState`** for better loading UX
3. **Include `MessageRetryButton`** for failed messages
4. **Let the context handle errors** - avoid manual error handling
5. **Use `refreshMessages`** for manual refresh functionality
6. **Clear errors** when appropriate using `clearError`

## Troubleshooting

### Common Issues

1. **Toast notifications not showing**
   - Ensure `ToastProvider` wraps your app
   - Check that `useToast` is available in MessageContext

2. **Retry buttons not working**
   - Verify `retryFailedMessage` is called with correct message ID
   - Check that failed messages are properly tracked

3. **Loading states not updating**
   - Ensure `isLoadingMessages` and `isRetryingMessages` are used correctly
   - Check that loading states are cleared after operations

4. **API response format issues**
   - The context handles both legacy and new formats automatically
   - Check server responses match expected field mappings

### Debug Information

Use the debug information available in the context:

```javascript
const { 
  messages,
  failedMessages,
  error,
  isLoadingMessages,
  isRetryingMessages,
  selectedChatId 
} = useMessage();

console.log('Debug Info:', {
  messagesCount: messages.length,
  failedMessagesCount: failedMessages.length,
  currentError: error,
  isLoading: isLoadingMessages,
  isRetrying: isRetryingMessages,
  chatId: selectedChatId
});
```