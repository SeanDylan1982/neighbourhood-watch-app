import {
  createError,
  isRecoverableError,
  getUserFriendlyMessage,
  logError,
  reportError,
  withErrorHandling,
  createRetryFunction,
  isValidError,
  sanitizeError,
  ErrorTypes,
  ErrorCodes
} from '../errorUtils';

// Mock fetch for error reporting
global.fetch = jest.fn();

// Mock console methods
const originalConsole = { ...console };

describe('errorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  describe('createError', () => {
    it('creates error with basic properties', () => {
      const error = createError('TestError', 'Test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TestError');
      expect(error.message).toBe('Test message');
    });

    it('creates error with additional options', () => {
      const error = createError('NetworkError', 'Connection failed', {
        code: 'NETWORK_ERROR',
        status: 500,
        context: { url: '/api/test' }
      });

      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.status).toBe(500);
      expect(error.context).toEqual({ url: '/api/test' });
    });
  });

  describe('isRecoverableError', () => {
    it('identifies network errors as recoverable', () => {
      const networkError = createError('NetworkError', 'Network failed');
      expect(isRecoverableError(networkError)).toBe(true);
    });

    it('identifies timeout errors as recoverable', () => {
      const timeoutError = createError('TimeoutError', 'Request timeout');
      expect(isRecoverableError(timeoutError)).toBe(true);
    });

    it('identifies server errors as recoverable', () => {
      const serverError = createError('ServerError', 'Internal error', { status: 500 });
      expect(isRecoverableError(serverError)).toBe(true);
    });

    it('identifies rate limiting as recoverable', () => {
      const rateLimitError = createError('RateLimitError', 'Too many requests', { status: 429 });
      expect(isRecoverableError(rateLimitError)).toBe(true);
    });

    it('identifies client errors as non-recoverable', () => {
      const clientError = createError('ValidationError', 'Invalid input', { status: 400 });
      expect(isRecoverableError(clientError)).toBe(false);
    });

    it('identifies authentication errors as non-recoverable', () => {
      const authError = createError('AuthError', 'Unauthorized', { status: 401 });
      expect(isRecoverableError(authError)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns friendly message for network errors', () => {
      const networkError = createError('NetworkError', 'Connection failed');
      const message = getUserFriendlyMessage(networkError);
      
      expect(message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
    });

    it('returns friendly message for timeout errors', () => {
      const timeoutError = createError('TimeoutError', 'Request timeout');
      const message = getUserFriendlyMessage(timeoutError);
      
      expect(message).toBe('The request took too long to complete. Please try again.');
    });

    it('returns friendly message for authentication errors', () => {
      const authError = createError('AuthError', 'Unauthorized', { status: 401 });
      const message = getUserFriendlyMessage(authError);
      
      expect(message).toBe('Your session has expired. Please log in again.');
    });

    it('returns context-specific messages', () => {
      const uploadError = createError('UploadError', 'File too large');
      const message = getUserFriendlyMessage(uploadError, { operation: 'upload' });
      
      expect(message).toBe('Failed to upload file. Please try again.');
    });

    it('returns resource-specific not found message', () => {
      const notFoundError = createError('NotFoundError', 'Not found', { status: 404 });
      const message = getUserFriendlyMessage(notFoundError, { resource: 'User' });
      
      expect(message).toBe('User not found.');
    });

    it('returns default message for unknown errors', () => {
      const unknownError = createError('UnknownError', 'Something went wrong');
      const message = getUserFriendlyMessage(unknownError);
      
      expect(message).toBe('Something went wrong');
    });
  });

  describe('logError', () => {
    it('logs error in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createError('TestError', 'Test message');
      const context = { component: 'chat' };

      logError(error, context);

      expect(console.group).toHaveBeenCalledWith('🚨 Error: TestError');
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test message');
      expect(console.error).toHaveBeenCalledWith('Context:', context);
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('logs error in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createError('TestError', 'Test message');
      const context = { component: 'chat' };

      logError(error, context);

      expect(console.error).toHaveBeenCalledWith('Error occurred:', expect.objectContaining({
        name: 'TestError',
        message: 'Test message',
        context
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('reportError', () => {
    it('sends error to server in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      fetch.mockResolvedValueOnce({ ok: true });

      const error = createError('TestError', 'Test message');
      const context = { userId: 'user123' };

      await reportError(error, context);

      expect(fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('TestError')
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('does not send error in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createError('TestError', 'Test message');
      await reportError(error);

      expect(fetch).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles fetch errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      fetch.mockRejectedValueOnce(new Error('Network error'));

      const error = createError('TestError', 'Test message');
      
      // Should not throw
      await expect(reportError(error)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('Failed to report error:', expect.any(Error));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withErrorHandling', () => {
    it('executes function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(mockFn);

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('retries on recoverable errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(createError('NetworkError', 'Network failed'))
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();
      const wrappedFn = withErrorHandling(mockFn, {
        maxRetries: 2,
        retryDelay: 10,
        onRetry
      });

      const result = await wrappedFn();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('does not retry non-recoverable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(
        createError('ValidationError', 'Invalid input', { status: 400 })
      );

      const onError = jest.fn();
      const wrappedFn = withErrorHandling(mockFn, { onError });

      await expect(wrappedFn()).rejects.toThrow('Invalid input');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalled();
    });

    it('stops retrying after max attempts', async () => {
      const error = createError('NetworkError', 'Network failed');
      const mockFn = jest.fn().mockRejectedValue(error);

      const onError = jest.fn();
      const wrappedFn = withErrorHandling(mockFn, {
        maxRetries: 2,
        retryDelay: 10,
        onError
      });

      await expect(wrappedFn()).rejects.toThrow('Network failed');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(onError).toHaveBeenCalledWith(error, 2);
    });
  });

  describe('createRetryFunction', () => {
    it('creates function with retry logic', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(createError('NetworkError', 'Failed'))
        .mockResolvedValueOnce('success');

      const retryFn = createRetryFunction(mockOperation, {
        maxRetries: 2,
        initialDelay: 10
      });

      const result = await retryFn('arg1');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenCalledWith('arg1');
    });

    it('applies exponential backoff', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(createError('NetworkError', 'Failed 1'))
        .mockRejectedValueOnce(createError('NetworkError', 'Failed 2'))
        .mockResolvedValueOnce('success');

      const retryFn = createRetryFunction(mockOperation, {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2,
        jitter: false
      });

      const startTime = Date.now();
      const result = await retryFn();
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      // Should have waited at least 100ms + 200ms = 300ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });
  });

  describe('isValidError', () => {
    it('validates Error instances', () => {
      const error = new Error('Test error');
      expect(isValidError(error)).toBe(true);
    });

    it('validates error-like objects', () => {
      const errorLike = { message: 'Test error', name: 'TestError' };
      expect(isValidError(errorLike)).toBe(true);
    });

    it('rejects invalid objects', () => {
      expect(isValidError(null)).toBe(false);
      expect(isValidError(undefined)).toBe(false);
      expect(isValidError('string')).toBe(false);
      expect(isValidError({})).toBe(false);
    });
  });

  describe('sanitizeError', () => {
    it('sanitizes valid error', () => {
      const error = createError('TestError', 'Test message', {
        code: 'TEST_CODE',
        status: 400
      });
      error.stack = 'Error stack trace';

      const sanitized = sanitizeError(error);

      expect(sanitized).toEqual({
        name: 'TestError',
        message: 'Test message',
        stack: 'Error stack trace',
        code: 'TEST_CODE',
        status: 400,
        timestamp: expect.any(String)
      });
    });

    it('sanitizes invalid error', () => {
      const sanitized = sanitizeError(null);

      expect(sanitized).toEqual({
        name: 'UnknownError',
        message: 'An unknown error occurred',
        timestamp: expect.any(String)
      });
    });

    it('handles error without name or message', () => {
      const error = {};
      const sanitized = sanitizeError(error);

      expect(sanitized).toEqual({
        name: 'UnknownError',
        message: 'An unknown error occurred',
        timestamp: expect.any(String)
      });
    });
  });

  describe('ErrorTypes and ErrorCodes', () => {
    it('exports error types', () => {
      expect(ErrorTypes.NETWORK_ERROR).toBe('NetworkError');
      expect(ErrorTypes.TIMEOUT_ERROR).toBe('TimeoutError');
      expect(ErrorTypes.VALIDATION_ERROR).toBe('ValidationError');
    });

    it('exports error codes', () => {
      expect(ErrorCodes.NETWORK_UNAVAILABLE).toBe('NETWORK_UNAVAILABLE');
      expect(ErrorCodes.REQUEST_TIMEOUT).toBe('REQUEST_TIMEOUT');
      expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
    });
  });
});