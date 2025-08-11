// API Configuration
const getApiUrl = () => {
  // Production: Force Railway URL
  if (process.env.NODE_ENV === "production") {
    console.log("🚀 Production mode: Using Railway backend URL");
    return "https://neighbourwatch-development.up.railway.app";
  }
  
  // Development: Check environment variable first, then fallback
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    console.log("🔧 Development mode: Using environment variable API URL:", envUrl);
    return envUrl;
  }
  
  // Default fallback for development
  console.log("🏠 Development mode: Using default localhost backend");
  return "http://localhost:5001";
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
