/**
 * ProductionErrorHandler Tests
 * Comprehensive test suite for production error handling and reporting
 */

import productionErrorHandler, { ProductionErrorTypes, ErrorSeverity } from '../ProductionErrorHandler';
import { ErrorTypes as ServiceWorkerErrorTypes } from '../ServiceWorkerManager';
import { AudioErrorTypes } from '../AudioManager';
import { ManifestErrorTypes } from '../ManifestValidator';

// Mock process.env
const originalEnv = process.env;

describe('ProductionErrorHandler', () => {
  let handler;
  let mockDispatchEvent;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';

    // Mock window.dispatchEvent
    mockDispatchEvent = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

    // Mock addEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});

    // Use the singleton instance
    handler = productionErrorHandler;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    jest.restoreAllMocks();
  });

  describe('Initialization and Global Error Handlers', () => {
    test('should set up global error handlers', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      // Reset the handler's production detection
      handler.isProduction = process.env.NODE_ENV === 'production';
      
      expect(handler.isProduction).toBe(true);
    });

    test('should detect development environment', () => {
      expect(handler.isProduction).toBe(false);
    });
  });

  describe('Service Worker Error Handling', () => {
    test('should handle service worker MIME type error', () => {
      const context = { swPath: '/sw.js' };
      
      const errorInfo = handler.handleServiceWorkerError(ServiceWorkerErrorTypes.MIME_TYPE_ERROR, context);

      expect(errorInfo.type).toBe(ProductionErrorTypes.SERVICE_WORKER);
      expect(errorInfo.originalError).toBe(ServiceWorkerErrorTypes.MIME_TYPE_ERROR);
      expect(errorInfo.context).toBe(context);
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.userMessage).toContain('offline features');
      expect(errorInfo.timestamp).toBeTruthy();
    });

    test('should handle service worker registration failure', () => {
      const errorInfo = handler.handleServiceWorkerError(ServiceWorkerErrorTypes.REGISTRATION_FAILED);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Offline features are currently unavailable');
    });

    test('should handle unsupported service worker', () => {
      const errorInfo = handler.handleServiceWorkerError(ServiceWorkerErrorTypes.UNSUPPORTED);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('browser doesn\'t support');
    });

    test('should handle service worker network error', () => {
      const errorInfo = handler.handleServiceWorkerError(ServiceWorkerErrorTypes.NETWORK_ERROR);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Network issues');
    });
  });

  describe('Audio Error Handling', () => {
    test('should handle audio encoding error', () => {
      const context = { soundType: 'message' };
      
      const errorInfo = handler.handleAudioError(AudioErrorTypes.ENCODING_ERROR, context);

      expect(errorInfo.type).toBe(ProductionErrorTypes.AUDIO);
      expect(errorInfo.originalError).toBe(AudioErrorTypes.ENCODING_ERROR);
      expect(errorInfo.context).toBe(context);
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.userMessage).toContain('Notification sounds are currently unavailable');
    });

    test('should handle audio load failure', () => {
      const errorInfo = handler.handleAudioError(AudioErrorTypes.LOAD_FAILED);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Notification sounds are currently unavailable');
    });

    test('should handle audio context failure', () => {
      const errorInfo = handler.handleAudioError(AudioErrorTypes.CONTEXT_FAILED);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Audio features are currently unavailable');
    });

    test('should handle unsupported audio', () => {
      const errorInfo = handler.handleAudioError(AudioErrorTypes.UNSUPPORTED);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('browser doesn\'t support audio');
    });

    test('should handle audio network error', () => {
      const errorInfo = handler.handleAudioError(AudioErrorTypes.NETWORK_ERROR);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Network issues');
    });
  });

  describe('Manifest Error Handling', () => {
    test('should handle manifest syntax error', () => {
      const context = { manifestPath: '/manifest.json' };
      
      const errorInfo = handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR, context);

      expect(errorInfo.type).toBe(ProductionErrorTypes.MANIFEST);
      expect(errorInfo.originalError).toBe(ManifestErrorTypes.SYNTAX_ERROR);
      expect(errorInfo.context).toBe(context);
      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.userMessage).toContain('App installation features');
    });

    test('should handle missing manifest fields', () => {
      const errorInfo = handler.handleManifestError(ManifestErrorTypes.MISSING_FIELDS);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('Some app features');
    });

    test('should handle invalid manifest icons', () => {
      const errorInfo = handler.handleManifestError(ManifestErrorTypes.INVALID_ICONS);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('App icons may not display');
    });

    test('should handle manifest network error', () => {
      const errorInfo = handler.handleManifestError(ManifestErrorTypes.NETWORK_ERROR);

      expect(errorInfo.severity).toBe(ErrorSeverity.LOW);
      expect(errorInfo.userMessage).toContain('App installation features are currently unavailable');
    });
  });

  describe('Generic Error Handling', () => {
    test('should handle chunk load errors', () => {
      const chunkError = new Error('Loading chunk 5 failed');
      chunkError.name = 'ChunkLoadError';
      
      const errorInfo = handler.handleError(ProductionErrorTypes.UNKNOWN, chunkError);

      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH);
      expect(errorInfo.userMessage).toContain('refresh the page');
    });

    test('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      
      const errorInfo = handler.handleError(ProductionErrorTypes.NETWORK, networkError);

      expect(errorInfo.type).toBe(ProductionErrorTypes.NETWORK);
      expect(errorInfo.userMessage).toContain('Network connectivity issues');
    });

    test('should handle unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      
      const errorInfo = handler.handleError(ProductionErrorTypes.UNKNOWN, unknownError);

      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorInfo.userMessage).toContain('unexpected error occurred');
    });
  });

  describe('Error Logging and Storage', () => {
    test('should log errors to collection', () => {
      const error = new Error('Test error');
      
      handler.handleError(ProductionErrorTypes.UNKNOWN, error);

      expect(handler.errors.size).toBe(1);
      const errorInfo = Array.from(handler.errors.values())[0];
      expect(errorInfo.originalError).toBe(error);
    });

    test('should prevent memory leaks by limiting error collection', () => {
      // Set low limit for testing
      handler.maxErrors = 3;

      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        handler.handleError(ProductionErrorTypes.UNKNOWN, new Error(`Error ${i}`));
      }

      expect(handler.errors.size).toBe(3);
    });

    test('should use appropriate log levels', () => {
      const lowError = { severity: ErrorSeverity.LOW };
      const mediumError = { severity: ErrorSeverity.MEDIUM };
      const highError = { severity: ErrorSeverity.HIGH };
      const criticalError = { severity: ErrorSeverity.CRITICAL };

      expect(handler.getLogLevel(lowError.severity)).toBe('warn');
      expect(handler.getLogLevel(mediumError.severity)).toBe('warn');
      expect(handler.getLogLevel(highError.severity)).toBe('error');
      expect(handler.getLogLevel(criticalError.severity)).toBe('error');
    });

    test('should generate unique error IDs', () => {
      const id1 = handler.generateErrorId();
      const id2 = handler.generateErrorId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^error_\d+_[a-z0-9]+$/);
    });
  });

  describe('User Notifications', () => {
    test('should show notifications for medium+ severity errors', () => {
      const mediumError = handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'production-error',
          detail: expect.objectContaining({
            type: ProductionErrorTypes.MANIFEST,
            severity: ErrorSeverity.MEDIUM,
            message: mediumError.userMessage
          })
        })
      );
    });

    test('should not show notifications for low severity errors', () => {
      handler.handleAudioError(AudioErrorTypes.UNSUPPORTED);
      
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });

    test('should prevent duplicate notifications', () => {
      // Trigger same error type multiple times
      handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR);
      handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR);

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('should clear notification keys after timeout', (done) => {
      jest.useFakeTimers();
      
      handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR);
      expect(handler.userNotifications.size).toBe(1);

      // Fast-forward time
      jest.advanceTimersByTime(300000); // 5 minutes

      setTimeout(() => {
        expect(handler.userNotifications.size).toBe(0);
        jest.useRealTimers();
        done();
      }, 0);
    });
  });

  describe('Error Listeners', () => {
    test('should add and remove error listeners', () => {
      const listener = jest.fn();
      
      const removeListener = handler.addErrorListener(listener);
      expect(handler.errorListeners.has(listener)).toBe(true);

      handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Test'));
      expect(listener).toHaveBeenCalled();

      removeListener();
      expect(handler.errorListeners.has(listener)).toBe(false);
    });

    test('should handle listener errors gracefully', () => {
      const faultyListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      handler.addErrorListener(faultyListener);
      
      // Should not throw
      expect(() => {
        handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Test'));
      }).not.toThrow();

      expect(faultyListener).toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    test('should report errors in production', () => {
      process.env.NODE_ENV = 'production';
      const prodHandler = new ProductionErrorHandler();
      
      jest.spyOn(prodHandler, 'reportError').mockImplementation(() => {});
      
      prodHandler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Test'));
      
      expect(prodHandler.reportError).toHaveBeenCalled();
    });

    test('should not report errors in development', () => {
      jest.spyOn(handler, 'reportError').mockImplementation(() => {});
      
      handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Test'));
      
      expect(handler.reportError).not.toHaveBeenCalled();
    });

    test('should include relevant information in error reports', () => {
      process.env.NODE_ENV = 'production';
      const prodHandler = new ProductionErrorHandler();
      
      const reportSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const errorInfo = {
        type: ProductionErrorTypes.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date().toISOString()
      };
      
      prodHandler.reportError(errorInfo);
      
      expect(reportSpy).toHaveBeenCalledWith(
        '📊 Reporting error to analytics:',
        expect.objectContaining({
          type: errorInfo.type,
          severity: errorInfo.severity,
          timestamp: errorInfo.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      );
    });
  });

  describe('Error Summary and Analysis', () => {
    test('should provide comprehensive error summary', () => {
      // Add various errors
      handler.handleServiceWorkerError(ServiceWorkerErrorTypes.MIME_TYPE_ERROR);
      handler.handleAudioError(AudioErrorTypes.ENCODING_ERROR);
      handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR);
      handler.handleError(ProductionErrorTypes.NETWORK, new Error('Network'));

      const summary = handler.getErrorSummary();

      expect(summary.totalErrors).toBe(4);
      expect(summary.errorsByType[ProductionErrorTypes.SERVICE_WORKER]).toBe(1);
      expect(summary.errorsByType[ProductionErrorTypes.AUDIO]).toBe(1);
      expect(summary.errorsByType[ProductionErrorTypes.MANIFEST]).toBe(1);
      expect(summary.errorsByType[ProductionErrorTypes.NETWORK]).toBe(1);
      expect(summary.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(3);
      expect(summary.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(3);
      expect(summary.recentErrors.length).toBe(4);
    });

    test('should limit recent errors to 10', () => {
      // Add more than 10 errors
      for (let i = 0; i < 15; i++) {
        handler.handleError(ProductionErrorTypes.UNKNOWN, new Error(`Error ${i}`));
      }

      const summary = handler.getErrorSummary();

      expect(summary.recentErrors.length).toBe(10);
    });

    test('should sort recent errors by timestamp', () => {
      // Add errors with slight delays to ensure different timestamps
      handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('First'));
      
      // Mock different timestamp
      jest.spyOn(Date.prototype, 'toISOString')
        .mockReturnValueOnce('2023-01-01T00:00:01.000Z')
        .mockReturnValueOnce('2023-01-01T00:00:02.000Z');
      
      handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Second'));

      const summary = handler.getErrorSummary();

      // Should be sorted with most recent first
      expect(summary.recentErrors[0].timestamp).toBe('2023-01-01T00:00:02.000Z');
      expect(summary.recentErrors[1].timestamp).toBe('2023-01-01T00:00:01.000Z');
    });

    test('should clear all errors and notifications', () => {
      handler.handleError(ProductionErrorTypes.UNKNOWN, new Error('Test'));
      handler.handleManifestError(ManifestErrorTypes.SYNTAX_ERROR); // Creates notification

      expect(handler.errors.size).toBeGreaterThan(0);
      expect(handler.userNotifications.size).toBeGreaterThan(0);

      handler.clearErrors();

      expect(handler.errors.size).toBe(0);
      expect(handler.userNotifications.size).toBe(0);
    });
  });

  describe('Global Error Handler Integration', () => {
    test('should handle unhandled promise rejections', () => {
      const mockEvent = {
        reason: new Error('Unhandled promise rejection'),
        promise: Promise.reject()
      };

      // Simulate the event handler
      const unhandledRejectionHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'unhandledrejection')[1];

      jest.spyOn(handler, 'handleError').mockImplementation(() => ({}));

      unhandledRejectionHandler(mockEvent);

      expect(handler.handleError).toHaveBeenCalledWith(
        ProductionErrorTypes.UNKNOWN,
        mockEvent.reason,
        expect.objectContaining({
          type: 'unhandledrejection',
          promise: mockEvent.promise
        })
      );
    });

    test('should handle JavaScript errors', () => {
      const mockEvent = {
        error: new Error('JavaScript error'),
        filename: 'app.js',
        lineno: 42,
        colno: 10
      };

      // Simulate the event handler
      const errorHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'error' && call[2] !== true)[1];

      jest.spyOn(handler, 'handleError').mockImplementation(() => ({}));

      errorHandler(mockEvent);

      expect(handler.handleError).toHaveBeenCalledWith(
        ProductionErrorTypes.UNKNOWN,
        mockEvent.error,
        expect.objectContaining({
          type: 'javascript',
          filename: mockEvent.filename,
          lineno: mockEvent.lineno,
          colno: mockEvent.colno
        })
      );
    });

    test('should handle resource loading errors', () => {
      const mockTarget = {
        tagName: 'IMG',
        src: '/missing-image.jpg'
      };

      const mockEvent = {
        target: mockTarget
      };

      // Simulate the event handler (capture phase)
      const resourceErrorHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'error' && call[2] === true)[1];

      jest.spyOn(handler, 'handleError').mockImplementation(() => ({}));

      resourceErrorHandler(mockEvent);

      expect(handler.handleError).toHaveBeenCalledWith(
        ProductionErrorTypes.NETWORK,
        'Resource loading failed',
        expect.objectContaining({
          type: 'resource',
          element: 'IMG',
          source: '/missing-image.jpg'
        })
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle null or undefined errors', () => {
      expect(() => {
        handler.handleError(ProductionErrorTypes.UNKNOWN, null);
      }).not.toThrow();

      expect(() => {
        handler.handleError(ProductionErrorTypes.UNKNOWN, undefined);
      }).not.toThrow();
    });

    test('should handle errors without names', () => {
      const errorWithoutName = new Error('Test error');
      delete errorWithoutName.name;

      const errorInfo = handler.handleError(ProductionErrorTypes.UNKNOWN, errorWithoutName);

      expect(errorInfo.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const longError = new Error(longMessage);

      expect(() => {
        handler.handleError(ProductionErrorTypes.UNKNOWN, longError);
      }).not.toThrow();
    });

    test('should handle circular error objects', () => {
      const circularError = new Error('Circular error');
      circularError.circular = circularError;

      expect(() => {
        handler.handleError(ProductionErrorTypes.UNKNOWN, circularError);
      }).not.toThrow();
    });

    test('should provide fallback error messages', () => {
      const unknownErrorType = 'unknown_error_type';
      
      const swMessage = handler.getServiceWorkerUserMessage(unknownErrorType);
      const audioMessage = handler.getAudioUserMessage(unknownErrorType);
      const manifestMessage = handler.getManifestUserMessage(unknownErrorType);
      const genericMessage = handler.getGenericUserMessage(unknownErrorType, new Error());

      expect(swMessage).toContain('Some features may not work');
      expect(audioMessage).toContain('Audio features may not work');
      expect(manifestMessage).toContain('Some app features may not work');
      expect(genericMessage).toContain('The app should continue to work');
    });
  });
});