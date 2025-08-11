# Quick Deployment Guide

## Current Setup Status

✅ **GitHub Repository**: https://github.com/SeanDylan1982/neighbourhood-watch-app
✅ **Railway Backend**: https://railway.com/project/d1da2007-9b1e-4198-81a8-5b2795158186
✅ **Vercel Frontend**: https://vercel.com/sean-pattersons-projects-5128ccfa/neighbourhood-watch-app

## Railway Backend Configuration

Your Railway backend should have these environment variables:

```
MONGO_URI=mongodb+srv://admin:N12Nfm9vyKmWUtJH@cluster0.v0pymzq.mongodb.net/neighbourhood-watch?retryWrites=true&w=majority
JWT_SECRET=601e133aedc9251c0516693ff962a899e37d01ce1109e9dc8b4139b92745bbb2
NODE_ENV=production
PORT=5000
CLIENT_URL=https://neighbourhood-watch-app-sean-pattersons-projects-5128ccfa.vercel.app
MAX_FILE_SIZE=10485760
RATE_LIMIT_MAX=100
ADMIN_RATE_LIMIT_MAX=1000
```

## Vercel Frontend Configuration

Your Vercel frontend should have these environment variables:

```
REACT_APP_API_URL=https://neighbourwatch-development.up.railway.app/
REACT_APP_NAME=neibrly
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_NOTIFICATIONS=true
```

## Deployment Steps

1. **Push to GitHub** (triggers both deployments):
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push origin master
   ```

2. **Check Railway Deployment**:
   - Go to your Railway dashboard
   - Verify the backend is running
   - Check logs for any errors

3. **Check Vercel Deployment**:
   - Go to your Vercel dashboard
   - Verify the frontend build succeeded
   - Test the live URL

## Troubleshooting

### If Vercel Build Fails:
- Check the build logs in Vercel dashboard
- Ensure `CI=false` is set in build command
- Verify all environment variables are set

### If Railway Deployment Fails:
- Check Railway logs
- Verify MongoDB connection string
- Ensure all required environment variables are set

### If Apps Don't Connect:
- Verify CORS settings in backend
- Check that CLIENT_URL in Railway matches your Vercel URL
- Verify REACT_APP_API_URL in Vercel matches your Railway URL

## URLs After Deployment

- **Frontend**: https://neighbourhood-watch-app-sean-pattersons-projects-5128ccfa.vercel.app
- **Backend**: https://neighbourwatch-development.up.railway.app/
- **GitHub**: https://github.com/SeanDylan1982/neighbourhood-watch-app