/**
 * Test script to verify JWT authentication
 */

const jwt = require('jsonwebtoken');

// Test JWT creation and verification
const testUserId = '507f1f77bcf86cd799439011';
const secret = process.env.JWT_SECRET || 'fallback_secret';

console.log('Testing JWT authentication...');
console.log('JWT_SECRET:', secret);
console.log('Test User ID:', testUserId);

// Create token
const token = jwt.sign({ userId: testUserId }, secret);
console.log('Generated token:', token);

// Verify token
try {
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

// Test with different secrets
const fallbackSecret = 'fallback_secret';
const tokenWithFallback = jwt.sign({ userId: testUserId }, fallbackSecret);
console.log('\nTesting with fallback secret:');
console.log('Token with fallback:', tokenWithFallback);

try {
  const decodedFallback = jwt.verify(tokenWithFallback, fallbackSecret);
  console.log('Fallback token verified:', decodedFallback);
} catch (error) {
  console.error('Fallback token verification failed:', error.message);
}