# Client-Side Data Synchronization

This document describes the client-side data synchronization implementation for the Neighborhood Watch application. The implementation provides optimistic UI updates, offline operation queueing, and conflict resolution strategies.

## Features

- **Optimistic UI Updates**: Updates the UI immediately before server confirmation
- **Offline Operation Queueing**: Stores operations when offline for later execution
- **Conflict Resolution**: Handles conflicts between client and server data
- **Real-Time Synchronization**: Integrates with WebSocket for real-time updates

## Components

### Core Utilities

- **offlineOperationQueue.js**: Manages a queue of operations to be performed when the application is offline
- **optimisticUpdates.js**: Handles optimistic UI updates and rollbacks
- **conflictResolution.js**: Provides conflict detection and resolution strategies

### Hooks

- **useDataSync.js**: Main hook that integrates all synchronization features
- **withDataSync.js**: Higher-order component that provides data sync capabilities to components

### UI Components

- **DataSyncIndicator.js**: Displays synchronization status and pending operations
- **OfflineOperationManager.js**: Manages offline operations and provides UI for syncing
- **SyncAwareList.js**: Example component that uses data synchronization

## Usage

### Basic Usage with Hook

```jsx
import useDataSync from '../hooks/useDataSync';

const MyComponent = () => {
  const {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    syncStatus,
    pendingOperations
  } = useDataSync({
    resourceType: 'messages',
    endpoint: '/api/messages',
    conflictOptions: {
      strategy: 'merge'
    }
  });

  // Use the data and operations
  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {data.map(item => (
            <li key={item.id}>
              {item.title}
              <button onClick={() => updateItem(item.id, { title: 'Updated' })}>
                Update
              </button>
              <button onClick={() => deleteItem(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => createItem({ title: 'New Item' })}>
        Create
      </button>
    </div>
  );
};
```

### Using the Higher-Order Component

```jsx
import withDataSync from '../hocs/withDataSync';

const MyList = ({ data, loading, createItem, updateItem, deleteItem }) => {
  // Component implementation
};

export default withDataSync(MyList, {
  resourceType: 'messages',
  endpoint: '/api/messages',
  conflictOptions: {
    strategy: 'merge'
  },
  showSyncIndicator: true,
  showOfflineManager: true
});
```

## Conflict Resolution Strategies

The following conflict resolution strategies are available:

- **CLIENT_WINS**: Always use the client version
- **SERVER_WINS**: Always use the server version
- **LAST_WRITE_WINS**: Use the version with the most recent timestamp
- **MERGE**: Merge changes from both versions
- **MANUAL**: Use a custom function to resolve conflicts

## Offline Operation Queue

Operations performed while offline are stored in the browser's localStorage and executed when the connection is restored. The queue can be manually processed or cleared through the UI.

## Integration with Real-Time Updates

The implementation integrates with the application's WebSocket system to handle real-time updates from other clients. When a real-time update is received, it is checked for conflicts with any pending optimistic updates.

## Testing

Unit tests are provided in `dataSync.test.js` to verify the functionality of the data synchronization system.

## Future Improvements

- Add support for batch operations
- Implement more sophisticated conflict resolution strategies
- Add support for data encryption in the offline queue
- Improve performance for large datasets
- Add support for file uploads in offline mode