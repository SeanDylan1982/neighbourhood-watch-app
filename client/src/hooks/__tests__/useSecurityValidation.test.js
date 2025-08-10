/**
 * Security Validation Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useSecurityValidation } from '../useSecurityValidation';
import * as inputSanitization from '../../utils/inputSanitization';
import * as fileUploadSecurity from '../../utils/fileUploadSecurity';
import * as securityAudit from '../../utils/securityAudit';

// Mock the utility modules
jest.mock('../../utils/inputSanitization');
jest.mock('../../utils/fileUploadSecurity');
jest.mock('../../utils/securityAudit');

describe('useSecurityValidation', () => {
  const mockFile = {
    name: 'test.jpg',
    size: 1024,
    type: 'image/jpeg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    inputSanitization.sanitizeMessageContent.mockReturnValue({
      isValid: true,
      sanitized: 'clean content',
      errors: [],
      warnings: []
    });

    inputSanitization.validateFileUpload.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedName: 'test.jpg'
    });

    inputSanitization.sanitizeSearchQuery.mockReturnValue({
      isValid: true,
      sanitized: 'clean query',
      errors: [],
      warnings: []
    });

    inputSanitization.sanitizeUrl.mockReturnValue({
      isValid: true,
      sanitized: 'https://example.com',
      errors: [],
      warnings: []
    });

    inputSanitization.sanitizeFilename.mockReturnValue({
      isValid: true,
      sanitized: 'test.jpg',
      errors: [],
      warnings: []
    });

    fileUploadSecurity.validateFileUploadSecurity.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedFilename: 'test.jpg',
      securityScore: 95,
      detectedType: 'image/jpeg',
      recommendations: []
    });

    securityAudit.performSecurityAudit.mockResolvedValue({
      overallScore: 85,
      findings: [],
      recommendations: []
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSecurityValidation());

      expect(result.current.validationResults).toEqual({});
      expect(result.current.isValidating).toBe(false);
      expect(result.current.securityScore).toBe(100);
      expect(result.current.lastAudit).toBeNull();
    });

    it('should accept configuration options', () => {
      const options = {
        enableRealTimeValidation: false,
        auditInterval: 10000,
        onValidationError: jest.fn(),
        onSecurityIssue: jest.fn()
      };

      const { result } = renderHook(() => useSecurityValidation(options));

      expect(result.current).toBeDefined();
    });
  });

  describe('Message Validation', () => {
    it('should validate message content', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        const validationResult = await result.current.validateMessage('Hello world');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('clean content');
        expect(inputSanitization.sanitizeMessageContent).toHaveBeenCalledWith('Hello world', {});
      });
    });

    it('should handle empty message content', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        const validationResult = await result.current.validateMessage('');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('');
      });
    });

    it('should handle message validation errors', async () => {
      inputSanitization.sanitizeMessageContent.mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Dangerous content detected'],
        warnings: []
      });

      const onSecurityIssue = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onSecurityIssue }));

      await act(async () => {
        const validationResult = await result.current.validateMessage('<script>alert(1)</script>');
        
        expect(validationResult.isValid).toBe(false);
        expect(onSecurityIssue).toHaveBeenCalledWith({
          type: 'message_validation',
          severity: 'medium',
          details: 'Dangerous content detected'
        });
      });
    });

    it('should handle validation exceptions', async () => {
      inputSanitization.sanitizeMessageContent.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const onValidationError = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onValidationError }));

      await act(async () => {
        const validationResult = await result.current.validateMessage('test');
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('Validation failed: Validation failed');
        expect(onValidationError).toHaveBeenCalled();
      });
    });
  });

  describe('File Validation', () => {
    it('should validate file upload', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        const validationResult = await result.current.validateFile(mockFile);
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.securityScore).toBe(95);
        expect(inputSanitization.validateFileUpload).toHaveBeenCalledWith(mockFile, {});
        expect(fileUploadSecurity.validateFileUploadSecurity).toHaveBeenCalledWith(mockFile, {});
      });
    });

    it('should handle file validation with options', async () => {
      const options = { maxSize: 1024 * 1024 };
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateFile(mockFile, options);
        
        expect(inputSanitization.validateFileUpload).toHaveBeenCalledWith(mockFile, options);
        expect(fileUploadSecurity.validateFileUploadSecurity).toHaveBeenCalledWith(mockFile, options);
      });
    });

    it('should handle missing file', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        const validationResult = await result.current.validateFile(null);
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('No file provided');
      });
    });

    it('should trigger security issue callback for high-risk files', async () => {
      fileUploadSecurity.validateFileUploadSecurity.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedFilename: 'test.exe',
        securityScore: 30, // Low security score
        detectedType: 'application/executable',
        recommendations: ['Do not execute this file']
      });

      const onSecurityIssue = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onSecurityIssue }));

      await act(async () => {
        await result.current.validateFile(mockFile);
        
        expect(onSecurityIssue).toHaveBeenCalledWith({
          type: 'file_upload',
          severity: 'high',
          details: 'File security score: 30',
          recommendations: ['Do not execute this file']
        });
      });
    });

    it('should handle file validation errors', async () => {
      fileUploadSecurity.validateFileUploadSecurity.mockRejectedValue(new Error('Validation failed'));

      const onValidationError = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onValidationError }));

      await act(async () => {
        const validationResult = await result.current.validateFile(mockFile);
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('File validation failed: Validation failed');
        expect(onValidationError).toHaveBeenCalled();
      });
    });
  });

  describe('Search Validation', () => {
    it('should validate search query', () => {
      const { result } = renderHook(() => useSecurityValidation());

      act(() => {
        const validationResult = result.current.validateSearch('safe query');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('clean query');
        expect(inputSanitization.sanitizeSearchQuery).toHaveBeenCalledWith('safe query');
      });
    });

    it('should handle empty search query', () => {
      const { result } = renderHook(() => useSecurityValidation());

      act(() => {
        const validationResult = result.current.validateSearch('');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('');
      });
    });

    it('should trigger security issue for dangerous search patterns', () => {
      inputSanitization.sanitizeSearchQuery.mockReturnValue({
        isValid: true,
        sanitized: 'clean query',
        errors: [],
        warnings: ['SQL injection pattern detected']
      });

      const onSecurityIssue = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onSecurityIssue }));

      act(() => {
        result.current.validateSearch("'; DROP TABLE users; --");
        
        expect(onSecurityIssue).toHaveBeenCalledWith({
          type: 'search_validation',
          severity: 'medium',
          details: 'SQL injection pattern detected'
        });
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate URL safety', () => {
      const { result } = renderHook(() => useSecurityValidation());

      act(() => {
        const validationResult = result.current.validateUrlSafety('https://example.com');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('https://example.com');
        expect(inputSanitization.sanitizeUrl).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('should handle dangerous URLs', () => {
      inputSanitization.sanitizeUrl.mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Dangerous protocol detected'],
        warnings: []
      });

      const onSecurityIssue = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onSecurityIssue }));

      act(() => {
        result.current.validateUrlSafety('javascript:alert(1)');
        
        expect(onSecurityIssue).toHaveBeenCalledWith({
          type: 'url_validation',
          severity: 'high',
          details: 'Dangerous protocol detected'
        });
      });
    });
  });

  describe('Filename Validation', () => {
    it('should validate filename', () => {
      const { result } = renderHook(() => useSecurityValidation());

      act(() => {
        const validationResult = result.current.validateFilename('document.pdf');
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.sanitized).toBe('test.jpg');
        expect(inputSanitization.sanitizeFilename).toHaveBeenCalledWith('document.pdf');
      });
    });

    it('should handle empty filename', () => {
      const { result } = renderHook(() => useSecurityValidation());

      act(() => {
        const validationResult = result.current.validateFilename('');
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('Filename required');
      });
    });
  });

  describe('Security Audit', () => {
    it('should run security audit', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        const auditResult = await result.current.runSecurityAudit({ messageContent: 'test' });
        
        expect(auditResult.overallScore).toBe(85);
        expect(result.current.securityScore).toBe(85);
        expect(result.current.lastAudit).toBeDefined();
        expect(securityAudit.performSecurityAudit).toHaveBeenCalledWith({ messageContent: 'test' });
      });
    });

    it('should trigger security issue for critical findings', async () => {
      securityAudit.performSecurityAudit.mockResolvedValue({
        overallScore: 30,
        findings: [
          { level: 'critical', message: 'Critical security issue' },
          { level: 'high', message: 'High security issue' }
        ],
        recommendations: []
      });

      const onSecurityIssue = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onSecurityIssue }));

      await act(async () => {
        await result.current.runSecurityAudit();
        
        expect(onSecurityIssue).toHaveBeenCalledWith({
          type: 'security_audit',
          severity: 'critical',
          details: '1 critical security issues found',
          findings: [{ level: 'critical', message: 'Critical security issue' }]
        });
      });
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple inputs', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      const inputs = {
        message: 'Hello world',
        file: mockFile,
        search: 'search query',
        url: 'https://example.com',
        filename: 'document.pdf'
      };

      await act(async () => {
        const results = await result.current.batchValidate(inputs);
        
        expect(results.message.isValid).toBe(true);
        expect(results.file.isValid).toBe(true);
        expect(results.search.isValid).toBe(true);
        expect(results.url.isValid).toBe(true);
        expect(results.filename.isValid).toBe(true);
      });
    });

    it('should handle partial input validation', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      const inputs = {
        message: 'Hello world',
        search: 'search query'
      };

      await act(async () => {
        const results = await result.current.batchValidate(inputs);
        
        expect(results.message).toBeDefined();
        expect(results.search).toBeDefined();
        expect(results.file).toBeUndefined();
        expect(results.url).toBeUndefined();
        expect(results.filename).toBeUndefined();
      });
    });
  });

  describe('State Management', () => {
    it('should clear validation results', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        expect(result.current.validationResults.message).toBeDefined();
        
        result.current.clearValidation('message');
        expect(result.current.validationResults.message).toBeUndefined();
      });
    });

    it('should clear all validation results', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        result.current.validateSearch('query');
        
        expect(Object.keys(result.current.validationResults)).toHaveLength(2);
        
        result.current.clearValidation();
        expect(result.current.validationResults).toEqual({});
      });
    });

    it('should get validation status', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        
        const messageStatus = result.current.getValidationStatus('message');
        expect(messageStatus.isValid).toBe(true);
        
        const allStatus = result.current.getValidationStatus();
        expect(allStatus.message).toBeDefined();
      });
    });

    it('should check if all validations are valid', async () => {
      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        result.current.validateSearch('query');
        
        expect(result.current.isAllValid()).toBe(true);
      });
    });

    it('should return false if any validation fails', async () => {
      inputSanitization.sanitizeMessageContent.mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Invalid content'],
        warnings: []
      });

      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        result.current.validateSearch('query');
        
        expect(result.current.isAllValid()).toBe(false);
      });
    });
  });

  describe('Security Recommendations', () => {
    it('should get security recommendations', async () => {
      inputSanitization.sanitizeMessageContent.mockReturnValue({
        isValid: true,
        sanitized: 'clean',
        errors: [],
        warnings: ['Content was modified'],
        recommendations: ['Review content before sending']
      });

      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        
        const recommendations = result.current.getSecurityRecommendations();
        expect(recommendations).toContain('Review content before sending');
        expect(recommendations).toContain('Warning: Content was modified');
      });
    });

    it('should remove duplicate recommendations', async () => {
      inputSanitization.sanitizeMessageContent.mockReturnValue({
        isValid: true,
        sanitized: 'clean',
        errors: [],
        warnings: ['Duplicate warning'],
        recommendations: ['Duplicate recommendation']
      });

      inputSanitization.sanitizeSearchQuery.mockReturnValue({
        isValid: true,
        sanitized: 'clean',
        errors: [],
        warnings: ['Duplicate warning'],
        recommendations: ['Duplicate recommendation']
      });

      const { result } = renderHook(() => useSecurityValidation());

      await act(async () => {
        await result.current.validateMessage('test');
        result.current.validateSearch('query');
        
        const recommendations = result.current.getSecurityRecommendations();
        const duplicateCount = recommendations.filter(r => r === 'Duplicate recommendation').length;
        expect(duplicateCount).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const onValidationError = jest.fn();
      const { result } = renderHook(() => useSecurityValidation({ onValidationError }));

      await act(async () => {
        const batchResult = await result.current.batchValidate({ invalid: 'input' });
        expect(batchResult).toEqual({});
      });
    });
  });

  describe('Real-time Validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should run periodic security audits when enabled', async () => {
      const auditInterval = 5000;
      renderHook(() => useSecurityValidation({ 
        enableRealTimeValidation: true, 
        auditInterval 
      }));

      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(auditInterval);
      });

      expect(securityAudit.performSecurityAudit).toHaveBeenCalled();
    });

    it('should not run periodic audits when disabled', async () => {
      const auditInterval = 5000;
      renderHook(() => useSecurityValidation({ 
        enableRealTimeValidation: false, 
        auditInterval 
      }));

      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(auditInterval);
      });

      expect(securityAudit.performSecurityAudit).not.toHaveBeenCalled();
    });
  });
});