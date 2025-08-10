/**
 * Security Audit Utilities
 * Comprehensive security validation and audit functions for the chat system
 */

// DOMPurify is optional - will use fallback if not available
import { validateEncryptionKey, isEncryptionEnabled } from './encryption';
let DOMPurify;
try {
  DOMPurify = require('dompurify');
} catch (e) {
  // DOMPurify not available, will use fallback
  DOMPurify = null;
}

// Security audit results structure
export const SECURITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

export const AUDIT_CATEGORIES = {
  ENCRYPTION: 'encryption',
  INPUT_VALIDATION: 'input_validation',
  XSS_PREVENTION: 'xss_prevention',
  FILE_UPLOAD: 'file_upload',
  AUTHENTICATION: 'authentication',
  DATA_SANITIZATION: 'data_sanitization'
};

/**
 * Main security audit function
 * @param {Object} context - Audit context (user, chat, message data)
 * @returns {Object} Audit results with findings and recommendations
 */
export const performSecurityAudit = async (context = {}) => {
  const auditResults = {
    timestamp: new Date().toISOString(),
    overallScore: 0,
    findings: [],
    recommendations: [],
    categories: {}
  };

  try {
    // Run all security audits
    const audits = [
      auditEncryptionImplementation(context),
      auditInputValidation(context),
      auditXSSPrevention(context),
      auditFileUploadSecurity(context),
      auditDataSanitization(context),
      auditAuthenticationSecurity(context)
    ];

    const results = await Promise.all(audits);
    
    // Aggregate results
    results.forEach(result => {
      auditResults.findings.push(...result.findings);
      auditResults.recommendations.push(...result.recommendations);
      auditResults.categories[result.category] = result;
    });

    // Calculate overall security score
    auditResults.overallScore = calculateSecurityScore(auditResults.findings);
    
    return auditResults;
  } catch (error) {
    console.error('Security audit failed:', error);
    auditResults.findings.push({
      category: AUDIT_CATEGORIES.AUTHENTICATION,
      level: SECURITY_LEVELS.CRITICAL,
      message: 'Security audit system failure',
      details: error.message
    });
    return auditResults;
  }
};

/**
 * Audit encryption implementation
 */
export const auditEncryptionImplementation = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Check if encryption is enabled
    const encryptionEnabled = isEncryptionEnabled();
    if (!encryptionEnabled) {
      findings.push({
        level: SECURITY_LEVELS.CRITICAL,
        message: 'End-to-end encryption is not enabled',
        details: 'Messages are transmitted without encryption'
      });
      recommendations.push('Enable end-to-end encryption for all messages');
    }

    // Validate encryption keys
    if (context.encryptionKey) {
      const keyValidation = validateEncryptionKey(context.encryptionKey);
      if (!keyValidation.isValid) {
        findings.push({
          level: SECURITY_LEVELS.HIGH,
          message: 'Invalid encryption key detected',
          details: keyValidation.errors.join(', ')
        });
        recommendations.push('Regenerate encryption keys using secure methods');
      }
    }

    // Check for key storage security
    const keyStorage = localStorage.getItem('chat_encryption_key');
    if (keyStorage && !keyStorage.startsWith('encrypted:')) {
      findings.push({
        level: SECURITY_LEVELS.HIGH,
        message: 'Encryption keys stored in plain text',
        details: 'Keys should be encrypted before local storage'
      });
      recommendations.push('Implement secure key storage with additional encryption layer');
    }

    // Verify Web Crypto API availability
    if (!window.crypto || !window.crypto.subtle) {
      findings.push({
        level: SECURITY_LEVELS.CRITICAL,
        message: 'Web Crypto API not available',
        details: 'Cannot perform client-side encryption'
      });
      recommendations.push('Ensure HTTPS and modern browser support');
    }

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.HIGH,
      message: 'Encryption audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.ENCRYPTION,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Audit input validation
 */
export const auditInputValidation = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Test message content validation
    if (context.messageContent) {
      const testInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        '\'; DROP TABLE messages; --'
      ];

      testInputs.forEach(testInput => {
        const sanitized = sanitizeMessageContent(testInput);
        if (sanitized === testInput) {
          findings.push({
            level: SECURITY_LEVELS.HIGH,
            message: 'Dangerous input not sanitized',
            details: `Input: ${testInput.substring(0, 50)}...`
          });
        }
      });
    }

    // Check for length validation
    const maxMessageLength = 10000; // Should match backend validation
    if (context.messageContent && context.messageContent.length > maxMessageLength) {
      findings.push({
        level: SECURITY_LEVELS.MEDIUM,
        message: 'Message length exceeds safe limits',
        details: `Message length: ${context.messageContent.length}`
      });
      recommendations.push('Implement client-side length validation');
    }

    // Validate file upload inputs
    if (context.fileData) {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
      const filename = context.fileData.name || '';
      
      dangerousExtensions.forEach(ext => {
        if (filename.toLowerCase().endsWith(ext)) {
          findings.push({
            level: SECURITY_LEVELS.HIGH,
            message: 'Dangerous file extension detected',
            details: `File: ${filename}`
          });
          recommendations.push('Block executable file uploads');
        }
      });
    }

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.MEDIUM,
      message: 'Input validation audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.INPUT_VALIDATION,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Audit XSS prevention measures
 */
export const auditXSSPrevention = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Check if DOMPurify is available and configured
    if (!DOMPurify) {
      findings.push({
        level: SECURITY_LEVELS.CRITICAL,
        message: 'DOMPurify not available',
        details: 'No XSS protection library detected'
      });
      recommendations.push('Install and configure DOMPurify for XSS prevention');
    } else {
      // Test DOMPurify configuration
      const testXSS = '<img src="x" onerror="alert(1)">';
      const sanitized = DOMPurify.sanitize(testXSS);
      
      if (sanitized.includes('onerror') || sanitized.includes('alert')) {
        findings.push({
          level: SECURITY_LEVELS.HIGH,
          message: 'DOMPurify not properly configured',
          details: 'XSS vectors not being sanitized'
        });
        recommendations.push('Review and strengthen DOMPurify configuration');
      }
    }

    // Check Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      findings.push({
        level: SECURITY_LEVELS.MEDIUM,
        message: 'No Content Security Policy detected',
        details: 'CSP headers provide additional XSS protection'
      });
      recommendations.push('Implement Content Security Policy headers');
    }

    // Check for dangerous innerHTML usage
    const scriptTags = document.querySelectorAll('script');
    scriptTags.forEach(script => {
      if (script.innerHTML.includes('innerHTML') && script.innerHTML.includes('user')) {
        findings.push({
          level: SECURITY_LEVELS.MEDIUM,
          message: 'Potential unsafe innerHTML usage detected',
          details: 'Review dynamic content insertion'
        });
      }
    });

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.MEDIUM,
      message: 'XSS prevention audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.XSS_PREVENTION,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Audit file upload security
 */
export const auditFileUploadSecurity = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Check file size limits
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (context.fileData && context.fileData.size > maxFileSize) {
      findings.push({
        level: SECURITY_LEVELS.MEDIUM,
        message: 'File size exceeds safe limits',
        details: `File size: ${(context.fileData.size / 1024 / 1024).toFixed(2)}MB`
      });
      recommendations.push('Implement file size validation');
    }

    // Check MIME type validation
    if (context.fileData) {
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedMimeTypes.includes(context.fileData.type)) {
        findings.push({
          level: SECURITY_LEVELS.HIGH,
          message: 'Potentially dangerous file type',
          details: `MIME type: ${context.fileData.type}`
        });
        recommendations.push('Restrict file uploads to safe MIME types');
      }
    }

    // Check for virus scanning capability
    const hasVirusScanning = context.hasVirusScanning || false;
    if (!hasVirusScanning) {
      findings.push({
        level: SECURITY_LEVELS.HIGH,
        message: 'No virus scanning detected',
        details: 'Uploaded files should be scanned for malware'
      });
      recommendations.push('Implement server-side virus scanning for uploads');
    }

    // Check file name sanitization
    if (context.fileData && context.fileData.name) {
      const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (dangerousChars.test(context.fileData.name)) {
        findings.push({
          level: SECURITY_LEVELS.MEDIUM,
          message: 'Dangerous characters in filename',
          details: `Filename: ${context.fileData.name}`
        });
        recommendations.push('Sanitize filenames before storage');
      }
    }

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.MEDIUM,
      message: 'File upload security audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.FILE_UPLOAD,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Audit data sanitization
 */
export const auditDataSanitization = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Check message content sanitization
    if (context.messageContent) {
      const unsafePatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ];

      unsafePatterns.forEach(pattern => {
        if (pattern.test(context.messageContent)) {
          findings.push({
            level: SECURITY_LEVELS.HIGH,
            message: 'Unsafe content pattern detected',
            details: 'Message contains potentially dangerous content'
          });
        }
      });
    }

    // Check URL sanitization
    if (context.urls) {
      context.urls.forEach(url => {
        try {
          const urlObj = new URL(url);
          if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
            findings.push({
              level: SECURITY_LEVELS.HIGH,
              message: 'Dangerous URL protocol detected',
              details: `URL: ${url.substring(0, 50)}...`
            });
          }
        } catch (e) {
          findings.push({
            level: SECURITY_LEVELS.MEDIUM,
            message: 'Invalid URL format',
            details: `URL: ${url.substring(0, 50)}...`
          });
        }
      });
    }

    // Check for SQL injection patterns (even though we use MongoDB)
    if (context.searchQuery) {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(--|\/\*|\*\/)/g
      ];

      sqlPatterns.forEach(pattern => {
        if (pattern.test(context.searchQuery)) {
          findings.push({
            level: SECURITY_LEVELS.MEDIUM,
            message: 'Potential injection pattern in search query',
            details: 'Search query contains suspicious patterns'
          });
        }
      });
    }

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.MEDIUM,
      message: 'Data sanitization audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.DATA_SANITIZATION,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Audit authentication security
 */
export const auditAuthenticationSecurity = async (context) => {
  const findings = [];
  const recommendations = [];

  try {
    // Check for secure token storage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token && !token.startsWith('Bearer ')) {
      findings.push({
        level: SECURITY_LEVELS.MEDIUM,
        message: 'Authentication token format issue',
        details: 'Token should follow Bearer format'
      });
    }

    // Check token expiration
    if (context.tokenData) {
      const now = Date.now() / 1000;
      if (context.tokenData.exp && context.tokenData.exp < now) {
        findings.push({
          level: SECURITY_LEVELS.HIGH,
          message: 'Expired authentication token in use',
          details: 'Token expired, user should re-authenticate'
        });
        recommendations.push('Implement automatic token refresh');
      }
    }

    // Check for HTTPS usage
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      findings.push({
        level: SECURITY_LEVELS.CRITICAL,
        message: 'Application not served over HTTPS',
        details: 'Authentication tokens transmitted over insecure connection'
      });
      recommendations.push('Enforce HTTPS for all authentication flows');
    }

    // Check session timeout
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      const maxInactivity = 30 * 60 * 1000; // 30 minutes
      
      if (timeSinceActivity > maxInactivity) {
        findings.push({
          level: SECURITY_LEVELS.MEDIUM,
          message: 'Session timeout not enforced',
          details: 'User session should expire after inactivity'
        });
        recommendations.push('Implement automatic session timeout');
      }
    }

  } catch (error) {
    findings.push({
      level: SECURITY_LEVELS.MEDIUM,
      message: 'Authentication security audit failed',
      details: error.message
    });
  }

  return {
    category: AUDIT_CATEGORIES.AUTHENTICATION,
    findings,
    recommendations,
    score: calculateCategoryScore(findings)
  };
};

/**
 * Sanitize message content
 */
export const sanitizeMessageContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Use DOMPurify if available
  if (DOMPurify) {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
      ALLOWED_ATTR: []
    });
  }
  
  // Fallback sanitization
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Calculate security score for a category
 */
const calculateCategoryScore = (findings) => {
  if (findings.length === 0) return 100;
  
  const weights = {
    [SECURITY_LEVELS.CRITICAL]: 40,
    [SECURITY_LEVELS.HIGH]: 25,
    [SECURITY_LEVELS.MEDIUM]: 15,
    [SECURITY_LEVELS.LOW]: 5,
    [SECURITY_LEVELS.INFO]: 1
  };
  
  const totalDeduction = findings.reduce((sum, finding) => {
    return sum + (weights[finding.level] || 0);
  }, 0);
  
  return Math.max(0, 100 - totalDeduction);
};

/**
 * Calculate overall security score
 */
const calculateSecurityScore = (allFindings) => {
  const criticalCount = allFindings.filter(f => f.level === SECURITY_LEVELS.CRITICAL).length;
  const highCount = allFindings.filter(f => f.level === SECURITY_LEVELS.HIGH).length;
  const mediumCount = allFindings.filter(f => f.level === SECURITY_LEVELS.MEDIUM).length;
  
  // Critical issues significantly impact score
  if (criticalCount > 0) return Math.max(0, 40 - (criticalCount * 20));
  if (highCount > 2) return Math.max(20, 70 - (highCount * 10));
  if (mediumCount > 5) return Math.max(40, 80 - (mediumCount * 5));
  
  return calculateCategoryScore(allFindings);
};

/**
 * Generate security report
 */
export const generateSecurityReport = (auditResults) => {
  const report = {
    summary: {
      timestamp: auditResults.timestamp,
      overallScore: auditResults.overallScore,
      riskLevel: getRiskLevel(auditResults.overallScore),
      totalFindings: auditResults.findings.length,
      criticalFindings: auditResults.findings.filter(f => f.level === SECURITY_LEVELS.CRITICAL).length,
      highFindings: auditResults.findings.filter(f => f.level === SECURITY_LEVELS.HIGH).length
    },
    categories: auditResults.categories,
    recommendations: auditResults.recommendations,
    nextAuditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };
  
  return report;
};

/**
 * Get risk level based on security score
 */
const getRiskLevel = (score) => {
  if (score >= 90) return 'LOW';
  if (score >= 70) return 'MEDIUM';
  if (score >= 50) return 'HIGH';
  return 'CRITICAL';
};

export default {
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
};