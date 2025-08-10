# Deployment Guide

This guide covers deploying the neibrly app with Railway (backend) and Vercel (frontend).

## Prerequisites

1. GitHub account with your code pushed
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. MongoDB Atlas database (or other MongoDB hosting)

## Backend Deployment (Railway)

### 1. Connect to Railway

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your neibrly repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In your Railway project dashboard, go to Variables and add:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app
PORT=5000
MAX_FILE_SIZE=10485760
RATE_LIMIT_MAX=100
ADMIN_RATE_LIMIT_MAX=1000
DB_MIN_POOL_SIZE=5
DB_MAX_POOL_SIZE=50
DB_WRITE_CONCERN=majority
DB_READ_PREFERENCE=primaryPreferred
```

### 3. Configure Build Settings

Railway should automatically:
- Detect the Node.js environment
- Install dependencies with `npm install`
- Start the server with `npm start`

The `railway.json` file in the root configures the deployment to run from the `server` directory.

### 4. Deploy

Railway will automatically deploy when you push to your main branch.

## Frontend Deployment (Vercel)

### 1. Connect to Vercel

1. Go to https://vercel.com and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will detect it's a React app

### 2. Configure Build Settings

In Vercel project settings:
- **Framework Preset**: Create React App
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 3. Configure Environment Variables

In Vercel project settings, add environment variables:

```
REACT_APP_API_URL=https://your-railway-app.railway.app
REACT_APP_NAME=neibrly
REACT_APP_VERSION=1.0.0
```

### 4. Deploy

Vercel will automatically deploy when you push to your main branch.

## Post-Deployment Steps

### 1. Update CORS Settings

Make sure your Railway backend allows requests from your Vercel frontend URL.

### 2. Update Environment Variables

- Update `CLIENT_URL` in Railway to your Vercel app URL
- Update `REACT_APP_API_URL` in Vercel to your Railway app URL

### 3. Test the Deployment

1. Visit your Vercel app URL
2. Test user registration/login
3. Test real-time features (chat, notifications)
4. Test file uploads
5. Verify database connections

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CLIENT_URL in Railway matches your Vercel URL
2. **Database Connection**: Verify MONGO_URI is correct and database is accessible
3. **Environment Variables**: Double-check all required variables are set
4. **Build Failures**: Check build logs in Railway/Vercel dashboards

### Monitoring

- Railway provides logs and metrics in the dashboard
- Vercel provides analytics and performance metrics
- Monitor your MongoDB Atlas database usage

## Custom Domains (Optional)

### Railway Custom Domain
1. Go to your Railway project settings
2. Add your custom domain
3. Configure DNS records as instructed

### Vercel Custom Domain
1. Go to your Vercel project settings
2. Add your custom domain
3. Configure DNS records as instructed

## Security Considerations

1. Use strong JWT secrets
2. Enable HTTPS (automatic with Railway/Vercel)
3. Configure proper CORS settings
4. Use environment variables for all secrets
5. Enable MongoDB Atlas IP whitelisting if needed
6. Regular security updates for dependencies

## Scaling

### Railway Scaling
- Railway automatically scales based on usage
- Monitor resource usage in dashboard
- Upgrade plan if needed

### Vercel Scaling
- Vercel automatically handles frontend scaling
- CDN distribution included
- Monitor bandwidth usage

## Backup Strategy

1. Regular MongoDB Atlas backups
2. Keep environment variables documented securely
3. Version control all configuration files
4. Document deployment procedures