// API Configuration
const getApiUrl = () => {
  // In production, use the Railway URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://web-production-d1da2.up.railway.app';
  }
  
  // In development, use localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5001';
};

export const API_BASE_URL = getApiUrl();

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL: API_BASE_URL
});

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh'
    },
    USERS: {
      PROFILE: '/api/users/profile',
      SETTINGS: '/api/users/settings'
    },
    CHAT: {
      MESSAGES: '/api/chat/messages',
      GROUPS: '/api/chat/groups'
    },
    NOTICES: '/api/notices',
    REPORTS: '/api/reports'
  }
};