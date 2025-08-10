import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import ErrorDisplay from '../components/Common/ErrorDisplay';
import OfflineIndicator from '../components/Common/OfflineIndicator';
import useErrorHandler from '../hooks/useErrorHandler';
import useOfflineDetection from '../hooks/useOfflineDetection';

// Mock theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.onLine = true;
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('ErrorBoundary catches and displays errors', () => {
    const ThrowError = () => {
      throw new Error('Integration test error');
    };

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  test('ErrorDisplay shows different error types correctly', () => {
    const networkError = {
      message: 'Network connection failed',
      type: 'network',
      canRetry: true
    };

    const { rerender } = render(
      <TestWrapper>
        <ErrorDisplay error={networkError} />
      </TestWrapper>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    // Note: Retry button is not shown because no onRetry prop was passed

    // Test validation error
    const validationError = {
      message: 'Invalid input provided',
      type: 'validation',
      canRetry: false
    };

    rerender(
      <TestWrapper>
        <ErrorDisplay error={validationError} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid Input')).toBeInTheDocument();
    expect(screen.getByText('Invalid input provided')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  test('OfflineIndicator shows when offline', () => {
    navigator.onLine = false;

    render(
      <TestWrapper>
        <OfflineIndicator />
      </TestWrapper>
    );

    expect(screen.getByText(/You're currently offline/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('useErrorHandler hook works correctly', () => {
    let hookResult;
    
    const TestComponent = () => {
      hookResult = useErrorHandler();
      
      const handleNetworkError = () => {
        const error = new Error('Network failed');
        error.request = true;
        hookResult.handleError(error, 'test context');
      };

      const handleServerError = () => {
        const error = new Error('Server error');
        error.response = { status: 500, data: { message: 'Internal server error' } };
        hookResult.handleError(error, 'server context');
      };

      return (
        <div>
          <button onClick={handleNetworkError}>Network Error</button>
          <button onClick={handleServerError}>Server Error</button>
          <button onClick={hookResult.clearError}>Clear Error</button>
          {hookResult.error && (
            <div>
              <div>Error Type: {hookResult.error.type}</div>
              <div>Error Message: {hookResult.error.message}</div>
              <div>Can Retry: {hookResult.error.canRetry.toString()}</div>
            </div>
          )}
        </div>
      );
    };

    render(<TestComponent />);

    // Test network error
    fireEvent.click(screen.getByText('Network Error'));
    expect(screen.getByText('Error Type: network')).toBeInTheDocument();
    expect(screen.getByText('Can Retry: true')).toBeInTheDocument();

    // Clear error
    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.queryByText('Error Type: network')).not.toBeInTheDocument();

    // Test server error
    fireEvent.click(screen.getByText('Server Error'));
    expect(screen.getByText('Error Type: server')).toBeInTheDocument();
    expect(screen.getByText('Error Message: Server error. Please try again later.')).toBeInTheDocument();
    expect(screen.getByText('Can Retry: true')).toBeInTheDocument();
  });

  test('useOfflineDetection hook detects online/offline status', () => {
    let hookResult;
    
    const TestComponent = () => {
      hookResult = useOfflineDetection();
      
      return (
        <div>
          <div>Is Online: {hookResult.isOnline.toString()}</div>
          <div>Was Offline: {hookResult.wasOffline.toString()}</div>
          <div>Is Offline: {hookResult.isOffline.toString()}</div>
        </div>
      );
    };

    render(<TestComponent />);

    // Initially online
    expect(screen.getByText('Is Online: true')).toBeInTheDocument();
    expect(screen.getByText('Is Offline: false')).toBeInTheDocument();
  });

  test('Error components work together', () => {
    const TestApp = () => {
      const { error, handleError, clearError } = useErrorHandler();
      
      const triggerError = () => {
        const networkError = new Error('Connection failed');
        networkError.request = true;
        handleError(networkError, 'test');
      };

      return (
        <ErrorBoundary>
          <div>
            <button onClick={triggerError}>Trigger Error</button>
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={triggerError}
                onDismiss={clearError}
              />
            )}
            <OfflineIndicator />
          </div>
        </ErrorBoundary>
      );
    };

    render(
      <TestWrapper>
        <TestApp />
      </TestWrapper>
    );

    // Trigger an error
    fireEvent.click(screen.getByText('Trigger Error'));
    
    // Error should be displayed
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText(/check your connection/)).toBeInTheDocument();
    
    // Should have retry and dismiss buttons
    expect(screen.getByText('Retry')).toBeInTheDocument();
    
    // Dismiss the error
    const dismissButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(dismissButton);
    
    // Error should be gone
    expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
  });
});