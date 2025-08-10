/**
 * Input Sanitization Tests
 * Comprehensive tests for input sanitization functionality
 */

import {
  sanitizeMessageContent,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeUrl,
  sanitizeUserInput,
  validateFileUpload,
  batchSanitize,
  SANITIZATION_CONFIGS
} from '../inputSanitization';

// Mock DOMPurify
const mockDOMPurify = {
  sanitize: jest.fn((content, options) => {
    // Simple mock that removes script tags
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  })
};

describe('Input Sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.DOMPurify = mockDOMPurify;
  });

  afterEach(() => {
    delete global.DOMPurify;
  });

  describe('sanitizeMessageContent', () => {
    it('should sanitize dangerous script tags', () => {
      const dangerousContent = '<script>alert("xss")</script>Hello World';
      const result = sanitizeMessageContent(dangerousContent);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
      expect(result.warnings).toContain('Potentially dangerous content detected and removed');
    });

    it('should handle empty content based on configuration', () => {
      const result1 = sanitizeMessageContent('');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Message content cannot be empty');

      const result2 = sanitizeMessageContent('', { ALLOW_EMPTY: true });
      expect(result2.isValid).toBe(true);
      expect(result2.sanitized).toBe('');
    });

    it('should validate content length', () => {
      const longContent = 'a'.repeat(15000);
      const result = sanitizeMessageContent(longContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message exceeds maximum length of 10000 characters');
    });

    it('should handle non-string input', () => {
      const result = sanitizeMessageContent(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content must be a string');
    });

    it('should use fallback sanitization when DOMPurify unavailable', () => {
      delete global.DOMPurify;

      const dangerousContent = '<script>alert("xss")</script>';
      const result = sanitizeMessageContent(dangerousContent);

      expect(result.sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result.warnings).toContain('Using fallback sanitization - DOMPurify not available');
    });

    it('should detect various dangerous patterns', () => {
      const testCases = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img onerror="alert(1)">',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        '<iframe src="evil.com"></iframe>',
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">'
      ];

      testCases.forEach(testCase => {
        const result = sanitizeMessageContent(testCase);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    it('should preserve safe content', () => {
      const safeContent = 'Hello <b>world</b>! How are you?';
      const result = sanitizeMessageContent(safeContent);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toContain('Hello');
      expect(result.sanitized).toContain('world');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize dangerous filenames', () => {
      const dangerousFilename = 'file<script>.exe';
      const result = sanitizeFilename(dangerousFilename);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type not allowed for security reasons');
    });

    it('should remove forbidden characters', () => {
      const filename = 'my|file<name>.txt';
      const result = sanitizeFilename(filename);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('my_file_name_.txt');
      expect(result.warnings).toContain('Filename was modified for security');
    });

    it('should handle empty filename after sanitization', () => {
      const filename = '...';
      const result = sanitizeFilename(filename);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toMatch(/^file_\d+$/);
      expect(result.warnings).toContain('Filename was empty after sanitization, generated new name');
    });

    it('should detect reserved Windows filenames', () => {
      const reservedNames = ['CON.txt', 'PRN.doc', 'AUX.pdf', 'NUL.jpg'];
      
      reservedNames.forEach(filename => {
        const result = sanitizeFilename(filename);
        expect(result.sanitized).toStartWith('file_');
        expect(result.warnings).toContain('Reserved filename detected, prefix added');
      });
    });

    it('should validate filename length', () => {
      const longFilename = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longFilename);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename exceeds maximum length of 255 characters');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeFilename(null).isValid).toBe(false);
      expect(sanitizeFilename(undefined).isValid).toBe(false);
      expect(sanitizeFilename('').isValid).toBe(false);
    });

    it('should block dangerous extensions', () => {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
      
      dangerousExtensions.forEach(ext => {
        const result = sanitizeFilename(`file${ext}`);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File type not allowed for security reasons');
      });
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should sanitize SQL injection attempts', () => {
      const maliciousQuery = "'; DROP TABLE messages; --";
      const result = sanitizeSearchQuery(maliciousQuery);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Potentially dangerous search pattern detected');
      expect(result.sanitized).not.toContain('DROP TABLE');
    });

    it('should handle XSS attempts in search', () => {
      const xssQuery = '<script>alert("xss")</script>search term';
      const result = sanitizeSearchQuery(xssQuery);

      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('search term');
    });

    it('should validate search query length', () => {
      const longQuery = 'a'.repeat(600);
      const result = sanitizeSearchQuery(longQuery);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Search query exceeds maximum length of 500 characters');
    });

    it('should handle empty search query', () => {
      const result = sanitizeSearchQuery('');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
    });

    it('should trim whitespace', () => {
      const query = '  search term  ';
      const result = sanitizeSearchQuery(query);

      expect(result.sanitized).toBe('search term');
    });

    it('should detect various injection patterns', () => {
      const injectionPatterns = [
        'SELECT * FROM users',
        'INSERT INTO messages',
        'UPDATE users SET',
        'DELETE FROM chats',
        'OR 1=1',
        'AND 1=1',
        '/* comment */',
        '-- comment'
      ];

      injectionPatterns.forEach(pattern => {
        const result = sanitizeSearchQuery(pattern);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sanitizeUrl', () => {
    it('should validate safe URLs', () => {
      const safeUrls = [
        'https://example.com',
        'http://localhost:3000',
        'mailto:user@example.com',
        'tel:+1234567890'
      ];

      safeUrls.forEach(url => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(url);
      });
    });

    it('should block dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd'
      ];

      dangerousUrls.forEach(url => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate URL format', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'ftp://incomplete'
      ];

      invalidUrls.forEach(url => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid URL format');
      });
    });

    it('should validate URL length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = sanitizeUrl(longUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL exceeds maximum length of 2048 characters');
    });

    it('should detect embedded scripts in URLs', () => {
      const maliciousUrl = 'https://example.com/<script>alert(1)</script>';
      const result = sanitizeUrl(maliciousUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL contains dangerous content');
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize general user input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeUserInput(input);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('Hello World');
    });

    it('should validate input length', () => {
      const longInput = 'a'.repeat(1500);
      const result = sanitizeUserInput(longInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input exceeds maximum length of 1000 characters');
    });

    it('should handle custom options', () => {
      const input = 'a'.repeat(500);
      const result = sanitizeUserInput(input, { MAX_LENGTH: 200 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input exceeds maximum length of 200 characters');
    });

    it('should trim whitespace', () => {
      const input = '  user input  ';
      const result = sanitizeUserInput(input);

      expect(result.sanitized).toBe('user input');
    });

    it('should use fallback when DOMPurify unavailable', () => {
      delete global.DOMPurify;

      const input = '<script>alert(1)</script>text';
      const result = sanitizeUserInput(input);

      expect(result.sanitized).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;text');
    });
  });

  describe('validateFileUpload', () => {
    const createMockFile = (name, size, type) => ({
      name,
      size,
      type,
      constructor: { name: 'File' }
    });

    // Mock File constructor check
    beforeEach(() => {
      global.File = function() {};
    });

    it('should validate safe file uploads', () => {
      const file = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = validateFileUpload(file);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedName).toBe('document.pdf');
    });

    it('should reject oversized files', () => {
      const file = createMockFile('large.jpg', 100 * 1024 * 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = validateFileUpload(file, { maxSize: 10 * 1024 * 1024 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds limit of 10.00MB');
    });

    it('should reject dangerous file types', () => {
      const file = createMockFile('malware.exe', 1024, 'application/x-executable');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = validateFileUpload(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type application/x-executable not allowed');
    });

    it('should detect path traversal attempts', () => {
      const file = createMockFile('../../../etc/passwd', 1024, 'text/plain');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = validateFileUpload(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename contains path traversal characters');
    });

    it('should handle invalid file objects', () => {
      const result = validateFileUpload(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file object');
    });

    it('should sanitize filenames during validation', () => {
      const file = createMockFile('file<script>.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = validateFileUpload(file);

      expect(result.sanitizedName).toBe('file_script_.jpg');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('batchSanitize', () => {
    it('should sanitize multiple inputs with different types', () => {
      const inputs = {
        message: '<script>alert(1)</script>Hello',
        filename: 'file<test>.txt',
        search: 'SELECT * FROM users',
        url: 'https://example.com',
        general: 'user input'
      };

      const configs = {
        message: { type: 'message' },
        filename: { type: 'filename' },
        search: { type: 'search' },
        url: { type: 'url' },
        general: { type: 'user' }
      };

      const results = batchSanitize(inputs, configs);

      expect(results.message.sanitized).toBe('Hello');
      expect(results.filename.sanitized).toBe('file_test_.txt');
      expect(results.search.warnings.length).toBeGreaterThan(0);
      expect(results.url.isValid).toBe(true);
      expect(results.general.sanitized).toBe('user input');
    });

    it('should use default sanitization for unknown types', () => {
      const inputs = {
        unknown: '<script>alert(1)</script>text'
      };

      const results = batchSanitize(inputs, {});

      expect(results.unknown.sanitized).not.toContain('<script>');
      expect(results.unknown.sanitized).toContain('text');
    });

    it('should handle empty inputs object', () => {
      const results = batchSanitize({}, {});
      expect(results).toEqual({});
    });
  });

  describe('SANITIZATION_CONFIGS', () => {
    it('should have correct configuration structure', () => {
      expect(SANITIZATION_CONFIGS).toHaveProperty('MESSAGE');
      expect(SANITIZATION_CONFIGS).toHaveProperty('FILENAME');
      expect(SANITIZATION_CONFIGS).toHaveProperty('SEARCH_QUERY');
      expect(SANITIZATION_CONFIGS).toHaveProperty('URL');
      expect(SANITIZATION_CONFIGS).toHaveProperty('USER_INPUT');

      expect(SANITIZATION_CONFIGS.MESSAGE).toHaveProperty('MAX_LENGTH');
      expect(SANITIZATION_CONFIGS.MESSAGE).toHaveProperty('ALLOWED_TAGS');
      expect(SANITIZATION_CONFIGS.FILENAME).toHaveProperty('FORBIDDEN_EXTENSIONS');
      expect(SANITIZATION_CONFIGS.URL).toHaveProperty('ALLOWED_PROTOCOLS');
    });

    it('should have reasonable default values', () => {
      expect(SANITIZATION_CONFIGS.MESSAGE.MAX_LENGTH).toBe(10000);
      expect(SANITIZATION_CONFIGS.FILENAME.MAX_LENGTH).toBe(255);
      expect(SANITIZATION_CONFIGS.URL.MAX_LENGTH).toBe(2048);
      expect(Array.isArray(SANITIZATION_CONFIGS.FILENAME.FORBIDDEN_EXTENSIONS)).toBe(true);
      expect(Array.isArray(SANITIZATION_CONFIGS.URL.ALLOWED_PROTOCOLS)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle sanitization errors gracefully', () => {
      // Mock DOMPurify to throw an error
      mockDOMPurify.sanitize.mockImplementation(() => {
        throw new Error('Sanitization failed');
      });

      const result = sanitizeMessageContent('test content');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sanitization failed: Sanitization failed');
      expect(result.sanitized).toBe('');
    });

    it('should maintain result structure even with errors', () => {
      const result = sanitizeUserInput(null);

      expect(result).toHaveProperty('sanitized');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});