/**
 * Test chat endpoints with a real user from the database
 */

require('dotenv').config({ path: '.env.local' });

const jwt = require('jsonwebtoken');

// Use the admin user ID from the database query
const realUserId = '688d5961e715295e76c93f17'; // Sarah Administrator
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

console.log('Testing chat with real user...');
console.log('User ID:', realUserId);
console.log('JWT Secret:', jwtSecret);

// Create token with real user ID
const token = jwt.sign({ userId: realUserId }, jwtSecret);
console.log('Generated token:', token);

// Verify token
try {
  const decoded = jwt.verify(token, jwtSecret);
  console.log('Token verified:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

console.log('\nTo test the chat endpoint, run:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5001/api/chat/groups`);