import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatErrorHandler from '../ChatErrorHandler';
import { useToast } from '../../../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: jest.fn()
}));

jest.mock('../../../../hooks/useErrorRecovery', () => {
  return jest.fn(() => ({
    errors: [],
    isRecovering: false,
    addError: jest.fn(),
    retryOperation: jest.fn(),
    dismissError: jest.fn(),
    clearAllErrors: jest.fn(),
    hasRecoverableErrors: jest.fn(() => false)
  }));
});

jest.mock('../../../../utils/errorUtils', () => ({
  withErrorHandling: jest.fn((fn) => fn),
  logError: jest.fn(),
  reportError: jest.fn()
}));

// Mock fetch for error reporting
global.fetch = jest.fn();

// Component that can throw errors for testing
const TestComponent = ({ shouldThrow = false, errorMessage = 'Test error', errorHandling }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  
  return (
    <div>
      <span>Test Component</span>
      {errorHandling && (
        <div data-testid="error-handling-context">
          <span>Has errors: {errorHandling.hasErrors.toString()}</span>
          <span>Is recovering: {errorHandling.isRecovering.toString()}</span>
        </div>
      )}
    </div>
  );
};

describe('ChatErrorHandler', () => {
  const mockShowToast = jest.fn();
  const mockUseErrorRecovery = require('../../../../hooks/useErrorRecovery');

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ showToast: mockShowToast });
    
    // Reset the mock to default values
    mockUseErrorRecovery.mockReturnValue({
      errors: [],
      isRecovering: false,
      addError: jest.fn(),
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => false)
    });

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  it('renders children without errors', () => {
    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent />
      </ChatErrorHandler>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('passes error handling context to children', () => {
    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent />
      </ChatErrorHandler>
    );

    const context = screen.getByTestId('error-handling-context');
    expect(context).toHaveTextContent('Has errors: false');
    expect(context).toHaveTextContent('Is recovering: false');
  });

  it('catches errors with error boundary', () => {
    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={true} errorMessage="Boundary test error" />
      </ChatErrorHandler>
    );

    expect(screen.getByText('Chat Error')).toBeInTheDocument();
    expect(screen.getByText(/The chat component encountered an error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
  });

  it('shows technical details in error boundary fallback', () => {
    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={true} errorMessage="Technical error" />
      </ChatErrorHandler>
    );

    // Click to expand technical details
    fireEvent.click(screen.getByText('Technical Details'));

    expect(screen.getByText('Error: Error')).toBeInTheDocument();
    expect(screen.getByText('Message: Technical error')).toBeInTheDocument();
    expect(screen.getByText('Chat ID: chat456')).toBeInTheDocument();
    expect(screen.getByText('User ID: user123')).toBeInTheDocument();
  });

  it('handles retry in error boundary', () => {
    const { rerender } = render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={true} />
      </ChatErrorHandler>
    );

    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: 'Retry Chat' }));

    // Rerender without error
    rerender(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={false} />
      </ChatErrorHandler>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('shows error recovery panel when showErrorPanel is true and has errors', () => {
    const mockErrors = [
      {
        id: 'error-1',
        name: 'TestError',
        message: 'Test error message',
        severity: 'error',
        category: 'test',
        timestamp: Date.now(),
        canRetry: true,
        retryCount: 0
      }
    ];

    mockUseErrorRecovery.mockReturnValue({
      errors: mockErrors,
      isRecovering: false,
      addError: jest.fn(),
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => true)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456" showErrorPanel={true}>
        <TestComponent />
      </ChatErrorHandler>
    );

    expect(screen.getByText('Error Recovery (1)')).toBeInTheDocument();
  });

  it('shows floating error indicator when not showing panel and has errors', () => {
    const mockErrors = [
      {
        id: 'error-1',
        name: 'TestError',
        message: 'Test error message',
        severity: 'error',
        category: 'test',
        timestamp: Date.now(),
        canRetry: true,
        retryCount: 0
      },
      {
        id: 'error-2',
        name: 'TestError2',
        message: 'Test error message 2',
        severity: 'warning',
        category: 'test',
        timestamp: Date.now(),
        canRetry: false,
        retryCount: 1
      }
    ];

    mockUseErrorRecovery.mockReturnValue({
      errors: mockErrors,
      isRecovering: false,
      addError: jest.fn(),
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => true)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456" showErrorPanel={false}>
        <TestComponent />
      </ChatErrorHandler>
    );

    const indicator = screen.getByTitle('2 errors occurred');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles unhandled promise rejections', async () => {
    const mockAddError = jest.fn();
    
    mockUseErrorRecovery.mockReturnValue({
      errors: [],
      isRecovering: false,
      addError: mockAddError,
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => false)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent />
      </ChatErrorHandler>
    );

    // Simulate unhandled promise rejection
    const rejectionEvent = new Event('unhandledrejection');
    rejectionEvent.reason = new Error('Unhandled promise rejection');
    rejectionEvent.preventDefault = jest.fn();

    act(() => {
      window.dispatchEvent(rejectionEvent);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'chat',
        type: 'unhandled_rejection',
        userId: 'user123',
        chatId: 'chat456'
      })
    );
    expect(rejectionEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    const mockAddError = jest.fn();

    mockUseErrorRecovery.mockReturnValue({
      errors: [],
      isRecovering: false,
      addError: mockAddError,
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => false)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456" onError={onError}>
        <TestComponent shouldThrow={true} />
      </ChatErrorHandler>
    );

    // onError should be called through the error recovery hook
    expect(onError).toHaveBeenCalled();
  });

  it('calls onRecovery callback when recovery succeeds', async () => {
    const onRecovery = jest.fn();
    const mockRetryOperation = jest.fn().mockResolvedValue('success');

    const mockErrors = [
      {
        id: 'error-1',
        name: 'TestError',
        message: 'Test error message',
        severity: 'error',
        category: 'test',
        timestamp: Date.now(),
        canRetry: true,
        retryCount: 0,
        context: { operation: 'test' }
      }
    ];

    mockUseErrorRecovery.mockReturnValue({
      errors: mockErrors,
      isRecovering: false,
      addError: jest.fn(),
      retryOperation: mockRetryOperation,
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => true)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456" onRecovery={onRecovery} showErrorPanel={true}>
        <TestComponent />
      </ChatErrorHandler>
    );

    // Click retry button in error panel
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockRetryOperation).toHaveBeenCalled();
    });
  });

  it('creates error-wrapped functions with proper context', () => {
    const mockAddError = jest.fn();
    const { withErrorHandling } = require('../../../../utils/errorUtils');

    mockUseErrorRecovery.mockReturnValue({
      errors: [],
      isRecovering: false,
      addError: mockAddError,
      retryOperation: jest.fn(),
      dismissError: jest.fn(),
      clearAllErrors: jest.fn(),
      hasRecoverableErrors: jest.fn(() => false)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent />
      </ChatErrorHandler>
    );

    // The component should have called withErrorHandling during render
    expect(withErrorHandling).toHaveBeenCalled();
  });

  it('handles window reload in error boundary', () => {
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={true} />
      </ChatErrorHandler>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reload Page' }));
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('disables retry button after max attempts', () => {
    render(
      <ChatErrorHandler userId="user123" chatId="chat456">
        <TestComponent shouldThrow={true} />
      </ChatErrorHandler>
    );

    const retryButton = screen.getByRole('button', { name: 'Retry Chat' });

    // Click retry 3 times
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    expect(screen.getByRole('button', { name: 'Max retries reached' })).toBeDisabled();
    expect(screen.getByText('Retry attempts: 3/3')).toBeInTheDocument();
  });

  it('handles error panel interactions', () => {
    const mockDismissError = jest.fn();
    const mockClearAllErrors = jest.fn();

    const mockErrors = [
      {
        id: 'error-1',
        name: 'TestError',
        message: 'Test error message',
        severity: 'error',
        category: 'test',
        timestamp: Date.now(),
        canRetry: true,
        retryCount: 0
      }
    ];

    mockUseErrorRecovery.mockReturnValue({
      errors: mockErrors,
      isRecovering: false,
      addError: jest.fn(),
      retryOperation: jest.fn(),
      dismissError: mockDismissError,
      clearAllErrors: mockClearAllErrors,
      hasRecoverableErrors: jest.fn(() => true)
    });

    render(
      <ChatErrorHandler userId="user123" chatId="chat456" showErrorPanel={true}>
        <TestComponent />
      </ChatErrorHandler>
    );

    // Test clear all button
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(mockClearAllErrors).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChatErrorHandler userId="user123" chatId="chat456" className="custom-error-handler">
        <TestComponent />
      </ChatErrorHandler>
    );

    expect(container.firstChild).toHaveClass('chat-error-handler', 'custom-error-handler');
  });

  it('handles missing userId and chatId gracefully', () => {
    render(
      <ChatErrorHandler>
        <TestComponent shouldThrow={true} />
      </ChatErrorHandler>
    );

    // Should still render error boundary
    expect(screen.getByText('Chat Error')).toBeInTheDocument();
    
    // Technical details should show N/A for missing IDs
    fireEvent.click(screen.getByText('Technical Details'));
    expect(screen.getByText('Chat ID: N/A')).toBeInTheDocument();
    expect(screen.getByText('User ID: N/A')).toBeInTheDocument();
  });
});