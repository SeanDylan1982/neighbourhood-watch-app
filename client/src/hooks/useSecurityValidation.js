/**
 * Security Validation Hook
 * Provides security validation functionality for chat components
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  sanitizeMessageContent, 
  sanitizeFilename, 
  validateFileUpload,
  sanitizeSearchQuery,
  sanitizeUrl 
} from '../utils/inputSanitization';
import { validateFileUploadSecurity } from '../utils/fileUploadSecurity';
import { performSecurityAudit } from '../utils/securityAudit';

/**
 * Security validation hook
 * @param {Object} options - Configuration options
 * @returns {Object} Security validation functions and state
 */
export const useSecurityValidation = (options = {}) => {
  const [validationResults, setValidationResults] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [securityScore, setSecurityScore] = useState(100);
  const [lastAudit, setLastAudit] = useState(null);

  const {
    enableRealTimeValidation = true,
    auditInterval = 5 * 60 * 1000, // 5 minutes
    onValidationError = null,
    onSecurityIssue = null
  } = options;

  /**
   * Validate message content
   */
  const validateMessage = useCallback(async (content, options = {}) => {
    if (!content) return { isValid: true, sanitized: '', errors: [], warnings: [] };

    try {
      const result = sanitizeMessageContent(content, options);
      
      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        message: result
      }));

      // Trigger security issue callback if needed
      if (!result.isValid && onSecurityIssue) {
        onSecurityIssue({
          type: 'message_validation',
          severity: 'medium',
          details: result.errors.join(', ')
        });
      }

      return result;
    } catch (error) {
      const errorResult = {
        isValid: false,
        sanitized: '',
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };

      if (onValidationError) {
        onValidationError(error);
      }

      return errorResult;
    }
  }, [onSecurityIssue, onValidationError]);

  /**
   * Validate file upload
   */
  const validateFile = useCallback(async (file, options = {}) => {
    if (!file) return { isValid: false, errors: ['No file provided'] };

    setIsValidating(true);

    try {
      // Basic validation
      const basicResult = validateFileUpload(file, options);
      
      // Advanced security validation
      const securityResult = await validateFileUploadSecurity(file, options);
      
      const combinedResult = {
        isValid: basicResult.isValid && securityResult.isValid,
        errors: [...basicResult.errors, ...securityResult.errors],
        warnings: [...basicResult.warnings, ...securityResult.warnings],
        sanitizedName: securityResult.sanitizedFilename || basicResult.sanitizedName,
        securityScore: securityResult.securityScore,
        detectedType: securityResult.detectedType,
        recommendations: securityResult.recommendations
      };

      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        file: combinedResult
      }));

      // Trigger security issue callback for high-risk files
      if (securityResult.securityScore < 50 && onSecurityIssue) {
        onSecurityIssue({
          type: 'file_upload',
          severity: 'high',
          details: `File security score: ${securityResult.securityScore}`,
          recommendations: securityResult.recommendations
        });
      }

      return combinedResult;
    } catch (error) {
      const errorResult = {
        isValid: false,
        errors: [`File validation failed: ${error.message}`],
        warnings: [],
        sanitizedName: file.name,
        securityScore: 0,
        detectedType: null,
        recommendations: ['File validation failed - do not upload']
      };

      if (onValidationError) {
        onValidationError(error);
      }

      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [onSecurityIssue, onValidationError]);

  /**
   * Validate search query
   */
  const validateSearch = useCallback((query) => {
    if (!query) return { isValid: true, sanitized: '', errors: [], warnings: [] };

    try {
      const result = sanitizeSearchQuery(query);
      
      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        search: result
      }));

      // Trigger security issue callback for dangerous patterns
      if (result.warnings.length > 0 && onSecurityIssue) {
        onSecurityIssue({
          type: 'search_validation',
          severity: 'medium',
          details: result.warnings.join(', ')
        });
      }

      return result;
    } catch (error) {
      const errorResult = {
        isValid: false,
        sanitized: '',
        errors: [`Search validation failed: ${error.message}`],
        warnings: []
      };

      if (onValidationError) {
        onValidationError(error);
      }

      return errorResult;
    }
  }, [onSecurityIssue, onValidationError]);

  /**
   * Validate URL
   */
  const validateUrlSafety = useCallback((url) => {
    if (!url) return { isValid: true, sanitized: '', errors: [], warnings: [] };

    try {
      const result = sanitizeUrl(url);
      
      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        url: result
      }));

      // Trigger security issue callback for dangerous URLs
      if (!result.isValid && onSecurityIssue) {
        onSecurityIssue({
          type: 'url_validation',
          severity: 'high',
          details: result.errors.join(', ')
        });
      }

      return result;
    } catch (error) {
      const errorResult = {
        isValid: false,
        sanitized: '',
        errors: [`URL validation failed: ${error.message}`],
        warnings: []
      };

      if (onValidationError) {
        onValidationError(error);
      }

      return errorResult;
    }
  }, [onSecurityIssue, onValidationError]);

  /**
   * Validate filename
   */
  const validateFilename = useCallback((filename) => {
    if (!filename) return { isValid: false, sanitized: '', errors: ['Filename required'] };

    try {
      const result = sanitizeFilename(filename);
      
      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        filename: result
      }));

      return result;
    } catch (error) {
      const errorResult = {
        isValid: false,
        sanitized: '',
        errors: [`Filename validation failed: ${error.message}`],
        warnings: []
      };

      if (onValidationError) {
        onValidationError(error);
      }

      return errorResult;
    }
  }, [onValidationError]);

  /**
   * Perform comprehensive security audit
   */
  const runSecurityAudit = useCallback(async (context = {}) => {
    setIsValidating(true);

    try {
      const auditResults = await performSecurityAudit(context);
      
      setSecurityScore(auditResults.overallScore);
      setLastAudit({
        timestamp: new Date(),
        results: auditResults
      });

      // Trigger security issue callback for critical findings
      const criticalFindings = auditResults.findings.filter(f => f.level === 'critical');
      if (criticalFindings.length > 0 && onSecurityIssue) {
        onSecurityIssue({
          type: 'security_audit',
          severity: 'critical',
          details: `${criticalFindings.length} critical security issues found`,
          findings: criticalFindings
        });
      }

      return auditResults;
    } catch (error) {
      if (onValidationError) {
        onValidationError(error);
      }
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [onSecurityIssue, onValidationError]);

  /**
   * Batch validate multiple inputs
   */
  const batchValidate = useCallback(async (inputs) => {
    const results = {};

    try {
      // Validate each input type
      if (inputs.message) {
        results.message = await validateMessage(inputs.message);
      }

      if (inputs.file) {
        results.file = await validateFile(inputs.file);
      }

      if (inputs.search) {
        results.search = validateSearch(inputs.search);
      }

      if (inputs.url) {
        results.url = validateUrlSafety(inputs.url);
      }

      if (inputs.filename) {
        results.filename = validateFilename(inputs.filename);
      }

      // Update validation results
      setValidationResults(prev => ({
        ...prev,
        ...results
      }));

      return results;
    } catch (error) {
      if (onValidationError) {
        onValidationError(error);
      }
      throw error;
    }
  }, [validateMessage, validateFile, validateSearch, validateUrlSafety, validateFilename, onValidationError]);

  /**
   * Clear validation results
   */
  const clearValidation = useCallback((type = null) => {
    if (type) {
      setValidationResults(prev => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
    } else {
      setValidationResults({});
    }
  }, []);

  /**
   * Get validation status
   */
  const getValidationStatus = useCallback((type = null) => {
    if (type) {
      return validationResults[type] || null;
    }
    return validationResults;
  }, [validationResults]);

  /**
   * Check if all validations are passing
   */
  const isAllValid = useCallback(() => {
    return Object.values(validationResults).every(result => result.isValid);
  }, [validationResults]);

  /**
   * Get security recommendations
   */
  const getSecurityRecommendations = useCallback(() => {
    const recommendations = [];
    
    Object.values(validationResults).forEach(result => {
      if (result.recommendations) {
        recommendations.push(...result.recommendations);
      }
      if (result.warnings && result.warnings.length > 0) {
        recommendations.push(...result.warnings.map(w => `Warning: ${w}`));
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }, [validationResults]);

  // Periodic security audit
  useEffect(() => {
    if (!enableRealTimeValidation || !auditInterval) return;

    const interval = setInterval(() => {
      runSecurityAudit().catch(console.error);
    }, auditInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeValidation, auditInterval, runSecurityAudit]);

  return {
    // Validation functions
    validateMessage,
    validateFile,
    validateSearch,
    validateUrlSafety,
    validateFilename,
    batchValidate,
    runSecurityAudit,
    
    // State management
    clearValidation,
    getValidationStatus,
    
    // Status checks
    isAllValid,
    isValidating,
    
    // Security metrics
    securityScore,
    lastAudit,
    getSecurityRecommendations,
    
    // Validation results
    validationResults
  };
};

export default useSecurityValidation;