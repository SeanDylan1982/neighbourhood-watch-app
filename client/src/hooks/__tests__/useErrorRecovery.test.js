import { renderHook, act, waitFor } from '@testing-library/react';
import useErrorRecovery from '../useErrorRecovery';
import { useToast } from '../../contexts/ToastContext';

// Mock the ToastContext
jest.mock('../../contexts/ToastContext', () => ({
  useToast: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock timers
jest.useFakeTimers();

describe('useErrorRecovery', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    useToast.mockReturnValue({ showToast: mockShowToast });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('initializes with empty errors', () => {
    const { result } = renderHook(() => useErrorRecovery());

    expect(result.current.errors).toEqual([]);
    expect(result.current.errorCount).toBe(0);
    expect(result.current.isRecovering).toBe(false);
  });

  it('adds error correctly', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.addError(testError, { component: 'chat' });
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      name: 'Error',
      message: 'Test error',
      context: { component: 'chat' },
      retryCount: 0,
      canRetry: true,
      severity: 'error',
      category: 'component_chat'
    });
    expect(result.current.errorCount).toBe(1);
  });

  it('shows toast notification when adding error', () => {
    const { result } = renderHook(() => useErrorRecovery({ showToasts: true }));
    const testError = new Error('Network error');
    testError.name = 'NetworkError';

    act(() => {
      result.current.addError(testError);
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      'Connection issue detected. Retrying...',
      'error'
    );
  });

  it('does not show toast when showToasts is false', () => {
    const { result } = renderHook(() => useErrorRecovery({ showToasts: false }));
    const testError = new Error('Test error');

    act(() => {
      result.current.addError(testError);
    });

    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('categorizes errors correctly', () => {
    const { result } = renderHook(() => useErrorRecovery());

    // Network error
    const networkError = new Error('Network failed');
    networkError.name = 'NetworkError';
    
    act(() => {
      result.current.addError(networkError);
    });

    expect(result.current.errors[0].category).toBe('network');
    expect(result.current.errors[0].severity).toBe('warning');

    // Server error
    const serverError = new Error('Server error');
    serverError.status = 500;
    
    act(() => {
      result.current.addError(serverError);
    });

    expect(result.current.errors[0].category).toBe('server');
    expect(result.current.errors[0].severity).toBe('error');

    // Client error
    const clientError = new Error('Bad request');
    clientError.status = 400;
    
    act(() => {
      result.current.addError(clientError);
    });

    expect(result.current.errors[0].category).toBe('client');
    expect(result.current.errors[0].severity).toBe('warning');
  });

  it('determines severity correctly', () => {
    const { result } = renderHook(() => useErrorRecovery());

    // Critical error (401)
    const authError = new Error('Unauthorized');
    authError.status = 401;
    
    act(() => {
      result.current.addError(authError);
    });

    expect(result.current.errors[0].severity).toBe('critical');
    expect(result.current.criticalErrorCount).toBe(1);
  });

  it('retries operation successfully', async () => {
    const { result } = renderHook(() => useErrorRecovery({
      retryDelay: 100
    }));

    const mockOperation = jest.fn().mockResolvedValue('success');
    const testError = new Error('Test error');

    // Add an error first
    act(() => {
      result.current.addError(testError);
    });

    const errorId = result.current.errors[0].id;

    let retryPromise;
    act(() => {
      retryPromise = result.current.retryOperation(mockOperation, errorId);
    });

    expect(result.current.isRecovering).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(100);
      const result = await retryPromise;
      expect(result).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.errors).toHaveLength(0); // Error should be removed on success
    expect(mockShowToast).toHaveBeenCalledWith('Operation completed successfully', 'success');
  });

  it('handles retry failure', async () => {
    const { result } = renderHook(() => useErrorRecovery({
      retryDelay: 100,
      maxRetries: 1
    }));

    const mockOperation = jest.fn().mockRejectedValue(new Error('Retry failed'));
    const testError = new Error('Test error');

    // Add an error first
    act(() => {
      result.current.addError(testError);
    });

    const errorId = result.current.errors[0].id;

    let retryPromise;
    act(() => {
      retryPromise = result.current.retryOperation(mockOperation, errorId);
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
      await expect(retryPromise).rejects.toThrow('Retry failed');
    });

    expect(result.current.isRecovering).toBe(false);
    expect(result.current.errors).toHaveLength(2); // Original + retry error
  });

  it('dismisses error', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.addError(testError);
    });

    const errorId = result.current.errors[0].id;

    act(() => {
      result.current.dismissError(errorId);
    });

    expect(result.current.errors).toHaveLength(0);
    expect(result.current.errorCount).toBe(0);
  });

  it('clears all errors', () => {
    const { result } = renderHook(() => useErrorRecovery());

    act(() => {
      result.current.addError(new Error('Error 1'));
      result.current.addError(new Error('Error 2'));
      result.current.addError(new Error('Error 3'));
    });

    expect(result.current.errors).toHaveLength(3);

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.errors).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('chat_errors');
  });

  it('filters errors by category', () => {
    const { result } = renderHook(() => useErrorRecovery());

    const networkError = new Error('Network error');
    networkError.name = 'NetworkError';

    const serverError = new Error('Server error');
    serverError.status = 500;

    act(() => {
      result.current.addError(networkError);
      result.current.addError(serverError);
    });

    const networkErrors = result.current.getErrorsByCategory('network');
    const serverErrors = result.current.getErrorsByCategory('server');

    expect(networkErrors).toHaveLength(1);
    expect(serverErrors).toHaveLength(1);
    expect(networkErrors[0].message).toBe('Network error');
    expect(serverErrors[0].message).toBe('Server error');
  });

  it('filters errors by severity', () => {
    const { result } = renderHook(() => useErrorRecovery());

    const criticalError = new Error('Critical error');
    criticalError.status = 401;

    const warningError = new Error('Warning error');
    warningError.name = 'NetworkError';

    act(() => {
      result.current.addError(criticalError);
      result.current.addError(warningError);
    });

    const criticalErrors = result.current.getErrorsBySeverity('critical');
    const warningErrors = result.current.getErrorsBySeverity('warning');

    expect(criticalErrors).toHaveLength(1);
    expect(warningErrors).toHaveLength(1);
    expect(result.current.criticalErrorCount).toBe(1);
  });

  it('checks for recoverable errors', () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 2 }));

    const recoverableError = new Error('Recoverable');
    const nonRecoverableError = new Error('Non-recoverable');

    act(() => {
      result.current.addError(recoverableError); // retryCount: 0, canRetry: true
    });

    expect(result.current.hasRecoverableErrors()).toBe(true);
    expect(result.current.recoverableErrorCount).toBe(1);

    // Add error that exceeds max retries
    act(() => {
      // Simulate multiple retries
      for (let i = 0; i < 3; i++) {
        result.current.addError(nonRecoverableError);
      }
    });

    // Should still have recoverable errors
    expect(result.current.hasRecoverableErrors()).toBe(true);
  });

  it('persists errors to localStorage', () => {
    const { result } = renderHook(() => useErrorRecovery({ persistErrors: true }));
    const testError = new Error('Persistent error');

    act(() => {
      result.current.addError(testError);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'chat_errors',
      expect.stringContaining('Persistent error')
    );
  });

  it('loads persisted errors on mount', () => {
    const persistedErrors = JSON.stringify([
      {
        id: 'test-error-1',
        name: 'Error',
        message: 'Persisted error',
        timestamp: Date.now() - 1000,
        severity: 'error',
        category: 'unknown',
        canRetry: true,
        retryCount: 0
      }
    ]);

    localStorageMock.getItem.mockReturnValue(persistedErrors);

    const { result } = renderHook(() => useErrorRecovery({ persistErrors: true }));

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Persisted error');
  });

  it('filters out old persisted errors', () => {
    const oldError = {
      id: 'old-error',
      name: 'Error',
      message: 'Old error',
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      severity: 'error',
      category: 'unknown',
      canRetry: true,
      retryCount: 0
    };

    const recentError = {
      id: 'recent-error',
      name: 'Error',
      message: 'Recent error',
      timestamp: Date.now() - 1000, // 1 second ago
      severity: 'error',
      category: 'unknown',
      canRetry: true,
      retryCount: 0
    };

    localStorageMock.getItem.mockReturnValue(
      JSON.stringify([oldError, recentError])
    );

    const { result } = renderHook(() => useErrorRecovery({ persistErrors: true }));

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Recent error');
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    // Should not throw
    const { result } = renderHook(() => useErrorRecovery({ persistErrors: true }));

    expect(result.current.errors).toEqual([]);
  });

  it('calls callback functions', () => {
    const onError = jest.fn();
    const onRecovery = jest.fn();
    const onMaxRetriesReached = jest.fn();

    const { result } = renderHook(() => useErrorRecovery({
      onError,
      onRecovery,
      onMaxRetriesReached
    }));

    const testError = new Error('Test error');

    act(() => {
      result.current.addError(testError);
    });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Test error'
    }));
  });

  it('limits error history to 50 items', () => {
    const { result } = renderHook(() => useErrorRecovery());

    act(() => {
      // Add 55 errors
      for (let i = 0; i < 55; i++) {
        result.current.addError(new Error(`Error ${i}`));
      }
    });

    expect(result.current.errors).toHaveLength(50);
    // Should keep the most recent errors
    expect(result.current.errors[0].message).toBe('Error 54');
    expect(result.current.errors[49].message).toBe('Error 5');
  });
});