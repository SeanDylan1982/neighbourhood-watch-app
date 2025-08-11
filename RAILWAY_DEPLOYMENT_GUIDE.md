# Railway Deployment Guide

## Overview

This guide explains how to deploy the Neighbourhood Watch App to Railway with the new optimized configuration.

## Changes Made

### 1. Updated Dockerfile
- Now uses `railway-production.js` instead of minimal server
- Includes full application functionality
- Serves both API and client build files

### 2. Updated railway.json
- Matches Dockerfile command
- Optimized health check settings
- Proper restart policies

### 3. Created railway-production.js
- Full-featured server with all routes
- Railway-specific optimizations
- Better error handling and timeouts
- Graceful degradation capabilities

## Deployment Steps

### 1. Environment Variables

Set these required environment variables in your Railway project:

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/neighbourhood-watch?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-here
CLIENT_URL=https://neighbourhood-watch-app.vercel.app
```

### 2. Optional Environment Variables

For advanced configuration, you can also set:

```bash
DB_HIGH_TRAFFIC_MODE=false
HEALTH_CHECK_INTERVAL_MS=60000
CIRCUIT_BREAKER_FAILURE_THRESHOLD=10
CHANGE_STREAM_MAX_RETRIES=5
```

### 3. Deploy to Railway

1. Connect your GitHub repository to Railway
2. Set the environment variables in Railway dashboard
3. Deploy the project
4. Railway will automatically use the Dockerfile

### 4. Verify Deployment

After deployment, test these endpoints:

- Health Check: `https://your-app.railway.app/api/health`
- Root: `https://your-app.railway.app/`
- Dashboard API: `https://your-app.railway.app/api/statistics/dashboard` (requires authentication)

## Troubleshooting

### Common Issues

1. **500 Error on Root Route**
   - Check if client build files are properly copied to `/server/public`
   - Verify environment variables are set

2. **401 Error on API Routes**
   - API routes require authentication
   - Use `/api/auth/login` to get a token first
   - Include `Authorization: Bearer <token>` header

3. **Database Connection Issues**
   - Verify `MONGO_URI` is correct
   - Check MongoDB Atlas network access settings
   - Ensure database user has proper permissions

### Health Check Details

The health check endpoint (`/api/health`) returns:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "port": 5001,
  "services": {
    "database": "connected",
    "healthCheck": "running",
    "realTime": "initialized"
  },
  "railway": true,
  "version": "production"
}
```

### Emergency Mode

If the main server fails to start, an emergency server will run that:
- Responds to health checks
- Shows error information
- Keeps Railway deployment alive

## API Endpoints

Once deployed, your API will be available at:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/statistics/dashboard` - Dashboard statistics (requires auth)
- `GET /api/health` - Health check
- And all other application endpoints...

## Frontend Integration

Update your frontend environment variables to point to the Railway deployment:

```bash
REACT_APP_API_URL=https://your-app.railway.app
```

## Monitoring

Monitor your deployment through:
- Railway dashboard logs
- Health check endpoint
- Database metrics endpoint: `/api/database-metrics`

## Support

If you encounter issues:
1. Check Railway logs in the dashboard
2. Verify environment variables
3. Test health check endpoint
4. Check database connectivity+# Railway Deployment Guide
+
+## Overview
+
+This guide explains how to deploy the Neighbourhood Watch App to Railway with the new optimized configuration.
+
+## Changes Made
+
+### 1. Updated Dockerfile
+- Now uses `railway-production.js` instead of minimal server
+- Includes full application functionality
+- Serves both API and client build files
+
+### 2. Updated railway.json
+- Matches Dockerfile command
+- Optimized health check settings
+- Proper restart policies
+
+### 3. Created railway-production.js
+- Full-featured server with all routes
+- Railway-specific optimizations
+- Better error handling and timeouts
+- Graceful degradation capabilities
+
+## Deployment Steps
+
+### 1. Environment Variables
+
+Set these required environment variables in your Railway project:
+
+```bash
+NODE_ENV=production
+MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/neighbourhood-watch?retryWrites=true&w=majority
+JWT_SECRET=your-super-secure-jwt-secret-key-here
+CLIENT_URL=https://neighbourhood-watch-app.vercel.app
+```
+
+### 2. Optional Environment Variables
+
+For advanced configuration, you can also set:
+
+```bash
+DB_HIGH_TRAFFIC_MODE=false
+HEALTH_CHECK_INTERVAL_MS=60000
+CIRCUIT_BREAKER_FAILURE_THRESHOLD=10
+CHANGE_STREAM_MAX_RETRIES=5
+```
+
+### 3. Deploy to Railway
+
+1. Connect your GitHub repository to Railway
+2. Set the environment variables in Railway dashboard
+3. Deploy the project
+4. Railway will automatically use the Dockerfile
+
+### 4. Verify Deployment
+
+After deployment, test these endpoints:
+
+- Health Check: `https://your-app.railway.app/api/health`
+- Root: `https://your-app.railway.app/`
+- Dashboard API: `https://your-app.railway.app/api/statistics/dashboard` (requires authentication)
+
+## Troubleshooting
+
+### Common Issues
+
+1. **500 Error on Root Route**
+   - Check if client build files are properly copied to `/server/public`
+   - Verify environment variables are set
+
+2. **401 Error on API Routes**
+   - API routes require authentication
+   - Use `/api/auth/login` to get a token first
+   - Include `Authorization: Bearer <token>` header
+
+3. **Database Connection Issues**
+   - Verify `MONGO_URI` is correct
+   - Check MongoDB Atlas network access settings
+   - Ensure database user has proper permissions
+
+### Health Check Details
+
+The health check endpoint (`/api/health`) returns:
+
+```json
+{
+  "status": "ok",
+  "timestamp": "2024-01-01T00:00:00.000Z",
+  "uptime": 123.456,
+  "environment": "production",
+  "port": 5001,
+  "services": {
+    "database": "connected",
+    "healthCheck": "running",
+    "realTime": "initialized"
+  },
+  "railway": true,
+  "version": "production"
+}
+```
+
+### Emergency Mode
+
+If the main server fails to start, an emergency server will run that:
+- Responds to health checks
+- Shows error information
+- Keeps Railway deployment alive
+
+## API Endpoints
+
+Once deployed, your API will be available at:
+
+- `POST /api/auth/login` - User authentication
+- `POST /api/auth/register` - User registration
+- `GET /api/statistics/dashboard` - Dashboard statistics (requires auth)
+- `GET /api/health` - Health check
+- And all other application endpoints...
+
+## Frontend Integration
+
+Update your frontend environment variables to point to the Railway deployment:
+
+```bash
+REACT_APP_API_URL=https://your-app.railway.app
+```
+
+## Monitoring
+
+Monitor your deployment through:
+- Railway dashboard logs
+- Health check endpoint
+- Database metrics endpoint: `/api/database-metrics`
+
+## Support
+
+If you encounter issues:
+1. Check Railway logs in the dashboard
+2. Verify environment variables
+3. Test health check endpoint
+4. Check database connectivity