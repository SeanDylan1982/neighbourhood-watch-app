import { renderHook, act } from '@testing-library/react-hooks';
import useDataSync from '../hooks/useDataSync';
import * as offlineQueue from '../utils/offlineOperationQueue';
import * as optimisticUpdates from '../utils/optimisticUpdates';
import * as conflictResolution from '../utils/conflictResolution';

// Mock dependencies
jest.mock('../contexts/SocketContext', () => ({
  useSocket: () => ({
    connectionStatus: 'connected',
    addMessageListener: jest.fn(() => jest.fn()),
    addReportListener: jest.fn(() => jest.fn()),
    addNoticeListener: jest.fn(() => jest.fn()),
    addChatGroupListener: jest.fn(() => jest.fn()),
    addPrivateChatListener: jest.fn(() => jest.fn()),
  })
}));

jest.mock('../hooks/useRealTimeSync', () => () => ({
  isEnabled: true,
  lastSync: null,
  syncCount: 0,
  toggleSync: jest.fn(),
  resetSyncCount: jest.fn()
}));

jest.mock('../hooks/useOfflineDetection', () => () => ({
  isOnline: true,
  wasOffline: false,
  isOffline: false
}));

jest.mock('../hooks/useApi', () => () => ({
  loading: false,
  error: null,
  clearError: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  makeRequest: jest.fn(),
  makeRequestWithRetry: jest.fn(),
  cancelRequest: jest.fn()
}));

jest.mock('../utils/offlineOperationQueue');
jest.mock('../utils/optimisticUpdates');
jest.mock('../utils/conflictResolution');

describe('useDataSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    const mockApi = require('../hooks/useApi')();
    mockApi.get.mockResolvedValue([
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' }
    ]);
    mockApi.post.mockResolvedValue({ id: '3', title: 'New Item' });
    mockApi.put.mockResolvedValue({ id: '1', title: 'Updated Item' });
    mockApi.delete.mockResolvedValue({ success: true });
    
    // Mock offline queue
    offlineQueue.getQueue.mockReturnValue([]);
    offlineQueue.addToQueue.mockReturnValue('queue-id-1');
    offlineQueue.getQueueLength.mockReturnValue(0);
    
    // Mock optimistic updates
    optimisticUpdates.registerOptimisticUpdate.mockReturnValue('update-id-1');
    optimisticUpdates.confirmOptimisticUpdate.mockReturnValue(true);
    optimisticUpdates.applyOptimisticUpdatesToCollection.mockImplementation(
      (resourceType, resources) => resources
    );
    
    // Mock conflict resolution
    conflictResolution.detectConflict.mockReturnValue(false);
    conflictResolution.resolveConflict.mockImplementation(
      (clientData, serverData) => serverData
    );
  });
  
  test('should fetch data on initialization', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].id).toBe('1');
    expect(result.current.data[1].id).toBe('2');
  });
  
  test('should create item with optimistic update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    await waitForNextUpdate();
    
    const newItem = { title: 'New Item' };
    
    act(() => {
      result.current.createItem(newItem);
    });
    
    // Should have optimistic update immediately
    expect(optimisticUpdates.registerOptimisticUpdate).toHaveBeenCalled();
    
    await waitForNextUpdate();
    
    // Should confirm optimistic update after server response
    expect(optimisticUpdates.confirmOptimisticUpdate).toHaveBeenCalled();
  });
  
  test('should update item with optimistic update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    await waitForNextUpdate();
    
    const updates = { title: 'Updated Item' };
    
    act(() => {
      result.current.updateItem('1', updates);
    });
    
    // Should have optimistic update immediately
    expect(optimisticUpdates.registerOptimisticUpdate).toHaveBeenCalled();
    
    await waitForNextUpdate();
    
    // Should confirm optimistic update after server response
    expect(optimisticUpdates.confirmOptimisticUpdate).toHaveBeenCalled();
  });
  
  test('should delete item with optimistic update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    await waitForNextUpdate();
    
    act(() => {
      result.current.deleteItem('1');
    });
    
    // Should have optimistic update immediately
    expect(optimisticUpdates.registerOptimisticUpdate).toHaveBeenCalled();
    
    await waitForNextUpdate();
    
    // Should confirm optimistic update after server response
    expect(optimisticUpdates.confirmOptimisticUpdate).toHaveBeenCalled();
  });
  
  test('should queue operations when offline', async () => {
    // Mock offline state
    require('../hooks/useOfflineDetection').mockReturnValue({
      isOnline: false,
      wasOffline: false,
      isOffline: true
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    await waitForNextUpdate();
    
    const newItem = { title: 'Offline Item' };
    
    act(() => {
      result.current.createItem(newItem);
    });
    
    // Should queue operation
    expect(offlineQueue.addToQueue).toHaveBeenCalled();
    expect(offlineQueue.addToQueue.mock.calls[0][0].type).toBe('create');
  });
  
  test('should process queue when coming back online', async () => {
    // Setup mock for queue processing
    offlineQueue.processQueue.mockResolvedValue({
      total: 1,
      successful: 1,
      failed: 0
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages'
    }));
    
    await waitForNextUpdate();
    
    act(() => {
      result.current.processQueue();
    });
    
    await waitForNextUpdate();
    
    expect(offlineQueue.processQueue).toHaveBeenCalled();
  });
  
  test('should handle conflicts during updates', async () => {
    // Mock conflict detection
    conflictResolution.detectConflict.mockReturnValue(true);
    
    const { result, waitForNextUpdate } = renderHook(() => useDataSync({
      resourceType: 'messages',
      endpoint: '/api/messages',
      conflictOptions: {
        strategy: 'merge'
      }
    }));
    
    await waitForNextUpdate();
    
    const updates = { title: 'Conflicting Update' };
    
    act(() => {
      result.current.updateItem('1', updates);
    });
    
    await waitForNextUpdate();
    
    // Should detect and resolve conflict
    expect(conflictResolution.detectConflict).toHaveBeenCalled();
    expect(conflictResolution.resolveConflict).toHaveBeenCalled();
  });
});