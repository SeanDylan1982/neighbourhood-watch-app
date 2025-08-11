# Design Document

## Overview

This design addresses the CORS (Cross-Origin Resource Sharing) configuration issue that prevents the frontend application from communicating with the backend API when deployed on Railway. The solution involves updating both the server-side CORS configuration and the client-side API configuration to properly handle different deployment environments.

## Architecture

The CORS fix involves two main components:

1. **Server-side CORS Configuration** (`server/index.js`)
   - Update the allowed origins array to include the Railway production URL
   - Ensure proper environment variable handling
   - Maintain backward compatibility with existing origins

2. **Client-side API Configuration** (`client/src/config/api.js`)
   - Fix the API URL determination logic
   - Ensure proper fallback behavior
   - Improve environment detection

## Components and Interfaces

### Server CORS Configuration

**Location**: `server/index.js`

**Current Issue**: The CORS origins array does not include the Railway production URL `https://neighbourwatch-development.up.railway.app/`

**Solution Components**:
- Update the `cors()` middleware configuration
- Add Railway URL to allowed origins
- Ensure environment variable precedence
- Maintain existing Vercel and localhost origins

### Client API Configuration

**Location**: `client/src/config/api.js`

**Current Issue**: The `getApiUrl()` function has incomplete logic that doesn't return a proper URL in development

**Solution Components**:
- Fix the API URL determination logic
- Add proper fallback for development environment
- Ensure consistent behavior across environments

## Data Models

### Environment Configuration

```javascript
// Environment variables expected
{
  NODE_ENV: 'development' | 'production',
  CLIENT_URL: string, // Optional, for server CORS
  REACT_APP_API_URL: string // Optional, for client API calls
}
```

### CORS Origins Configuration

```javascript
// Server CORS origins array
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://neighbourwatch-development.up.railway.app/", // Railway backend URL
  "https://neighbourhood-watch-app.vercel.app",
  "https://neighbourhood-watch-app-sean-pattersons-projects-5128ccfa.vercel.app",
  /^https:\/\/neighbourhood-watch-app.*\.vercel\.app$/
]
```

### API URL Configuration

```javascript
// Client API URL determination
const getApiUrl = () => {
  // Production: Force Railway URL
  if (process.env.NODE_ENV === "production") {
    return "https://neighbourwatch-development.up.railway.app/";
  }
  
  // Development: Check environment variable first, then fallback
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  
  // Default fallback for development
  return "http://localhost:5001";
};
```

## Error Handling

### CORS Error Scenarios

1. **Missing Origin**: When Railway URL is not in allowed origins
   - **Error**: "Access to XMLHttpRequest has been blocked by CORS policy"
   - **Solution**: Add Railway URL to origins array

2. **Preflight Request Failure**: When OPTIONS requests fail
   - **Error**: "Response to preflight request doesn't pass access control check"
   - **Solution**: Ensure proper CORS headers and methods

3. **Credentials Issues**: When credentials are not properly handled
   - **Error**: "The value of the 'Access-Control-Allow-Credentials' header is '' which must be 'true'"
   - **Solution**: Ensure credentials: true in CORS config

### API Configuration Error Scenarios

1. **Undefined API URL**: When getApiUrl() returns undefined
   - **Error**: Network requests fail with undefined URL
   - **Solution**: Provide proper fallback values

2. **Incorrect Environment Detection**: When NODE_ENV is not properly set
   - **Error**: Wrong API URL used in different environments
   - **Solution**: Improve environment detection logic

## Testing Strategy

### Server-side Testing

1. **CORS Headers Verification**
   - Test that Railway URL is accepted as origin
   - Verify preflight OPTIONS requests work
   - Check that credentials are properly handled

2. **Environment Variable Testing**
   - Test with different CLIENT_URL values
   - Verify fallback behavior when CLIENT_URL is not set
   - Test regex pattern matching for Vercel URLs

### Client-side Testing

1. **API URL Resolution Testing**
   - Test production environment URL resolution
   - Test development environment URL resolution
   - Test environment variable override behavior

2. **Network Request Testing**
   - Verify authentication requests work
   - Test API calls to protected endpoints
   - Confirm proper error handling

### Integration Testing

1. **Cross-Origin Request Testing**
   - Test requests from localhost to Railway backend
   - Test requests from Vercel frontend to Railway backend
   - Verify Socket.IO connections work properly

2. **Environment Transition Testing**
   - Test switching between development and production
   - Verify proper behavior with different environment variables
   - Test deployment scenarios

## Implementation Details

### Server Changes Required

1. **Update CORS Origins Array**
   ```javascript
   origin: [
     process.env.CLIENT_URL || "http://localhost:3000",
     "http://localhost:3000",
     "http://127.0.0.1:3000",
     "https://neighbourwatch-development.up.railway.app/", // Add this line
     "https://neighbourhood-watch-app.vercel.app",
     // ... existing origins
   ]
   ```

2. **Verify CORS Configuration**
   - Ensure credentials: true is set
   - Confirm all necessary methods are allowed
   - Check that proper headers are exposed

### Client Changes Required

1. **Fix API URL Logic**
   ```javascript
   const getApiUrl = () => {
     if (process.env.NODE_ENV === "production") {
       return "https://neighbourwatch-development.up.railway.app/";
     }
     
     const envUrl = process.env.REACT_APP_API_URL;
     if (envUrl && !envUrl.includes("localhost")) {
       return envUrl;
     }
     
     return "http://localhost:5001"; // Add proper fallback
   };
   ```

2. **Improve Logging**
   - Add more detailed configuration logging
   - Include resolved API URL in debug output
   - Log environment detection results

## Security Considerations

1. **Origin Validation**
   - Only allow trusted domains in CORS origins
   - Use specific URLs rather than wildcards where possible
   - Regularly review and update allowed origins

2. **Environment Variable Security**
   - Ensure sensitive URLs are not exposed in client-side code
   - Use environment-specific configurations
   - Validate environment variable values

3. **Credentials Handling**
   - Ensure credentials are only sent to trusted origins
   - Verify proper cookie and authentication header handling
   - Test cross-origin authentication flows

## Deployment Considerations

1. **Environment Variable Setup**
   - Ensure CLIENT_URL is set in Railway deployment
   - Configure REACT_APP_API_URL for different environments
   - Document required environment variables

2. **Build Process**
   - Verify that environment variables are properly injected during build
   - Test that production builds use correct API URLs
   - Ensure development and production configurations are distinct

3. **Monitoring and Debugging**
   - Add logging for CORS-related requests
   - Monitor for CORS errors in production
   - Set up alerts for authentication failures