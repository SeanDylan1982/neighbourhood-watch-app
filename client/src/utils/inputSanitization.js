/**
 * Input Sanitization Utilities
 * Comprehensive input validation and sanitization for chat system
 */

// DOMPurify is optional - will use fallback if not available
let DOMPurify;
try {
  DOMPurify = require('dompurify');
} catch (e) {
  // DOMPurify not available, will use fallback
  DOMPurify = null;
}

// Configuration for different content types
const SANITIZATION_CONFIGS = {
  MESSAGE: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    MAX_LENGTH: 10000,
    ALLOW_EMPTY: false
  },
  FILENAME: {
    MAX_LENGTH: 255,
    FORBIDDEN_CHARS: /[<>:"/\\|?*\x00-\x1f]/g,
    FORBIDDEN_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar']
  },
  SEARCH_QUERY: {
    MAX_LENGTH: 500,
    FORBIDDEN_PATTERNS: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(--|\/\*|\*\/)/g,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
    ]
  },
  URL: {
    ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:', 'tel:'],
    MAX_LENGTH: 2048
  },
  USER_INPUT: {
    MAX_LENGTH: 1000,
    FORBIDDEN_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ]
  }
};

/**
 * Sanitize message content for display
 * @param {string} content - Raw message content
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized content and validation result
 */
export const sanitizeMessageContent = (content, options = {}) => {
  const config = { ...SANITIZATION_CONFIGS.MESSAGE, ...options };
  const result = {
    sanitized: '',
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Basic validation
    if (!content) {
      if (!config.ALLOW_EMPTY) {
        result.isValid = false;
        result.errors.push('Message content cannot be empty');
      }
      return result;
    }

    if (typeof content !== 'string') {
      result.isValid = false;
      result.errors.push('Message content must be a string');
      return result;
    }

    // Length validation
    if (content.length > config.MAX_LENGTH) {
      result.isValid = false;
      result.errors.push(`Message exceeds maximum length of ${config.MAX_LENGTH} characters`);
      return result;
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        result.warnings.push('Potentially dangerous content detected and removed');
      }
    });

    // Sanitize using DOMPurify
    if (DOMPurify) {
      result.sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: config.ALLOWED_TAGS,
        ALLOWED_ATTR: config.ALLOWED_ATTR,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false
      });
    } else {
      // Fallback sanitization
      result.sanitized = content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
      
      result.warnings.push('Using fallback sanitization - DOMPurify not available');
    }

    // Additional validation
    if (result.sanitized !== content) {
      result.warnings.push('Content was modified during sanitization');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Sanitization failed: ${error.message}`);
    result.sanitized = '';
  }

  return result;
};

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {Object} Sanitized filename and validation result
 */
export const sanitizeFilename = (filename) => {
  const config = SANITIZATION_CONFIGS.FILENAME;
  const result = {
    sanitized: '',
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    if (!filename || typeof filename !== 'string') {
      result.isValid = false;
      result.errors.push('Filename must be a non-empty string');
      return result;
    }

    // Length validation
    if (filename.length > config.MAX_LENGTH) {
      result.isValid = false;
      result.errors.push(`Filename exceeds maximum length of ${config.MAX_LENGTH} characters`);
      return result;
    }

    // Check for forbidden extensions
    const lowerFilename = filename.toLowerCase();
    const hasForbiddenExtension = config.FORBIDDEN_EXTENSIONS.some(ext => 
      lowerFilename.endsWith(ext)
    );

    if (hasForbiddenExtension) {
      result.isValid = false;
      result.errors.push('File type not allowed for security reasons');
      return result;
    }

    // Remove forbidden characters
    result.sanitized = filename.replace(config.FORBIDDEN_CHARS, '_');

    // Remove leading/trailing dots and spaces
    result.sanitized = result.sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

    // Ensure filename is not empty after sanitization
    if (!result.sanitized) {
      result.sanitized = 'file_' + Date.now();
      result.warnings.push('Filename was empty after sanitization, generated new name');
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = result.sanitized.split('.')[0].toUpperCase();
    
    if (reservedNames.includes(nameWithoutExt)) {
      result.sanitized = 'file_' + result.sanitized;
      result.warnings.push('Reserved filename detected, prefix added');
    }

    if (result.sanitized !== filename) {
      result.warnings.push('Filename was modified for security');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Filename sanitization failed: ${error.message}`);
    result.sanitized = 'file_' + Date.now();
  }

  return result;
};

/**
 * Sanitize search query
 * @param {string} query - Search query
 * @returns {Object} Sanitized query and validation result
 */
export const sanitizeSearchQuery = (query) => {
  const config = SANITIZATION_CONFIGS.SEARCH_QUERY;
  const result = {
    sanitized: '',
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    if (!query) {
      result.sanitized = '';
      return result;
    }

    if (typeof query !== 'string') {
      result.isValid = false;
      result.errors.push('Search query must be a string');
      return result;
    }

    // Length validation
    if (query.length > config.MAX_LENGTH) {
      result.isValid = false;
      result.errors.push(`Search query exceeds maximum length of ${config.MAX_LENGTH} characters`);
      return result;
    }

    // Check for forbidden patterns
    let hasViolation = false;
    config.FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(query)) {
        hasViolation = true;
        result.warnings.push('Potentially dangerous search pattern detected');
      }
    });

    if (hasViolation) {
      // Remove dangerous patterns
      result.sanitized = query;
      config.FORBIDDEN_PATTERNS.forEach(pattern => {
        result.sanitized = result.sanitized.replace(pattern, '');
      });
    } else {
      result.sanitized = query;
    }

    // Basic HTML encoding for safety
    result.sanitized = result.sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Trim whitespace
    result.sanitized = result.sanitized.trim();

    if (result.sanitized !== query) {
      result.warnings.push('Search query was modified for security');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Search query sanitization failed: ${error.message}`);
    result.sanitized = '';
  }

  return result;
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result and sanitized URL
 */
export const sanitizeUrl = (url) => {
  const config = SANITIZATION_CONFIGS.URL;
  const result = {
    sanitized: '',
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    if (!url || typeof url !== 'string') {
      result.isValid = false;
      result.errors.push('URL must be a non-empty string');
      return result;
    }

    // Length validation
    if (url.length > config.MAX_LENGTH) {
      result.isValid = false;
      result.errors.push(`URL exceeds maximum length of ${config.MAX_LENGTH} characters`);
      return result;
    }

    // Parse URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      result.isValid = false;
      result.errors.push('Invalid URL format');
      return result;
    }

    // Check protocol
    if (!config.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      result.isValid = false;
      result.errors.push(`Protocol ${urlObj.protocol} not allowed`);
      return result;
    }

    // Check for dangerous protocols
    if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
      result.isValid = false;
      result.errors.push('Dangerous URL protocol detected');
      return result;
    }

    // Sanitize URL components
    result.sanitized = urlObj.toString();

    // Additional security checks
    if (result.sanitized.includes('<script') || result.sanitized.includes('javascript:')) {
      result.isValid = false;
      result.errors.push('URL contains dangerous content');
      return result;
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`URL sanitization failed: ${error.message}`);
    result.sanitized = '';
  }

  return result;
};

/**
 * Sanitize general user input
 * @param {string} input - User input
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized input and validation result
 */
export const sanitizeUserInput = (input, options = {}) => {
  const config = { ...SANITIZATION_CONFIGS.USER_INPUT, ...options };
  const result = {
    sanitized: '',
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    if (!input) {
      result.sanitized = '';
      return result;
    }

    if (typeof input !== 'string') {
      result.isValid = false;
      result.errors.push('Input must be a string');
      return result;
    }

    // Length validation
    if (input.length > config.MAX_LENGTH) {
      result.isValid = false;
      result.errors.push(`Input exceeds maximum length of ${config.MAX_LENGTH} characters`);
      return result;
    }

    // Check for forbidden patterns
    let hasViolation = false;
    config.FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        hasViolation = true;
        result.warnings.push('Potentially dangerous content detected');
      }
    });

    // Sanitize content
    if (DOMPurify) {
      result.sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    } else {
      // Fallback sanitization
      result.sanitized = input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    // Trim whitespace
    result.sanitized = result.sanitized.trim();

    if (result.sanitized !== input) {
      result.warnings.push('Input was modified during sanitization');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Input sanitization failed: ${error.message}`);
    result.sanitized = '';
  }

  return result;
};

/**
 * Validate file upload
 * @param {File} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFileUpload = (file, options = {}) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedName: ''
  };

  try {
    if (!file || !(file instanceof File)) {
      result.isValid = false;
      result.errors.push('Invalid file object');
      return result;
    }

    // File size validation
    const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // MIME type validation
    const allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
      'application/pdf', 'text/plain',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} not allowed`);
    }

    // Filename validation
    const filenameResult = sanitizeFilename(file.name);
    if (!filenameResult.isValid) {
      result.isValid = false;
      result.errors.push(...filenameResult.errors);
    } else {
      result.sanitizedName = filenameResult.sanitized;
      result.warnings.push(...filenameResult.warnings);
    }

    // Additional security checks
    if (file.name && file.name.includes('..')) {
      result.isValid = false;
      result.errors.push('Filename contains path traversal characters');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`File validation failed: ${error.message}`);
  }

  return result;
};

/**
 * Batch sanitize multiple inputs
 * @param {Object} inputs - Object with input values
 * @param {Object} configs - Sanitization configs for each input
 * @returns {Object} Sanitized inputs and validation results
 */
export const batchSanitize = (inputs, configs = {}) => {
  const results = {};
  
  Object.keys(inputs).forEach(key => {
    const input = inputs[key];
    const config = configs[key] || {};
    
    switch (config.type) {
      case 'message':
        results[key] = sanitizeMessageContent(input, config.options);
        break;
      case 'filename':
        results[key] = sanitizeFilename(input);
        break;
      case 'search':
        results[key] = sanitizeSearchQuery(input);
        break;
      case 'url':
        results[key] = sanitizeUrl(input);
        break;
      default:
        results[key] = sanitizeUserInput(input, config.options);
    }
  });
  
  return results;
};

export default {
  sanitizeMessageContent,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeUrl,
  sanitizeUserInput,
  validateFileUpload,
  batchSanitize,
  SANITIZATION_CONFIGS
};