/**
 * ServiceWorkerManager Tests
 * Comprehensive test suite for service worker registration and error handling
 */

import serviceWorkerManager, { ErrorTypes } from '../ServiceWorkerManager';

// Mock global objects
const mockServiceWorker = {
  register: jest.fn(),
  addEventListener: jest.fn(),
  controller: null
};

const mockRegistration = {
  scope: '/',
  active: { state: 'activated' },
  installing: null,
  waiting: null,
  addEventListener: jest.fn(),
  unregister: jest.fn()
};

// Mock fetch
global.fetch = jest.fn();

// Mock navigator
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

Object.defineProperty(global.window, 'PushManager', {
  value: function() {},
  writable: true
});

describe('ServiceWorkerManager', () => {
  let manager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Use the singleton instance
    manager = serviceWorkerManager;
    
    // Reset global mocks
    mockServiceWorker.register.mockReset();
    global.fetch.mockReset();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Support Detection', () => {
    test('should detect service worker support', () => {
      expect(manager.checkSupport()).toBe(true);
      expect(manager.isSupported).toBe(true);
    });

    test('should detect lack of service worker support', () => {
      delete global.navigator.serviceWorker;
      // Reset the manager's support detection
      manager.isSupported = manager.checkSupport();
      expect(manager.checkSupport()).toBe(false);
      expect(manager.isSupported).toBe(false);
    });

    test('should detect lack of PushManager support', () => {
      delete global.window.PushManager;
      // Reset the manager's support detection
      manager.isSupported = manager.checkSupport();
      expect(manager.checkSupport()).toBe(false);
    });
  });

  describe('Service Worker Registration', () => {
    test('should register service worker successfully', async () => {
      // Mock successful validation
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/javascript')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('// service worker code')
        });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(true);
      expect(result.registration).toBe(mockRegistration);
      expect(result.scope).toBe('/');
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    });

    test('should handle unsupported browsers', async () => {
      manager.isSupported = false;

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe(ErrorTypes.UNSUPPORTED);
      expect(mockServiceWorker.register).not.toHaveBeenCalled();
    });

    test('should handle MIME type errors', async () => {
      // Mock MIME type validation failure
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('text/html')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('<!DOCTYPE html><html></html>')
        });

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe(ErrorTypes.MIME_TYPE_ERROR);
      expect(mockServiceWorker.register).not.toHaveBeenCalled();
    });

    test('should handle network errors during validation', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe(ErrorTypes.NETWORK_ERROR);
    });

    test('should handle registration failures', async () => {
      // Mock successful validation
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/javascript')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('// service worker code')
        });

      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe(ErrorTypes.REGISTRATION_FAILED);
    });
  });

  describe('MIME Type Validation', () => {
    test('should validate JavaScript MIME types', () => {
      const validTypes = [
        'application/javascript',
        'application/x-javascript',
        'text/javascript',
        'text/x-javascript'
      ];

      validTypes.forEach(type => {
        expect(manager.isValidJavaScriptMimeType(type)).toBe(true);
      });
    });

    test('should reject invalid MIME types', () => {
      const invalidTypes = [
        'text/html',
        'text/plain',
        'application/json',
        'image/png'
      ];

      invalidTypes.forEach(type => {
        expect(manager.isValidJavaScriptMimeType(type)).toBe(false);
      });
    });

    test('should handle case-insensitive MIME types', () => {
      expect(manager.isValidJavaScriptMimeType('APPLICATION/JAVASCRIPT')).toBe(true);
      expect(manager.isValidJavaScriptMimeType('Text/JavaScript')).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    test('should retry on network errors', async () => {
      // Mock network error then success
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/javascript')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('// service worker code')
        });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      // Mock delay to speed up test
      jest.spyOn(manager, 'delay').mockResolvedValue();

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(true);
      expect(manager.retryAttempts).toBe(1);
    });

    test('should not retry on MIME type errors', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('text/html')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('<!DOCTYPE html>')
        });

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe(ErrorTypes.MIME_TYPE_ERROR);
      expect(manager.retryAttempts).toBe(0);
    });

    test('should stop retrying after max attempts', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      jest.spyOn(manager, 'delay').mockResolvedValue();

      const result = await manager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(manager.retryAttempts).toBe(0); // Reset after max attempts
    });
  });

  describe('Service Worker Lifecycle', () => {
    test('should set up event listeners after registration', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/javascript')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('// service worker code')
        });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.register('/sw.js');

      expect(mockRegistration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    });

    test('should handle service worker updates', async () => {
      const mockNewWorker = {
        state: 'installing',
        addEventListener: jest.fn()
      };

      mockRegistration.installing = mockNewWorker;

      // Mock window.dispatchEvent
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation();

      manager.registration = mockRegistration;
      manager.setupEventListeners();

      // Simulate updatefound event
      const updateFoundCallback = mockRegistration.addEventListener.mock.calls
        .find(call => call[0] === 'updatefound')[1];
      
      updateFoundCallback();

      // Simulate state change to installed
      mockNewWorker.state = 'installed';
      mockServiceWorker.controller = {}; // Simulate existing controller

      const stateChangeCallback = mockNewWorker.addEventListener.mock.calls
        .find(call => call[0] === 'statechange')[1];
      
      stateChangeCallback();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sw-update-available'
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Service Worker Unregistration', () => {
    test('should unregister service worker successfully', async () => {
      manager.registration = mockRegistration;
      mockRegistration.unregister.mockResolvedValue(true);

      const result = await manager.unregister();

      expect(result.success).toBe(true);
      expect(manager.registration).toBe(null);
      expect(mockRegistration.unregister).toHaveBeenCalled();
    });

    test('should handle unregistration failures', async () => {
      manager.registration = mockRegistration;
      mockRegistration.unregister.mockRejectedValue(new Error('Unregister failed'));

      const result = await manager.unregister();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unregister failed');
    });

    test('should handle unregistration when no service worker is registered', async () => {
      manager.registration = null;

      const result = await manager.unregister();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No service worker to unregister');
    });
  });

  describe('Status and Utility Methods', () => {
    test('should return correct status', () => {
      manager.registration = mockRegistration;

      const status = manager.getStatus();

      expect(status.isSupported).toBe(true);
      expect(status.isRegistered).toBe(true);
      expect(status.registration).toBe(mockRegistration);
      expect(status.scope).toBe('/');
      expect(status.state).toBe('activated');
    });

    test('should skip waiting when service worker is waiting', async () => {
      const mockWaitingWorker = {
        postMessage: jest.fn()
      };

      manager.registration = {
        ...mockRegistration,
        waiting: mockWaitingWorker
      };

      const result = await manager.skipWaiting();

      expect(result).toBe(true);
      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    test('should return false when no waiting service worker', async () => {
      manager.registration = mockRegistration;

      const result = await manager.skipWaiting();

      expect(result).toBe(false);
    });

    test('should provide user-friendly error messages', () => {
      const messages = [
        ErrorTypes.MIME_TYPE_ERROR,
        ErrorTypes.REGISTRATION_FAILED,
        ErrorTypes.UNSUPPORTED,
        ErrorTypes.NETWORK_ERROR
      ];

      messages.forEach(errorType => {
        const message = manager.getErrorMessage(errorType);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing content-type header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      });

      const validation = await manager.validateServiceWorkerFile('/sw.js');

      expect(validation.isValid).toBe(true);
    });

    test('should handle 404 responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const validation = await manager.validateServiceWorkerFile('/sw.js');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe(ErrorTypes.NETWORK_ERROR);
    });

    test('should handle empty service worker files', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/javascript')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('')
        });

      const validation = await manager.validateServiceWorkerFile('/sw.js');

      expect(validation.isValid).toBe(true);
    });
  });
});