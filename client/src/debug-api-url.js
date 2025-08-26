// Debug API URL Configuration
// Run this in the browser console to see what API URL is being used

console.log('🔍 API URL Debug Information:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Import the API configuration
import { API_BASE_URL } from './config/api.js';
console.log('Resolved API_BASE_URL:', API_BASE_URL);

// Check if there are any other API configurations
console.log('All environment variables starting with REACT_APP:');
Object.keys(process.env)
  .filter(key => key.startsWith('REACT_APP'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });

export { API_BASE_URL };