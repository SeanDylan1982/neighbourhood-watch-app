import { renderHook, act, waitFor } from '@testing-library/react';
import useRetry from '../useRetry';

// Mock timers
jest.useFakeTimers();

describe('useRetry', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('executes operation successfully on first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(mockOperation));

    let executePromise;
    act(() => {
      executePromise = result.current.execute('arg1', 'arg2');
    });

    await act(async () => {
      const result = await executePromise;
      expect(result).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2', {
      signal: expect.any(AbortSignal),
      attempt: 0
    });
    expect(result.current.retryCount).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('retries operation on failure', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 3,
      initialDelay: 1000
    }));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    // Fast-forward through retries
    await act(async () => {
      // First failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });

      // Advance timer for first retry
      jest.advanceTimersByTime(1000);

      // Second failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(2);
      });

      // Advance timer for second retry
      jest.advanceTimersByTime(2000); // Exponential backoff

      // Success on third attempt
      const finalResult = await executePromise;
      expect(finalResult).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('stops retrying after max attempts', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
    const onMaxRetriesReached = jest.fn();

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 2,
      initialDelay: 100,
      onMaxRetriesReached
    }));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    await act(async () => {
      // First failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });

      jest.advanceTimersByTime(100);

      // Second failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(2);
      });

      jest.advanceTimersByTime(200);

      // Should throw after max retries
      await expect(executePromise).rejects.toThrow('Always fails');
    });

    expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(onMaxRetriesReached).toHaveBeenCalledWith(
      expect.any(Error),
      2
    );
    expect(result.current.error).toEqual(expect.any(Error));
    expect(result.current.isLoading).toBe(false);
  });

  it('respects retry condition', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Non-retryable'));
    const retryCondition = jest.fn().mockReturnValue(false);

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 3,
      retryCondition
    }));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    await act(async () => {
      await expect(executePromise).rejects.toThrow('Non-retryable');
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(retryCondition).toHaveBeenCalledWith(expect.any(Error), 0);
    expect(result.current.retryCount).toBe(0);
  });

  it('calls callback functions', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Retry error'))
      .mockResolvedValueOnce('success');

    const onRetry = jest.fn();
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 2,
      initialDelay: 100,
      onRetry,
      onSuccess,
      onError
    }));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    await act(async () => {
      // Wait for first failure and retry
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });

      jest.advanceTimersByTime(100);

      // Wait for success
      const result = await executePromise;
      expect(result).toBe('success');
    });

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
    expect(onSuccess).toHaveBeenCalledWith('success', 1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calculates delay with exponential backoff', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First'))
      .mockRejectedValueOnce(new Error('Second'))
      .mockRejectedValueOnce(new Error('Third'));

    const onRetry = jest.fn();

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffFactor: 2,
      onRetry
    }));

    act(() => {
      result.current.execute().catch(() => {});
    });

    await act(async () => {
      // First retry
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });

      // Second retry
      jest.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(result.current.retryCount).toBe(2);
      });

      // Third retry
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(result.current.retryCount).toBe(3);
      });

      jest.advanceTimersByTime(4000);
    });

    // Check that delays increase exponentially (with jitter)
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, expect.any(Number));
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, expect.any(Number));
    expect(onRetry).toHaveBeenNthCalledWith(3, expect.any(Error), 3, expect.any(Number));

    const firstDelay = onRetry.mock.calls[0][2];
    const secondDelay = onRetry.mock.calls[1][2];
    
    // Second delay should be roughly double the first (accounting for jitter)
    expect(secondDelay).toBeGreaterThan(firstDelay);
  });

  it('respects max delay limit', () => {
    const { result } = renderHook(() => useRetry(() => {}, {
      initialDelay: 1000,
      maxDelay: 5000,
      backoffFactor: 10
    }));

    // Calculate delay for high attempt number
    const delay = result.current.calculateDelay(10);
    expect(delay).toBeLessThanOrEqual(6000); // 5000 + 1000 jitter
  });

  it('can be reset', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useRetry(mockOperation, {
      maxRetries: 1,
      initialDelay: 100
    }));

    // Execute and let it fail
    act(() => {
      result.current.execute().catch(() => {});
    });

    await act(async () => {
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    // Reset the state
    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('can be cancelled', async () => {
    const mockOperation = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 5000))
    );

    const { result } = renderHook(() => useRetry(mockOperation));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('handles abort signals', async () => {
    const mockOperation = jest.fn().mockImplementation(
      ({ signal }) => {
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('AbortError'));
          });
        });
      }
    );

    const { result } = renderHook(() => useRetry(mockOperation));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    act(() => {
      result.current.cancel();
    });

    // Should not throw or retry when aborted
    await act(async () => {
      // The promise should resolve without throwing
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('provides correct canRetry and nextRetryIn values', () => {
    const { result } = renderHook(() => useRetry(() => {}, {
      maxRetries: 3,
      initialDelay: 1000
    }));

    expect(result.current.canRetry).toBe(true);
    expect(result.current.nextRetryIn).toBeGreaterThan(0);

    // Simulate reaching max retries
    act(() => {
      result.current.execute().catch(() => {});
    });

    // After max retries
    act(() => {
      for (let i = 0; i < 4; i++) {
        result.current.execute().catch(() => {});
      }
    });

    // Should eventually show canRetry as false
    expect(result.current.canRetry).toBe(false);
  });
});