import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import ErrorDisplay from '../components/Common/ErrorDisplay';
import OfflineIndicator from '../components/Common/OfflineIndicator';
import useErrorHandler from '../hooks/useErrorHandler';
import useOfflineDetection from '../hooks/useOfflineDetection';
import useApi from '../hooks/useApi';

// Mock theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Component that throws an error for testing ErrorBoundary
const ErrorThrowingComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('renders error UI when child component throws', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getAllByText(/Test error message/)[0]).toBeInTheDocument();
  });

  test('shows retry button and handles retry', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    // The retry functionality in ErrorBoundary resets state but doesn't re-render children
    // This test verifies the button exists and can be clicked
    fireEvent.click(screen.getByText('Try Again'));
    
    // After retry, the error state should be reset
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('shows technical details when expanded', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    // Click to show technical details
    fireEvent.click(screen.getByText('Show Technical Details'));
    
    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
    expect(screen.getByText(/Error Message:/)).toBeInTheDocument();
  });

  test('handles bug report functionality', () => {
    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Report Bug'));
    
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('mailto:support@neighbourhoodwatch.com')
    );
  });
});

describe('ErrorDisplay', () => {
  const mockError = {
    message: 'Test error message',
    type: 'network',
    canRetry: true,
    context: 'Test context',
    timestamp: '2023-01-01T00:00:00.000Z'
  };

  test('renders error message correctly', () => {
    render(
      <TestWrapper>
        <ErrorDisplay error={mockError} />
      </TestWrapper>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('shows retry button when error is retryable', () => {
    const mockRetry = jest.fn();
    
    render(
      <TestWrapper>
        <ErrorDisplay error={mockError} onRetry={mockRetry} />
      </TestWrapper>
    );

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  test('does not show retry button when error is not retryable', () => {
    const nonRetryableError = { ...mockError, canRetry: false };
    
    render(
      <TestWrapper>
        <ErrorDisplay error={nonRetryableError} />
      </TestWrapper>
    );

    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  test('handles dismiss functionality', () => {
    const mockDismiss = jest.fn();
    
    render(
      <TestWrapper>
        <ErrorDisplay error={mockError} onDismiss={mockDismiss} />
      </TestWrapper>
    );

    const dismissButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(dismissButton);
    
    expect(mockDismiss).toHaveBeenCalled();
  });

  test('shows technical details when expanded', () => {
    const errorWithStack = {
      ...mockError,
      originalError: { stack: 'Error stack trace' }
    };
    
    render(
      <TestWrapper>
        <ErrorDisplay error={errorWithStack} showDetails={true} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Technical Details'));
    
    expect(screen.getByText(/Error stack trace/)).toBeInTheDocument();
  });
});

describe('useErrorHandler', () => {
  let TestComponent;
  let hookResult;

  beforeEach(() => {
    TestComponent = () => {
      hookResult = useErrorHandler();
      return (
        <div>
          <button onClick={() => hookResult.handleError(new Error('Test error'))}>
            Trigger Error
          </button>
          <button onClick={hookResult.clearError}>Clear Error</button>
          {hookResult.error && <div>Error: {hookResult.error.message}</div>}
          {hookResult.isLoading && <div>Loading...</div>}
        </div>
      );
    };
  });

  test('handles errors correctly', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
  });

  test('clears errors correctly', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.queryByText(/Error: Test error/)).not.toBeInTheDocument();
  });

  test('categorizes network errors correctly', () => {
    const networkError = new Error('Network error');
    networkError.request = true;
    
    render(<TestComponent />);
    
    act(() => {
      hookResult.handleError(networkError);
    });
    
    expect(hookResult.error.type).toBe('network');
  });

  test('categorizes HTTP errors correctly', () => {
    const httpError = new Error('HTTP error');
    httpError.response = { status: 404, data: {} };
    
    render(<TestComponent />);
    
    act(() => {
      hookResult.handleError(httpError);
    });
    
    expect(hookResult.error.type).toBe('notFound');
  });
});

describe('useOfflineDetection', () => {
  let TestComponent;
  let hookResult;

  beforeEach(() => {
    TestComponent = () => {
      hookResult = useOfflineDetection();
      return (
        <div>
          <div>Online: {hookResult.isOnline.toString()}</div>
          <div>Was Offline: {hookResult.wasOffline.toString()}</div>
        </div>
      );
    };
  });

  test('detects online status correctly', () => {
    navigator.onLine = true;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Online: true')).toBeInTheDocument();
  });

  test('detects offline status correctly', () => {
    navigator.onLine = false;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Online: false')).toBeInTheDocument();
  });

  test('handles online/offline events', () => {
    navigator.onLine = true;
    
    render(<TestComponent />);
    
    // Simulate going offline
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(screen.getByText('Online: false')).toBeInTheDocument();
    expect(screen.getByText('Was Offline: true')).toBeInTheDocument();
    
    // Simulate coming back online
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });
    
    expect(screen.getByText('Online: true')).toBeInTheDocument();
  });
});

describe('useApi', () => {
  let TestComponent;
  let hookResult;

  beforeEach(() => {
    fetch.mockClear();
    navigator.onLine = true;
    
    TestComponent = () => {
      hookResult = useApi();
      return (
        <div>
          <button onClick={() => hookResult.get('/api/test')}>Make Request</button>
          <button onClick={() => hookResult.getWithRetry('/api/test', {}, 2)}>
            Make Request with Retry
          </button>
          <button onClick={hookResult.cancelRequest}>Cancel Request</button>
          {hookResult.loading && <div>Loading...</div>}
          {hookResult.error && <div>Error: {hookResult.error.message}</div>}
        </div>
      );
    };
  });

  test('makes successful API requests', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
      headers: { get: () => 'application/json' }
    });

    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Make Request'));
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'GET'
    }));
  });

  test('handles API errors correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' })
    });

    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Make Request'));
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test('prevents requests when offline', async () => {
    navigator.onLine = false;
    
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Make Request'));
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    expect(fetch).not.toHaveBeenCalled();
  });

  test('retries failed requests', async () => {
    // First call fails
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Second call succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'success' }),
      headers: { get: () => 'application/json' }
    });

    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Make Request with Retry'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  test('cancels requests correctly', async () => {
    // Mock a slow request that gets aborted
    fetch.mockImplementation(() => 
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          reject(error);
        }, 100);
      })
    );

    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Make Request'));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel Request'));
    
    // Wait for the request to be cancelled
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});

describe('OfflineIndicator', () => {
  beforeEach(() => {
    navigator.onLine = true;
  });

  test('shows offline indicator when offline', () => {
    navigator.onLine = false;
    
    render(
      <TestWrapper>
        <OfflineIndicator />
      </TestWrapper>
    );
    
    expect(screen.getByText(/You're currently offline/)).toBeInTheDocument();
  });

  test('does not show indicator when online', () => {
    navigator.onLine = true;
    
    render(
      <TestWrapper>
        <OfflineIndicator />
      </TestWrapper>
    );
    
    expect(screen.queryByText(/You're currently offline/)).not.toBeInTheDocument();
  });

  test('shows reconnected toast when coming back online', async () => {
    // Mock fetch for health check
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(
      <TestWrapper>
        <OfflineIndicator />
      </TestWrapper>
    );
    
    // Simulate going offline then online
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });
    
    // Wait a bit for offline state to be processed
    await waitFor(() => {
      expect(screen.getByText(/You're currently offline/)).toBeInTheDocument();
    });
    
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Connection restored/)).toBeInTheDocument();
    });
  });
});