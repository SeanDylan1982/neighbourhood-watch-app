// API Configuration - Fixed for local development
const RAILWAY_API_URL = "https://neighbourwatch-development.up.railway.app";
const LOCAL_API_URL = "http://localhost:5001";

const getApiUrl = () => {
  // Check environment variable first (highest priority)
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    console.log("🔧 Using environment URL:", envUrl);
    return envUrl;
  }
  
  // For now, always use localhost since Railway is not working
  // TODO: Update this to use Netlify Functions URL when deployed
  console.log("🏠 Using localhost backend (Railway is down)");
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

export default {
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      REFRESH: "/api/auth/refresh",
    },
    USERS: {
      PROFILE: "/api/users/profile",
      SETTINGS: "/api/users/settings",
    },
    CHAT: {
      MESSAGES: "/api/chat/messages",
      GROUPS: "/api/chat/groups",
    },
    NOTICES: "/api/notices",
    REPORTS: "/api/reports",
  },
};
