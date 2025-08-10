/**
 * File Upload Security Utilities
 * Comprehensive security validation for file uploads
 */

import { sanitizeFilename } from './inputSanitization';

// File type configurations
const FILE_SECURITY_CONFIG = {
  // Maximum file sizes by type (in bytes)
  MAX_SIZES: {
    image: 10 * 1024 * 1024,    // 10MB
    video: 100 * 1024 * 1024,   // 100MB
    audio: 50 * 1024 * 1024,    // 50MB
    document: 25 * 1024 * 1024, // 25MB
    default: 50 * 1024 * 1024   // 50MB
  },

  // Allowed MIME types
  ALLOWED_MIME_TYPES: {
    image: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ],
    video: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv'
    ],
    audio: [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/m4a'
    ],
    document: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  },

  // Dangerous file extensions (always blocked)
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
    '.js', '.jse', '.jar', '.msi', '.dll', '.app', '.deb', '.rpm',
    '.dmg', '.pkg', '.run', '.bin', '.sh', '.ps1', '.psm1', '.psd1',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi'
  ],

  // Magic number signatures for file type validation
  MAGIC_NUMBERS: {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
    'audio/mp3': [0x49, 0x44, 0x33], // ID3 tag
    'application/zip': [0x50, 0x4B, 0x03, 0x04]
  }
};

/**
 * Comprehensive file security validation
 * @param {File} file - File object to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
export const validateFileUploadSecurity = async (file, options = {}) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    securityScore: 100,
    sanitizedFilename: '',
    detectedType: null,
    recommendations: []
  };

  try {
    // Basic file object validation
    if (!file || !(file instanceof File)) {
      result.isValid = false;
      result.errors.push('Invalid file object provided');
      result.securityScore = 0;
      return result;
    }

    // Filename security validation
    const filenameResult = sanitizeFilename(file.name);
    result.sanitizedFilename = filenameResult.sanitized;
    result.warnings.push(...filenameResult.warnings);
    
    if (!filenameResult.isValid) {
      result.isValid = false;
      result.errors.push(...filenameResult.errors);
      result.securityScore -= 30;
    }

    // File extension validation
    const extensionResult = validateFileExtension(file.name);
    if (!extensionResult.isValid) {
      result.isValid = false;
      result.errors.push(...extensionResult.errors);
      result.securityScore -= 50;
    }

    // File size validation
    const sizeResult = validateFileSize(file);
    if (!sizeResult.isValid) {
      result.isValid = false;
      result.errors.push(...sizeResult.errors);
      result.securityScore -= 20;
    }

    // MIME type validation
    const mimeResult = validateMimeType(file);
    if (!mimeResult.isValid) {
      result.isValid = false;
      result.errors.push(...mimeResult.errors);
      result.securityScore -= 25;
    }

    // Magic number validation (file signature)
    const magicResult = await validateMagicNumbers(file);
    if (!magicResult.isValid) {
      result.warnings.push(...magicResult.warnings);
      result.securityScore -= 15;
    }
    result.detectedType = magicResult.detectedType;

    // Content-based security checks
    const contentResult = await performContentSecurityChecks(file);
    result.warnings.push(...contentResult.warnings);
    result.securityScore -= contentResult.securityDeduction;

    // Generate recommendations
    result.recommendations = generateSecurityRecommendations(result);

    // Ensure security score doesn't go below 0
    result.securityScore = Math.max(0, result.securityScore);

  } catch (error) {
    result.isValid = false;
    result.errors.push(`File validation failed: ${error.message}`);
    result.securityScore = 0;
  }

  return result;
};

/**
 * Validate file extension
 * @param {string} filename - Filename to validate
 * @returns {Object} Validation result
 */
const validateFileExtension = (filename) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!filename || typeof filename !== 'string') {
    result.isValid = false;
    result.errors.push('Invalid filename provided');
    return result;
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  // Check for dangerous extensions
  if (FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS.includes(extension)) {
    result.isValid = false;
    result.errors.push(`File extension ${extension} is not allowed for security reasons`);
    return result;
  }

  // Check for double extensions (potential bypass attempt)
  const parts = filename.toLowerCase().split('.');
  if (parts.length > 2) {
    const secondLastExt = '.' + parts[parts.length - 2];
    if (FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS.includes(secondLastExt)) {
      result.isValid = false;
      result.errors.push('Double file extension detected - potential security risk');
      return result;
    }
  }

  // Check for no extension
  if (!extension || extension === filename) {
    result.warnings.push('File has no extension - type detection may be unreliable');
  }

  return result;
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
const validateFileSize = (file) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (file.size === 0) {
    result.isValid = false;
    result.errors.push('File is empty');
    return result;
  }

  // Determine file type category
  const fileType = getFileTypeCategory(file.type);
  const maxSize = FILE_SECURITY_CONFIG.MAX_SIZES[fileType] || FILE_SECURITY_CONFIG.MAX_SIZES.default;

  if (file.size > maxSize) {
    result.isValid = false;
    result.errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
    return result;
  }

  // Warning for large files
  const warningThreshold = maxSize * 0.8;
  if (file.size > warningThreshold) {
    result.warnings.push(`Large file detected (${formatFileSize(file.size)}) - may impact performance`);
  }

  return result;
};

/**
 * Validate MIME type
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
const validateMimeType = (file) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!file.type) {
    result.warnings.push('No MIME type detected - relying on file extension');
    return result;
  }

  // Check if MIME type is in allowed list
  const isAllowed = Object.values(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES)
    .flat()
    .includes(file.type);

  if (!isAllowed) {
    result.isValid = false;
    result.errors.push(`MIME type ${file.type} is not allowed`);
    return result;
  }

  // Check for MIME type spoofing (extension doesn't match MIME type)
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const expectedMimeTypes = getMimeTypesForExtension(extension);
  
  if (expectedMimeTypes.length > 0 && !expectedMimeTypes.includes(file.type)) {
    result.warnings.push('MIME type does not match file extension - potential spoofing attempt');
  }

  return result;
};

/**
 * Validate file magic numbers (file signatures)
 * @param {File} file - File to validate
 * @returns {Promise<Object>} Validation result
 */
const validateMagicNumbers = async (file) => {
  const result = {
    isValid: true,
    warnings: [],
    detectedType: null
  };

  try {
    // Read first 16 bytes of file
    const buffer = await readFileBytes(file, 0, 16);
    const bytes = new Uint8Array(buffer);

    // Check against known magic numbers
    let matchFound = false;
    for (const [mimeType, signature] of Object.entries(FILE_SECURITY_CONFIG.MAGIC_NUMBERS)) {
      if (matchesSignature(bytes, signature)) {
        result.detectedType = mimeType;
        matchFound = true;
        
        // Check if detected type matches declared MIME type
        if (file.type && file.type !== mimeType) {
          result.warnings.push(`File signature indicates ${mimeType} but MIME type is ${file.type}`);
        }
        break;
      }
    }

    if (!matchFound && file.type) {
      result.warnings.push('Could not verify file signature - type detection inconclusive');
    }

  } catch (error) {
    result.warnings.push(`Magic number validation failed: ${error.message}`);
  }

  return result;
};

/**
 * Perform content-based security checks
 * @param {File} file - File to validate
 * @returns {Promise<Object>} Security check result
 */
const performContentSecurityChecks = async (file) => {
  const result = {
    warnings: [],
    securityDeduction: 0
  };

  try {
    // For text files, check for suspicious content
    if (file.type.startsWith('text/') || file.type === 'application/javascript') {
      const content = await readFileAsText(file);
      
      // Check for script tags
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
        result.warnings.push('Script tags detected in file content');
        result.securityDeduction += 20;
      }

      // Check for suspicious JavaScript
      const suspiciousPatterns = [
        /eval\s*\(/gi,
        /document\.write/gi,
        /innerHTML\s*=/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];

      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          result.warnings.push('Potentially dangerous JavaScript patterns detected');
          result.securityDeduction += 10;
        }
      });
    }

    // For images, check for embedded content
    if (file.type.startsWith('image/')) {
      const buffer = await readFileBytes(file, 0, Math.min(file.size, 1024));
      const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      
      // Check for embedded scripts in image metadata
      if (content.includes('<script') || content.includes('javascript:')) {
        result.warnings.push('Suspicious content detected in image metadata');
        result.securityDeduction += 15;
      }
    }

  } catch (error) {
    result.warnings.push(`Content security check failed: ${error.message}`);
  }

  return result;
};

/**
 * Generate security recommendations based on validation results
 * @param {Object} validationResult - Validation result object
 * @returns {Array} Array of recommendations
 */
const generateSecurityRecommendations = (validationResult) => {
  const recommendations = [];

  if (validationResult.securityScore < 70) {
    recommendations.push('Consider additional security scanning before allowing this file');
  }

  if (validationResult.warnings.some(w => w.includes('MIME type'))) {
    recommendations.push('Verify file type manually before processing');
  }

  if (validationResult.warnings.some(w => w.includes('signature'))) {
    recommendations.push('Perform additional file type verification');
  }

  if (validationResult.warnings.some(w => w.includes('script') || w.includes('JavaScript'))) {
    recommendations.push('Scan file content for malicious code before allowing access');
  }

  if (validationResult.securityScore < 50) {
    recommendations.push('Block file upload and request user to provide a different file');
  }

  return recommendations;
};

/**
 * Helper function to read file bytes
 * @param {File} file - File to read
 * @param {number} start - Start position
 * @param {number} length - Number of bytes to read
 * @returns {Promise<ArrayBuffer>} File bytes
 */
const readFileBytes = (file, start, length) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(start, start + length));
  });
};

/**
 * Helper function to read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content as text
 */
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file.slice(0, Math.min(file.size, 10240))); // Read first 10KB
  });
};

/**
 * Check if bytes match signature
 * @param {Uint8Array} bytes - File bytes
 * @param {Array} signature - Expected signature
 * @returns {boolean} Whether signature matches
 */
const matchesSignature = (bytes, signature) => {
  if (bytes.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  
  return true;
};

/**
 * Get file type category from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File type category
 */
const getFileTypeCategory = (mimeType) => {
  if (!mimeType) return 'default';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
  
  return 'default';
};

/**
 * Get expected MIME types for file extension
 * @param {string} extension - File extension
 * @returns {Array} Expected MIME types
 */
const getMimeTypesForExtension = (extension) => {
  const extensionMap = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp'],
    '.pdf': ['application/pdf'],
    '.txt': ['text/plain'],
    '.mp4': ['video/mp4'],
    '.mp3': ['audio/mp3', 'audio/mpeg'],
    '.wav': ['audio/wav'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  return extensionMap[extension] || [];
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Virus scanning simulation (placeholder for actual implementation)
 * @param {File} file - File to scan
 * @returns {Promise<Object>} Scan result
 */
export const simulateVirusScanning = async (file) => {
  // This is a placeholder - in production, this would integrate with actual virus scanning service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        isClean: true,
        scanTime: Date.now(),
        threats: [],
        scanEngine: 'Simulated Scanner v1.0'
      });
    }, 1000);
  });
};

export default {
  validateFileUploadSecurity,
  simulateVirusScanning,
  FILE_SECURITY_CONFIG
};