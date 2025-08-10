# Railway Deployment Guide

## 🚀 Backend-Only Deployment Configuration

This project is configured for **backend-only deployment** on Railway. The frontend is deployed separately on Vercel.

## 📁 Configuration Files

- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Build process configuration
- `.railwayignore` - Files to exclude from deployment
- `server/railway-start.js` - Optimized startup script

## 🔧 Environment Variables Required

Set these in your Railway dashboard:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=auto_assigned_by_railway
```

## 🏗️ Build Process

1. **Setup**: Install Node.js 18 and npm
2. **Install**: Run `npm ci --production` in server directory
3. **Build**: Skip (backend-only, no build needed)
4. **Start**: Execute `node railway-start.js` in server directory

## ✅ Health Check

- **Path**: `/api/health`
- **Timeout**: 300 seconds (5 minutes)
- **Expected Response**: `{"status": "ok", ...}`

## 🚀 Deployment Steps

1. **Push to GitHub**: All changes are automatically deployed
2. **Monitor Logs**: Check Railway dashboard for deployment status
3. **Verify Health**: Ensure `/api/health` returns 200 OK
4. **Test CORS**: Frontend should connect without CORS errors

## 🔍 Expected Startup Logs

```
🚀 Starting Railway deployment...
✅ Server running on port [RAILWAY_PORT]
Environment: production
Health check: http://localhost:[RAILWAY_PORT]/api/health
✅ Essential services initialized
✅ All background services initialized successfully
```

## 🐛 Troubleshooting

- **Build fails**: Check that `server/package.json` exists
- **Health check fails**: Verify server starts within 300 seconds
- **CORS errors**: Check server logs for startup issues
- **Database connection**: Verify MONGODB_URI environment variable

## 📊 Performance

- **Startup Time**: ~3-5 seconds
- **Health Check**: Available immediately
- **Full Services**: Initialize in background after startup