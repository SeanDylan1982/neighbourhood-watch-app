/**
 * Test script to check what JWT_SECRET the server is using
 */

require('dotenv').config({ path: '.env.local' });

const jwt = require('jsonwebtoken');

console.log('Server JWT_SECRET test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Fallback secret would be:', 'fallback_secret');

const actualSecret = process.env.JWT_SECRET || 'fallback_secret';
console.log('Actual secret being used:', actualSecret);

// Test token creation with server's secret
const testUserId = '507f1f77bcf86cd799439011';
const serverToken = jwt.sign({ userId: testUserId }, actualSecret);
console.log('Token created with server secret:', serverToken);

// Test verification
try {
  const decoded = jwt.verify(serverToken, actualSecret);
  console.log('Server token verified successfully:', decoded);
} catch (error) {
  console.error('Server token verification failed:', error.message);
}