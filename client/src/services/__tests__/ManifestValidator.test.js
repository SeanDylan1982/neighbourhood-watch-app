/**
 * ManifestValidator Tests
 * Comprehensive test suite for manifest validation and error handling
 */

import manifestValidator, { ManifestErrorTypes } from '../ManifestValidator';

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url')
};

// Mock Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0].length
}));

describe('ManifestValidator', () => {
  let validator;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Use the singleton instance
    validator = manifestValidator;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Manifest Fetching', () => {
    test('should fetch manifest successfully', async () => {
      const mockManifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify(mockManifest))
      });

      const manifest = await validator.fetchManifest();

      expect(manifest).toEqual(mockManifest);
      expect(global.fetch).toHaveBeenCalledWith('/manifest.json', {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });
    });

    test('should handle 404 responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const manifest = await validator.fetchManifest();

      expect(manifest).toBe(null);
    });

    test('should detect HTML served instead of JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        },
        text: jest.fn().mockResolvedValue('<!DOCTYPE html><html></html>')
      });

      const manifest = await validator.fetchManifest();

      expect(manifest).toBe(null);
    });

    test('should handle malformed JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue('{ invalid json }')
      });

      const manifest = await validator.fetchManifest();

      expect(manifest).toBe(null);
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const manifest = await validator.fetchManifest();

      expect(manifest).toBe(null);
    });
  });

  describe('Syntax Validation', () => {
    test('should validate correct JSON object', () => {
      const manifest = { name: 'Test App' };

      const result = validator.validateSyntax(manifest);

      expect(result.isValid).toBe(true);
    });

    test('should reject null manifest', () => {
      const result = validator.validateSyntax(null);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.SYNTAX_ERROR);
    });

    test('should reject non-object manifest', () => {
      const result = validator.validateSyntax('not an object');

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.SYNTAX_ERROR);
    });

    test('should reject array manifest', () => {
      const result = validator.validateSyntax([]);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.SYNTAX_ERROR);
    });
  });

  describe('Required Fields Validation', () => {
    test('should validate manifest with all required fields', () => {
      const manifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };

      const result = validator.validateRequiredFields(manifest);

      expect(result.isValid).toBe(true);
    });

    test('should reject manifest missing required fields', () => {
      const manifest = {
        name: 'Test App'
        // Missing other required fields
      };

      const result = validator.validateRequiredFields(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.MISSING_FIELDS);
      expect(result.message).toContain('short_name');
      expect(result.message).toContain('start_url');
      expect(result.message).toContain('display');
      expect(result.message).toContain('icons');
    });

    test('should reject manifest with empty required fields', () => {
      const manifest = {
        name: '',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: []
      };

      const result = validator.validateRequiredFields(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.MISSING_FIELDS);
    });

    test('should validate different start_url formats', () => {
      const validUrls = ['/', '/app', 'https://example.com', '.'];
      
      validUrls.forEach(url => {
        const manifest = {
          name: 'Test App',
          short_name: 'Test',
          start_url: url,
          display: 'standalone',
          icons: [{ src: '/icon.png', sizes: '192x192' }]
        };

        const result = validator.validateRequiredFields(manifest);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid start_url', () => {
      const manifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: 'invalid-url',
        display: 'standalone',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };

      const result = validator.validateRequiredFields(manifest);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid start_url format');
    });

    test('should validate display modes', () => {
      const validModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
      
      validModes.forEach(mode => {
        const manifest = {
          name: 'Test App',
          short_name: 'Test',
          start_url: '/',
          display: mode,
          icons: [{ src: '/icon.png', sizes: '192x192' }]
        };

        const result = validator.validateRequiredFields(manifest);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid display mode', () => {
      const manifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'invalid-mode',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };

      const result = validator.validateRequiredFields(manifest);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid display mode');
    });
  });

  describe('Icon Validation', () => {
    test('should validate icons successfully', async () => {
      const icons = [
        { src: '/icon-192.png', sizes: '192x192' },
        { src: '/icon-512.png', sizes: '512x512' }
      ];

      // Mock successful icon checks
      global.fetch.mockResolvedValue({
        ok: true
      });

      const result = await validator.validateIcons(icons);

      expect(result.isValid).toBe(true);
    });

    test('should reject empty icons array', async () => {
      const result = await validator.validateIcons([]);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
      expect(result.message).toContain('No icons defined');
    });

    test('should reject non-array icons', async () => {
      const result = await validator.validateIcons(null);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
    });

    test('should handle icons missing required fields', async () => {
      const icons = [
        { src: '/icon.png' }, // Missing sizes
        { sizes: '192x192' }  // Missing src
      ];

      const result = await validator.validateIcons(icons);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
    });

    test('should handle missing icon files', async () => {
      const icons = [
        { src: '/missing-icon.png', sizes: '192x192' }
      ];

      // Mock 404 response for icon
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await validator.validateIcons(icons);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
    });

    test('should handle partial icon failures', async () => {
      const icons = [
        { src: '/good-icon.png', sizes: '192x192' },
        { src: '/bad-icon.png', sizes: '512x512' }
      ];

      // Mock mixed responses
      global.fetch
        .mockResolvedValueOnce({ ok: true })   // First icon succeeds
        .mockResolvedValueOnce({ ok: false }); // Second icon fails

      const result = await validator.validateIcons(icons);

      // Should still pass if at least one icon is valid
      expect(result.isValid).toBe(true);
    });

    test('should fail when all icons are invalid', async () => {
      const icons = [
        { src: '/bad-icon1.png', sizes: '192x192' },
        { src: '/bad-icon2.png', sizes: '512x512' }
      ];

      // Mock all failures
      global.fetch.mockResolvedValue({ ok: false });

      const result = await validator.validateIcons(icons);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
      expect(result.message).toContain('All icons are invalid');
    });

    test('should handle network errors during icon validation', async () => {
      const icons = [
        { src: '/icon.png', sizes: '192x192' }
      ];

      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await validator.validateIcons(icons);

      // Should still pass with warnings
      expect(result.isValid).toBe(true);
    });
  });

  describe('Full Manifest Validation', () => {
    test('should validate complete valid manifest', async () => {
      const mockManifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          text: jest.fn().mockResolvedValue(JSON.stringify(mockManifest))
        })
        .mockResolvedValueOnce({ ok: true }); // Icon check

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(mockManifest);
      expect(validator.validationResults).toBe(result);
    });

    test('should handle manifest fetch failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.NETWORK_ERROR);
    });

    test('should handle syntax errors', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue('{ invalid json }')
      });

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.SYNTAX_ERROR);
    });

    test('should handle missing fields', async () => {
      const incompleteManifest = {
        name: 'Test App'
        // Missing required fields
      };

      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify(incompleteManifest))
      });

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.MISSING_FIELDS);
    });

    test('should handle icon validation failures', async () => {
      const manifestWithBadIcons = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/missing-icon.png', sizes: '192x192' }]
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          text: jest.fn().mockResolvedValue(JSON.stringify(manifestWithBadIcons))
        })
        .mockResolvedValueOnce({ ok: false }); // Icon check fails

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.INVALID_ICONS);
    });
  });

  describe('Fallback Manifest Generation', () => {
    test('should generate valid fallback manifest', () => {
      const fallback = validator.generateFallbackManifest();

      expect(fallback.name).toBe('Neibrly - Connect with your neighbors');
      expect(fallback.short_name).toBe('Neibrly');
      expect(fallback.start_url).toBe('/');
      expect(fallback.display).toBe('standalone');
      expect(Array.isArray(fallback.icons)).toBe(true);
      expect(fallback.icons.length).toBeGreaterThan(0);
      expect(validator.fallbackManifest).toBe(fallback);
    });

    test('should include all required PWA fields', () => {
      const fallback = validator.generateFallbackManifest();

      validator.requiredFields.forEach(field => {
        expect(fallback).toHaveProperty(field);
        expect(fallback[field]).toBeTruthy();
      });
    });

    test('should include additional PWA metadata', () => {
      const fallback = validator.generateFallbackManifest();

      expect(fallback).toHaveProperty('description');
      expect(fallback).toHaveProperty('theme_color');
      expect(fallback).toHaveProperty('background_color');
      expect(fallback).toHaveProperty('categories');
      expect(fallback).toHaveProperty('lang');
      expect(fallback).toHaveProperty('dir');
    });
  });

  describe('Manifest Fixing', () => {
    test('should fix manifest issues successfully', async () => {
      // Mock document manipulation
      const mockLink = {
        rel: 'manifest',
        href: ''
      };
      
      const mockQuerySelector = jest.spyOn(document, 'querySelector')
        .mockReturnValue(mockLink);
      
      const result = await validator.fixManifestIssues();

      expect(result.success).toBe(true);
      expect(result.manifestUrl).toBe('blob:mock-url');
      expect(result.manifest).toBeTruthy();
      expect(mockLink.href).toBe('blob:mock-url');
      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      mockQuerySelector.mockRestore();
    });

    test('should create manifest link if none exists', async () => {
      const mockLink = {
        rel: '',
        href: ''
      };
      
      const mockQuerySelector = jest.spyOn(document, 'querySelector')
        .mockReturnValue(null);
      
      const mockCreateElement = jest.spyOn(document, 'createElement')
        .mockReturnValue(mockLink);
      
      const mockAppendChild = jest.spyOn(document.head, 'appendChild')
        .mockImplementation(() => {});

      const result = await validator.fixManifestIssues();

      expect(result.success).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('manifest');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);

      mockQuerySelector.mockRestore();
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
    });

    test('should handle fixing errors', async () => {
      global.Blob = jest.fn().mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const result = await validator.fixManifestIssues();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Blob creation failed');
    });
  });

  describe('Utility Functions', () => {
    test('should validate URL formats', () => {
      const validUrls = ['/', '/app', 'https://example.com', 'http://test.com', '.'];
      const invalidUrls = ['invalid', 'ftp://test.com', 'javascript:alert(1)'];

      validUrls.forEach(url => {
        expect(validator.isValidUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(validator.isValidUrl(url)).toBe(false);
      });
    });

    test('should validate display modes', () => {
      const validModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
      const invalidModes = ['invalid', 'popup', 'window'];

      validModes.forEach(mode => {
        expect(validator.isValidDisplayMode(mode)).toBe(true);
      });

      invalidModes.forEach(mode => {
        expect(validator.isValidDisplayMode(mode)).toBe(false);
      });
    });

    test('should create validation results with correct structure', () => {
      const result = validator.createValidationResult(true, null, 'Success', { test: true });

      expect(result.isValid).toBe(true);
      expect(result.errorType).toBe(null);
      expect(result.message).toBe('Success');
      expect(result.data).toEqual({ test: true });
      expect(result.timestamp).toBeTruthy();
    });

    test('should get validation status', () => {
      // Before validation
      let status = validator.getValidationStatus();
      expect(status.hasValidated).toBe(false);
      expect(status.lastValidation).toBe(null);
      expect(status.hasFallback).toBe(false);

      // After validation
      validator.validationResults = { isValid: true };
      validator.fallbackManifest = { name: 'Test' };

      status = validator.getValidationStatus();
      expect(status.hasValidated).toBe(true);
      expect(status.lastValidation).toBeTruthy();
      expect(status.hasFallback).toBe(true);
    });

    test('should provide user-friendly error messages', () => {
      const errorTypes = [
        ManifestErrorTypes.SYNTAX_ERROR,
        ManifestErrorTypes.MISSING_FIELDS,
        ManifestErrorTypes.INVALID_ICONS,
        ManifestErrorTypes.NETWORK_ERROR
      ];

      errorTypes.forEach(errorType => {
        const message = validator.getErrorMessage(errorType);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty manifest file', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue('')
      });

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ManifestErrorTypes.SYNTAX_ERROR);
    });

    test('should handle very large manifest files', async () => {
      const largeManifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: Array(1000).fill({ src: '/icon.png', sizes: '192x192' }),
        description: 'A'.repeat(10000)
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          text: jest.fn().mockResolvedValue(JSON.stringify(largeManifest))
        });

      // Mock icon validation to avoid 1000 fetch calls
      jest.spyOn(validator, 'validateIcons').mockResolvedValue({
        isValid: true
      });

      const result = await validator.validateManifest();

      expect(result.isValid).toBe(true);
    });

    test('should handle manifest with circular references', async () => {
      const circularManifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      };
      
      // Create circular reference
      circularManifest.self = circularManifest;

      // JSON.stringify will throw on circular references
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify(circularManifest))
      });

      const result = await validator.validateManifest();

      // Should handle the circular reference gracefully
      expect(result.isValid).toBe(true);
    });
  });
});