// API Configuration - Updated for Netlify Functions support
const RAILWAY_API_URL = "https://neighbourwatch-development.up.railway.app";
const LOCAL_API_URL = "http://localhost:5001";
const NETLIFY_FUNCTIONS_URL = "/.netlify/functions"; // Relative URL for Netlify Functions
const FRONTEND_PORT = 3030; // Frontend now runs on port 3030

const getApiUrl = () => {
  // Check environment variable first (highest priority)
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl.trim() !== '') {
    console.log("🔧 Using environment URL:", envUrl);
    return envUrl;
  }
  
  // Check if we're in a Netlify environment
  if (process.env.NETLIFY || (typeof window !== 'undefined' && window.location.hostname.includes('netlify'))) {
    console.log("🚀 Using Netlify Functions");
    return NETLIFY_FUNCTIONS_URL;
  }
  
  // For local development, use localhost
  console.log("🏠 Using localhost backend for development");
  return LOCAL_API_URL;
};

export const API_BASE_URL = getApiUrl();

// Enhanced logging for debugging API configuration issues
console.log("🔧 API Configuration Debug Info:", {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  resolvedApiUrl: API_BASE_URL,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent.substring(0, 50) + "...",
});

// Additional environment validation logging
if (!API_BASE_URL) {
  console.error("❌ CRITICAL: API_BASE_URL is undefined! This will cause network requests to fail.");
} else if (API_BASE_URL.includes("localhost") && process.env.NODE_ENV === "production") {
  console.warn("⚠️ WARNING: Using localhost URL in production environment!");
} else {
  console.log("✅ API URL successfully resolved:", API_BASE_URL);
}

// Helper function to get the correct endpoint based on environment
const getEndpoint = (path) => {
  const baseUrl = API_BASE_URL;
  
  // If using Netlify Functions, endpoints are direct function names
  if (baseUrl === NETLIFY_FUNCTIONS_URL) {
    // Convert /api/auth/login to /auth-login for Netlify Functions
    return path.replace('/api/', '/').replace('/', '-');
  }
  
  // For traditional server, use the full path
  return path;
};

export default {
  ENDPOINTS: {
    AUTH: {
      LOGIN: getEndpoint("/api/auth/login"),
      REGISTER: getEndpoint("/api/auth/register"),
      REFRESH: getEndpoint("/api/auth/refresh"),
    },
    USERS: {
      PROFILE: getEndpoint("/api/users/profile"),
      SETTINGS: getEndpoint("/api/users/settings"),
    },
    CHAT: {
      MESSAGES: getEndpoint("/api/chat/messages"),
      GROUPS: getEndpoint("/api/chat/groups"),
    },
    NOTICES: getEndpoint("/api/notices"),
    REPORTS: getEndpoint("/api/reports"),
  },
};
