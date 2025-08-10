/**
 * Production Deployment Integration Tests
 * Tests for real-world production deployment scenarios and error handling
 */

import serviceWorkerManager from '../ServiceWorkerManager';
import audioManager from '../AudioManager';
import manifestValidator from '../ManifestValidator';
import productionErrorHandler from '../ProductionErrorHandler';

// Mock fetch for different deployment scenarios
global.fetch = jest.fn();

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  decodeAudioData: jest.fn()
};

global.AudioContext = jest.fn(() => mockAudioContext);

// Mock HTML5 Audio
const mockAudio = {
  preload: 'auto',
  volume: 0.7,
  addEventListener: jest.fn(),
  load: jest.fn(),
  play: jest.fn(),
  src: ''
};

global.Audio = jest.fn(() => mockAudio);

// Mock service worker
const mockServiceWorker = {
  register: jest.fn(),
  addEventListener: jest.fn()
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

Object.defineProperty(global.window, 'PushManager', {
  value: function() {},
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Production Deployment Integration Tests', () => {
  let serviceWorkerManager;
  let audioManager;
  let manifestValidator;
  let errorHandler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockAudioContext.createBufferSource.mockReturnValue({
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    });
    
    mockAudioContext.createGain.mockReturnValue({
      gain: {
        value: 0.7,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn()
    });

    mockAudioContext.createOscillator.mockReturnValue({
      frequency: { value: 440 },
      type: 'sine',
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    });

    mockAudio.addEventListener.mockImplementation((event, callback) => {
      if (event === 'canplaythrough') {
        setTimeout(callback, 0);
      }
    });

    mockAudio.play.mockResolvedValue();
    localStorageMock.getItem.mockReturnValue(null);

    // Use singleton instances
    // Note: In a real test environment, we might want to reset state
    // but for now we'll use the singletons directly

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.dispatchEvent
    jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Vercel Deployment Scenarios', () => {
    test('should handle service worker MIME type issues on Vercel', async () => {
      // Simulate Vercel serving SW as HTML
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('text/html; charset=utf-8')
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('<!DOCTYPE html><html><head><title>404</title></head></html>')
        });

      const result = await serviceWorkerManager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe('sw_mime_type_error');
      expect(result.details).toContain('HTML instead of JavaScript');
    });

    test('should handle CDN caching issues', async () => {
      // Simulate cached 404 response
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });

      const result = await serviceWorkerManager.register('/sw.js');

      expect(result.success).toBe(false);
      expect(result.error).toBe('sw_network_error');
    });

    test('should handle audio encoding issues on Vercel', async () => {
      // Simulate audio files with wrong encoding
      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      mockAudioContext.decodeAudioData.mockRejectedValue(
        new DOMException('Unable to decode audio data', 'EncodingError')
      );

      await audioManager.initialize();

      // Should fall back to HTML5 Audio
      expect(audioManager.useWebAudio).toBe(false);
    });

    test('should handle manifest serving issues', async () => {
      // Simulate manifest served as HTML
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        },
        text: jest.fn().mockResolvedValue('<!DOCTYPE html><html></html>')
      });

      const result = await manifestValidator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('manifest_network_error');
    });
  });

  describe('Railway Deployment Scenarios', () => {
    test('should handle Railway service worker deployment', async () => {
      // Simulate successful Railway deployment
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

      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        addEventListener: jest.fn()
      });

      const result = await serviceWorkerManager.register('/sw.js');

      expect(result.success).toBe(true);
      expect(result.scope).toBe('/');
    });

    test('should handle Railway static file serving', async () => {
      // Simulate Railway serving static files correctly
      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });

      mockAudioContext.decodeAudioData.mockResolvedValue({
        duration: 1.0,
        numberOfChannels: 2
      });

      await audioManager.initialize();

      const result = await audioManager.playSound('message');

      expect(result).toBe(true);
      expect(audioManager.useWebAudio).toBe(true);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('should handle Safari service worker limitations', async () => {
      // Simulate Safari's limited service worker support
      delete global.window.PushManager;
      
      const safariManager = new ServiceWorkerManager();
      
      expect(safariManager.isSupported).toBe(false);
      
      const result = await safariManager.register('/sw.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('sw_unsupported');
    });

    test('should handle iOS audio restrictions', async () => {
      // Simulate iOS audio context suspended state
      mockAudioContext.state = 'suspended';
      
      await audioManager.initialize();
      
      expect(audioManager.audioContext.state).toBe('suspended');
      // Should set up user interaction listeners
      expect(document.addEventListener).toHaveBeenCalled();
    });

    test('should handle Firefox audio codec issues', async () => {
      // Simulate Firefox not supporting certain audio formats
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          mockAudio.error = { code: 4 }; // MEDIA_ERR_SRC_NOT_SUPPORTED
          setTimeout(callback, 0);
        }
      });

      // Should try multiple formats and fall back
      await audioManager.loadSound('message', ['/test.mp3', '/test.ogg']);
      
      expect(audioManager.fallbackSounds.has('message')).toBe(true);
    });
  });

  describe('Network Failure Scenarios', () => {
    test('should handle complete network failure gracefully', async () => {
      // Simulate network failure
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      const swResult = await serviceWorkerManager.register('/sw.js');
      await audioManager.initialize();
      const manifestResult = await manifestValidator.validateManifest();

      expect(swResult.success).toBe(false);
      expect(audioManager.fallbackSounds.size).toBeGreaterThan(0);
      expect(manifestResult.isValid).toBe(false);
    });

    test('should handle intermittent network issues with retry', async () => {
      // Mock network failure then success
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

      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        addEventListener: jest.fn()
      });

      // Mock delay to speed up test
      jest.spyOn(serviceWorkerManager, 'delay').mockResolvedValue();

      const result = await serviceWorkerManager.register('/sw.js');

      expect(result.success).toBe(true);
      expect(serviceWorkerManager.retryAttempts).toBe(1);
    });

    test('should handle slow network responses', async () => {
      // Simulate slow response
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            headers: {
              get: jest.fn().mockReturnValue('application/javascript')
            }
          }), 100)
        )
      );

      const startTime = Date.now();
      await serviceWorkerManager.validateServiceWorkerFile('/sw.js');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(90);
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should provide complete fallback experience', async () => {
      // Simulate all systems failing
      global.fetch.mockRejectedValue(new Error('Network failure'));
      delete global.navigator.serviceWorker;
      delete global.AudioContext;
      delete global.webkitAudioContext;

      const fallbackSW = new ServiceWorkerManager();
      const fallbackAudio = new AudioManager();
      const fallbackManifest = new ManifestValidator();

      // Service worker should be unsupported
      expect(fallbackSW.isSupported).toBe(false);

      // Audio should fall back to synthetic sounds
      await fallbackAudio.initialize();
      expect(fallbackAudio.fallbackSounds.size).toBeGreaterThan(0);

      // Manifest should generate fallback
      const fallbackManifestData = fallbackManifest.generateFallbackManifest();
      expect(fallbackManifestData.name).toBeTruthy();
      expect(fallbackManifestData.icons.length).toBeGreaterThan(0);
    });

    test('should handle partial system failures', async () => {
      // Service worker works, audio fails, manifest works
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
        })
        .mockRejectedValueOnce(new Error('Audio fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          text: jest.fn().mockResolvedValue(JSON.stringify({
            name: 'Test App',
            short_name: 'Test',
            start_url: '/',
            display: 'standalone',
            icons: [{ src: '/icon.png', sizes: '192x192' }]
          }))
        })
        .mockResolvedValueOnce({ ok: true }); // Icon check

      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        addEventListener: jest.fn()
      });

      const swResult = await serviceWorkerManager.register('/sw.js');
      await audioManager.initialize();
      const manifestResult = await manifestValidator.validateManifest();

      expect(swResult.success).toBe(true);
      expect(audioManager.fallbackSounds.size).toBeGreaterThan(0);
      expect(manifestResult.isValid).toBe(true);
    });
  });

  describe('Production Error Handling Integration', () => {
    test('should handle and report all deployment errors', async () => {
      jest.spyOn(errorHandler, 'handleServiceWorkerError');
      jest.spyOn(errorHandler, 'handleAudioError');
      jest.spyOn(errorHandler, 'handleManifestError');

      // Simulate various failures
      global.fetch.mockRejectedValue(new Error('Network failure'));

      await serviceWorkerManager.register('/sw.js');
      await audioManager.initialize();
      await manifestValidator.validateManifest();

      // Errors should be handled by the error handler
      expect(errorHandler.errors.size).toBeGreaterThan(0);
    });

    test('should provide user-friendly error messages for deployment issues', () => {
      const swError = errorHandler.handleServiceWorkerError('sw_mime_type_error');
      const audioError = errorHandler.handleAudioError('audio_encoding_error');
      const manifestError = errorHandler.handleManifestError('manifest_syntax_error');

      expect(swError.userMessage).toContain('offline features');
      expect(audioError.userMessage).toContain('Notification sounds');
      expect(manifestError.userMessage).toContain('App installation');

      // All should be user-friendly, not technical
      expect(swError.userMessage).not.toContain('MIME');
      expect(audioError.userMessage).not.toContain('EncodingError');
      expect(manifestError.userMessage).not.toContain('JSON');
    });

    test('should categorize errors by severity appropriately', () => {
      const mimeError = errorHandler.handleServiceWorkerError('sw_mime_type_error');
      const unsupportedError = errorHandler.handleServiceWorkerError('sw_unsupported');
      const encodingError = errorHandler.handleAudioError('audio_encoding_error');
      const syntaxError = errorHandler.handleManifestError('manifest_syntax_error');

      expect(mimeError.severity).toBe('medium');
      expect(unsupportedError.severity).toBe('low');
      expect(encodingError.severity).toBe('medium');
      expect(syntaxError.severity).toBe('medium');
    });
  });

  describe('Performance and Resource Management', () => {
    test('should not block application startup on failures', async () => {
      // Simulate slow/failing services
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
      );

      const startTime = Date.now();

      // These should fail fast or have timeouts
      const swPromise = serviceWorkerManager.register('/sw.js');
      const audioPromise = audioManager.initialize();
      const manifestPromise = manifestValidator.validateManifest();

      await Promise.allSettled([swPromise, audioPromise, manifestPromise]);

      const endTime = Date.now();

      // Should not take too long (allowing for some overhead)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should clean up resources properly', () => {
      // Add many errors to test cleanup
      for (let i = 0; i < 150; i++) {
        errorHandler.handleError('production_unknown_error', new Error(`Error ${i}`));
      }

      // Should not exceed max errors
      expect(errorHandler.errors.size).toBeLessThanOrEqual(errorHandler.maxErrors);
    });

    test('should handle memory constraints gracefully', () => {
      // Simulate large error objects
      const largeError = new Error('Large error');
      largeError.stack = 'A'.repeat(10000);
      largeError.largeData = new Array(1000).fill('data');

      expect(() => {
        errorHandler.handleError('production_unknown_error', largeError);
      }).not.toThrow();

      expect(errorHandler.errors.size).toBe(1);
    });
  });

  describe('Real-world Deployment Validation', () => {
    test('should validate complete deployment pipeline', async () => {
      // Simulate successful deployment
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
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          text: jest.fn().mockResolvedValue(JSON.stringify({
            name: 'Neibrly',
            short_name: 'Neibrly',
            start_url: '/',
            display: 'standalone',
            icons: [{ src: '/icon.png', sizes: '192x192' }]
          }))
        })
        .mockResolvedValueOnce({ ok: true }); // Icon check

      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        addEventListener: jest.fn()
      });

      mockAudioContext.decodeAudioData.mockResolvedValue({
        duration: 1.0
      });

      // Test complete initialization
      const swResult = await serviceWorkerManager.register('/sw.js');
      await audioManager.initialize();
      const audioResult = await audioManager.playSound('message');
      const manifestResult = await manifestValidator.validateManifest();

      expect(swResult.success).toBe(true);
      expect(audioResult).toBe(true);
      expect(manifestResult.isValid).toBe(true);

      // Verify system status
      const swStatus = serviceWorkerManager.getStatus();
      const audioStatus = audioManager.getStatus();
      const manifestStatus = manifestValidator.getValidationStatus();

      expect(swStatus.isRegistered).toBe(true);
      expect(audioStatus.isInitialized).toBe(true);
      expect(manifestStatus.hasValidated).toBe(true);
    });

    test('should handle deployment rollback scenarios', async () => {
      // Simulate successful initial deployment
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        addEventListener: jest.fn(),
        unregister: jest.fn().mockResolvedValue(true)
      });

      await serviceWorkerManager.register('/sw.js');
      expect(serviceWorkerManager.getStatus().isRegistered).toBe(true);

      // Simulate rollback
      const unregisterResult = await serviceWorkerManager.unregister();
      expect(unregisterResult.success).toBe(true);
      expect(serviceWorkerManager.getStatus().isRegistered).toBe(false);
    });
  });
});