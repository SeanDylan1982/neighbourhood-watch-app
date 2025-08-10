/**
 * Encryption Utilities
 * Basic encryption functionality for chat system
 */

/**
 * Check if encryption is enabled
 * @returns {boolean} Whether encryption is enabled
 */
export const isEncryptionEnabled = () => {
  // Check if Web Crypto API is available
  if (!window.crypto || !window.crypto.subtle) {
    return false;
  }
  
  // Check if encryption is configured
  const encryptionConfig = localStorage.getItem('encryption_enabled');
  return encryptionConfig === 'true';
};

/**
 * Validate encryption key
 * @param {string} key - Encryption key to validate
 * @returns {Object} Validation result
 */
export const validateEncryptionKey = (key) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!key) {
    result.isValid = false;
    result.errors.push('Encryption key is required');
    return result;
  }

  if (typeof key !== 'string') {
    result.isValid = false;
    result.errors.push('Encryption key must be a string');
    return result;
  }

  // Check minimum length
  if (key.length < 32) {
    result.isValid = false;
    result.errors.push('Encryption key must be at least 32 characters long');
  }

  // Check for weak patterns
  if (key === key.toLowerCase() || key === key.toUpperCase()) {
    result.isValid = false;
    result.errors.push('Encryption key must contain mixed case characters');
  }

  // Check for numbers
  if (!/\d/.test(key)) {
    result.isValid = false;
    result.errors.push('Encryption key must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(key)) {
    result.isValid = false;
    result.errors.push('Encryption key must contain at least one special character');
  }

  return result;
};

/**
 * Generate a secure encryption key
 * @returns {Promise<string>} Generated encryption key
 */
export const generateEncryptionKey = async () => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export default {
  isEncryptionEnabled,
  validateEncryptionKey,
  generateEncryptionKey
};