# CORS Fix Guide

## Issue
The frontend at `http://localhost:3000` is getting CORS errors when trying to connect to the backend API.

## Root Cause
The client was configured to use the Railway backend URL (`https://neighbourwatch-development.up.railway.app`) instead of the local development server.

## Solution Applied

### 1. Updated Client Configuration
Changed `client/.env` to use local backend:
```env
# Before
REACT_APP_API_URL=https://neighbourwatch-development.up.railway.app

# After  
REACT_APP_API_URL=http://localhost:5001
```

### 2. Verified Server CORS Configuration
The local server at `http://localhost:5001` is properly configured with CORS headers:
- ✅ `access-control-allow-origin: http://localhost:3000`
- ✅ `access-control-allow-credentials: true`
- ✅ Server is running and responding to health checks

### 3. Created Debug Tools
Added utilities to help diagnose API connection issues:
- `client/src/utils/testApiConfig.js` - Frontend API testing
- `server/test-server-health.js` - Backend health checking

## Next Steps

### 1. Restart React Development Server
After changing the `.env` file, you need to restart the React development server:

```bash
# Stop the current React server (Ctrl+C)
# Then restart it
cd client
npm start
```

### 2. Verify Connection
Once restarted, open the browser console and run:
```javascript
runAllApiTests()
```

This will test the API connection and show detailed results.

### 3. Test Login
Try logging in again. The CORS error should be resolved.

## Troubleshooting

### If CORS Errors Persist:

1. **Check Environment Variable Loading**
   ```javascript
   // In browser console
   console.log('API URL:', process.env.REACT_APP_API_URL);
   ```

2. **Verify Server is Running**
   ```bash
   cd server
   node test-server-health.js
   ```

3. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Look for the actual URL being called
   - Check if it's still trying to call Railway URL

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

### If Server Connection Fails:

1. **Check Server Status**
   ```bash
   # Make sure server is running
   npm run server
   ```

2. **Check Port**
   - Server should be running on port 5001
   - Check for port conflicts

3. **Check MongoDB Connection**
   - Server logs show MongoDB connection issues
   - This might affect some endpoints but shouldn't affect basic CORS

## Environment Configuration

### Development (Local)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- Database: Local MongoDB or MongoDB Atlas

### Production (Railway)
- Frontend: Vercel deployment
- Backend: `https://neighbourwatch-development.up.railway.app`
- Database: MongoDB Atlas

## Files Modified
- ✅ `client/.env` - Updated API URL
- ✅ `client/src/utils/testApiConfig.js` - Added API testing utility
- ✅ `server/test-server-health.js` - Added server health check
- ✅ `client/src/App.js` - Added debug utilities to window object

## Verification
Run the server health check to confirm everything is working:
```bash
cd server
node test-server-health.js
```

Expected output should show:
- ✅ Server responding with status: 200
- ✅ CORS is configured
- ✅ `access-control-allow-origin: http://localhost:3000`