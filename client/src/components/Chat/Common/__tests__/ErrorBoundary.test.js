import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// Mock fetch for error reporting
global.fetch = jest.fn();

// Component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Custom fallback component
const CustomFallback = ({ error, onRetry, onReload, retryCount }) => (
  <div>
    <h2>Custom Error UI</h2>
    <p>Error: {error.message}</p>
    <p>Retry count: {retryCount}</p>
    <button onClick={onRetry}>Custom Retry</button>
    <button onClick={onReload}>Custom Reload</button>
  </div>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error message" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} errorMessage="Custom error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Error: Custom error')).toBeInTheDocument();
    expect(screen.getByText('Retry count: 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show the component without error
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('tracks retry count and disables retry after max attempts', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: 'Try Again' });

    // First retry
    fireEvent.click(retryButton);
    expect(screen.getByText('Retry attempts: 1/3')).toBeInTheDocument();

    // Second retry
    fireEvent.click(retryButton);
    expect(screen.getByText('Retry attempts: 2/3')).toBeInTheDocument();

    // Third retry
    fireEvent.click(retryButton);
    expect(screen.getByText('Retry attempts: 3/3')).toBeInTheDocument();

    // Button should be disabled after max retries
    expect(screen.getByRole('button', { name: 'Max retries reached' })).toBeDisabled();
  });

  it('calls window.location.reload when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reload Page' }));
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('shows error details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} errorMessage="Detailed error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    
    // Click to expand details
    fireEvent.click(screen.getByText('Error Details'));
    
    expect(screen.getByText(/Detailed error/)).toBeInTheDocument();
  });

  it('calls onRetry callback when provided', () => {
    const onRetryMock = jest.fn();

    render(
      <ErrorBoundary onRetry={onRetryMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetryMock).toHaveBeenCalled();
  });

  it('logs error to console in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary userId="user123" chatId="chat456">
        <ThrowError shouldThrow={true} errorMessage="Dev error" />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('sends error to server in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <ErrorBoundary userId="user123" chatId="chat456">
        <ThrowError shouldThrow={true} errorMessage="Prod error" />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('Prod error')
      });
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('handles fetch error when reporting fails', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not throw even if error reporting fails
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('includes user and chat context in error data', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <ErrorBoundary userId="user123" chatId="chat456">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"userId":"user123"')
      });
    });

    process.env.NODE_ENV = originalEnv;
  });
});