// API Configuration - COMPLETELY REWRITTEN TO ELIMINATE OLD URLs
const RAILWAY_API_URL = "https://neighbourwatch-development.up.railway.app";
const LOCAL_API_URL = "http://localhost:5001";

const getApiUrl = () => {
  // FORCE the correct Railway URL - no concatenation, no fallbacks, no old URLs
  if (process.env.NODE_ENV === "production") {
    console.log("🚀 Production mode: Using FORCED Railway backend URL");
    return RAILWAY_API_URL;
  }
  
  // Development: Use environment variable or Railway URL (NO localhost)
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    // VALIDATE the URL to prevent malformed URLs
    if (envUrl.includes("neighbourwatch-development.up.railway.app")) {
      console.log("🔧 Development mode: Using validated Railway URL:", envUrl);
      return envUrl;
    }
    if (envUrl.includes("localhost")) {
      console.log("🏠 Development mode: Using localhost backend");
      return envUrl;
    }
  }
  
  // Default to Railway URL (NOT localhost)
  console.log("🔧 Development mode: Defaulting to Railway backend");
  return RAILWAY_API_URL;
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
