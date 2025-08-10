/**
 * Security Audit Tests
 * Comprehensive tests for security audit functionality
 */

import {
  performSecurityAudit,
  auditEncryptionImplementation,
  auditInputValidation,
  auditXSSPrevention,
  auditFileUploadSecurity,
  auditDataSanitization,
  auditAuthenticationSecurity,
  sanitizeMessageContent,
  generateSecurityReport,
  SECURITY_LEVELS,
  AUDIT_CATEGORIES
} from '../securityAudit';

// Mock DOMPurify
const mockDOMPurify = {
  sanitize: jest.fn((content) => content.replace(/<script.*?<\/script>/gi, ''))
};

// Mock global objects
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      generateKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn()
    }
  }
});

Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:',
    hostname: 'localhost'
  }
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock document
Object.defineProperty(document, 'querySelector', {
  value: jest.fn()
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => [])
});

describe('Security Audit System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.DOMPurify = mockDOMPurify;
  });

  afterEach(() => {
    delete global.DOMPurify;
  });

  describe('performSecurityAudit', () => {
    it('should perform comprehensive security audit', async () => {
      const context = {
        messageContent: 'Hello world',
        encryptionKey: 'valid-key-123',
        fileData: { name: 'test.jpg', size: 1024, type: 'image/jpeg' }
      };

      const result = await performSecurityAudit(context);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('categories');
      expect(typeof result.overallScore).toBe('number');
      expect(Array.isArray(result.findings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle audit failures gracefully', async () => {
      // Mock a failing audit
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await performSecurityAudit();

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);

      console.error = originalConsoleError;
    });
  });

  describe('auditEncryptionImplementation', () => {
    it('should detect missing encryption', async () => {
      const context = {};
      const result = await auditEncryptionImplementation(context);

      expect(result.category).toBe(AUDIT_CATEGORIES.ENCRYPTION);
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.CRITICAL,
            message: expect.stringContaining('encryption')
          })
        ])
      );
    });

    it('should validate encryption keys', async () => {
      const context = { encryptionKey: 'weak-key' };
      const result = await auditEncryptionImplementation(context);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should check key storage security', async () => {
      mockLocalStorage.getItem.mockReturnValue('plain-text-key');
      
      const result = await auditEncryptionImplementation({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('plain text')
          })
        ])
      );
    });

    it('should verify Web Crypto API availability', async () => {
      const originalCrypto = window.crypto;
      delete window.crypto;

      const result = await auditEncryptionImplementation({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.CRITICAL,
            message: expect.stringContaining('Web Crypto API')
          })
        ])
      );

      window.crypto = originalCrypto;
    });
  });

  describe('auditInputValidation', () => {
    it('should detect XSS attempts in message content', async () => {
      const context = {
        messageContent: '<script>alert("xss")</script>Hello'
      };

      const result = await auditInputValidation(context);

      expect(result.category).toBe(AUDIT_CATEGORIES.INPUT_VALIDATION);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should validate message length', async () => {
      const context = {
        messageContent: 'a'.repeat(15000) // Exceeds max length
      };

      const result = await auditInputValidation(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('length')
          })
        ])
      );
    });

    it('should detect dangerous file extensions', async () => {
      const context = {
        fileData: { name: 'malware.exe', size: 1024 }
      };

      const result = await auditInputValidation(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('extension')
          })
        ])
      );
    });

    it('should handle missing context gracefully', async () => {
      const result = await auditInputValidation({});

      expect(result.category).toBe(AUDIT_CATEGORIES.INPUT_VALIDATION);
      expect(result.findings).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('auditXSSPrevention', () => {
    it('should detect missing DOMPurify', async () => {
      delete global.DOMPurify;

      const result = await auditXSSPrevention({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.CRITICAL,
            message: expect.stringContaining('DOMPurify')
          })
        ])
      );
    });

    it('should test DOMPurify configuration', async () => {
      mockDOMPurify.sanitize.mockReturnValue('<img src="x" onerror="alert(1)">');

      const result = await auditXSSPrevention({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('properly configured')
          })
        ])
      );
    });

    it('should check for CSP headers', async () => {
      document.querySelector.mockReturnValue(null);

      const result = await auditXSSPrevention({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('Content Security Policy')
          })
        ])
      );
    });
  });

  describe('auditFileUploadSecurity', () => {
    it('should validate file size limits', async () => {
      const context = {
        fileData: { size: 100 * 1024 * 1024, type: 'image/jpeg' } // 100MB
      };

      const result = await auditFileUploadSecurity(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('size')
          })
        ])
      );
    });

    it('should validate MIME types', async () => {
      const context = {
        fileData: { type: 'application/x-executable', size: 1024 }
      };

      const result = await auditFileUploadSecurity(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('file type')
          })
        ])
      );
    });

    it('should check for virus scanning', async () => {
      const context = {
        hasVirusScanning: false,
        fileData: { size: 1024, type: 'image/jpeg' }
      };

      const result = await auditFileUploadSecurity(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('virus scanning')
          })
        ])
      );
    });

    it('should validate filenames', async () => {
      const context = {
        fileData: { name: 'file<script>.jpg', size: 1024, type: 'image/jpeg' }
      };

      const result = await auditFileUploadSecurity(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('filename')
          })
        ])
      );
    });
  });

  describe('auditDataSanitization', () => {
    it('should detect unsafe content patterns', async () => {
      const context = {
        messageContent: '<script>alert("xss")</script>Hello world'
      };

      const result = await auditDataSanitization(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('unsafe content')
          })
        ])
      );
    });

    it('should validate URLs', async () => {
      const context = {
        urls: ['javascript:alert("xss")', 'data:text/html,<script>alert(1)</script>']
      };

      const result = await auditDataSanitization(context);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('URL protocol')
          })
        ])
      );
    });

    it('should detect SQL injection patterns', async () => {
      const context = {
        searchQuery: "'; DROP TABLE messages; --"
      };

      const result = await auditDataSanitization(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('injection pattern')
          })
        ])
      );
    });
  });

  describe('auditAuthenticationSecurity', () => {
    it('should check token format', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token-format');

      const result = await auditAuthenticationSecurity({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('token format')
          })
        ])
      );
    });

    it('should detect expired tokens', async () => {
      const context = {
        tokenData: { exp: Math.floor(Date.now() / 1000) - 3600 } // Expired 1 hour ago
      };

      const result = await auditAuthenticationSecurity(context);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('expired')
          })
        ])
      );
    });

    it('should check HTTPS usage', async () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' }
      });

      const result = await auditAuthenticationSecurity({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.CRITICAL,
            message: expect.stringContaining('HTTPS')
          })
        ])
      );

      Object.defineProperty(window, 'location', { value: originalLocation });
    });

    it('should check session timeout', async () => {
      const oldTimestamp = Date.now() - (35 * 60 * 1000); // 35 minutes ago
      mockLocalStorage.getItem.mockReturnValue(oldTimestamp.toString());

      const result = await auditAuthenticationSecurity({});

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.MEDIUM,
            message: expect.stringContaining('session timeout')
          })
        ])
      );
    });
  });

  describe('sanitizeMessageContent', () => {
    it('should sanitize dangerous content with DOMPurify', () => {
      const dangerousContent = '<script>alert("xss")</script>Hello';
      mockDOMPurify.sanitize.mockReturnValue('Hello');

      const result = sanitizeMessageContent(dangerousContent);

      expect(result).toBe('Hello');
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(dangerousContent, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
        ALLOWED_ATTR: []
      });
    });

    it('should use fallback sanitization when DOMPurify unavailable', () => {
      delete global.DOMPurify;
      
      const dangerousContent = '<script>alert("xss")</script>';
      const result = sanitizeMessageContent(dangerousContent);

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty content', () => {
      const result = sanitizeMessageContent('');
      expect(result).toBe('');
    });

    it('should handle null/undefined content', () => {
      expect(sanitizeMessageContent(null)).toBe('');
      expect(sanitizeMessageContent(undefined)).toBe('');
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate comprehensive security report', () => {
      const auditResults = {
        timestamp: '2024-01-01T00:00:00.000Z',
        overallScore: 75,
        findings: [
          { level: SECURITY_LEVELS.HIGH, message: 'High severity issue' },
          { level: SECURITY_LEVELS.MEDIUM, message: 'Medium severity issue' }
        ],
        recommendations: ['Fix high severity issues'],
        categories: {
          encryption: { score: 80 },
          input_validation: { score: 70 }
        }
      };

      const report = generateSecurityReport(auditResults);

      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('overallScore', 75);
      expect(report.summary).toHaveProperty('riskLevel', 'MEDIUM');
      expect(report.summary).toHaveProperty('totalFindings', 2);
      expect(report.summary).toHaveProperty('criticalFindings', 0);
      expect(report.summary).toHaveProperty('highFindings', 1);
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('nextAuditDate');
    });

    it('should calculate correct risk levels', () => {
      const testCases = [
        { score: 95, expectedRisk: 'LOW' },
        { score: 80, expectedRisk: 'MEDIUM' },
        { score: 60, expectedRisk: 'HIGH' },
        { score: 30, expectedRisk: 'CRITICAL' }
      ];

      testCases.forEach(({ score, expectedRisk }) => {
        const auditResults = {
          timestamp: '2024-01-01T00:00:00.000Z',
          overallScore: score,
          findings: [],
          recommendations: [],
          categories: {}
        };

        const report = generateSecurityReport(auditResults);
        expect(report.summary.riskLevel).toBe(expectedRisk);
      });
    });
  });

  describe('Security Levels and Categories', () => {
    it('should have correct security levels defined', () => {
      expect(SECURITY_LEVELS).toEqual({
        CRITICAL: 'critical',
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low',
        INFO: 'info'
      });
    });

    it('should have correct audit categories defined', () => {
      expect(AUDIT_CATEGORIES).toEqual({
        ENCRYPTION: 'encryption',
        INPUT_VALIDATION: 'input_validation',
        XSS_PREVENTION: 'xss_prevention',
        FILE_UPLOAD: 'file_upload',
        AUTHENTICATION: 'authentication',
        DATA_SANITIZATION: 'data_sanitization'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle audit function errors gracefully', async () => {
      // Mock an audit function to throw an error
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Force an error by passing invalid context
      const result = await auditEncryptionImplementation(null);

      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: SECURITY_LEVELS.HIGH,
            message: expect.stringContaining('audit failed')
          })
        ])
      );

      console.error = originalConsoleError;
    });

    it('should maintain audit structure even with errors', async () => {
      const result = await auditInputValidation(null);

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('score');
      expect(Array.isArray(result.findings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.score).toBe('number');
    });
  });
});