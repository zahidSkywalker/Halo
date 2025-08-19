# HALO Platform - Render Deployment Guide

This guide will help you deploy the HALO social media platform to Render.

## 🚀 Quick Deploy to Render

### Prerequisites
- Render account (free tier available)
- GitHub repository with the HALO codebase
- PostgreSQL database (Render provides this)
- Redis database (Render provides this)

## 📋 Step-by-Step Deployment

### 1. Database Setup

#### PostgreSQL Database
1. Go to your Render dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `halo-postgres`
   - **Database**: `halo_db`
   - **User**: `halo_user`
   - **Region**: Choose closest to your users
4. Copy the **Internal Database URL** for later use

#### Redis Database
1. Click "New" → "Redis"
2. Configure:
   - **Name**: `halo-redis`
   - **Region**: Same as PostgreSQL
3. Copy the **Internal Redis URL** for later use

### 2. Backend Deployment

#### Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `halo-backend`
- **Region**: Same as databases
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database URLs (use the internal URLs from step 1)
DATABASE_URL=postgresql://halo_user:password@halo-postgres:5432/halo_db
REDIS_URL=redis://halo-redis:6379

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS (update with your frontend URL)
CORS_ORIGIN=https://your-frontend-app.onrender.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Security
BCRYPT_ROUNDS=12
```

**Advanced Settings:**
- **Auto-Deploy**: Yes
- **Health Check Path**: `/health`

### 3. Frontend Deployment

#### Create Static Site
1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:

**Basic Settings:**
- **Name**: `halo-frontend`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `.next`

**Environment Variables:**
```bash
# API Configuration (use your backend URL)
NEXT_PUBLIC_API_URL=https://halo-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://halo-backend.onrender.com

# NextAuth
NEXTAUTH_URL=https://halo-frontend.onrender.com
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Feature Flags
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_MESSAGING=true
NEXT_PUBLIC_ENABLE_VIDEO_UPLOADS=true
```

### 4. Database Migration

After the backend is deployed:

1. Go to your backend service dashboard
2. Click "Shell"
3. Run the migration commands:
```bash
npm run migrate
npm run seed
```

### 5. Domain Configuration (Optional)

#### Custom Domain
1. Go to your frontend service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS

#### SSL Certificate
- Render automatically provides SSL certificates
- No additional configuration needed

## 🔧 Environment-Specific Configurations

### Development
```bash
# Backend
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Staging
```bash
# Backend
NODE_ENV=staging
CORS_ORIGIN=https://staging-halo-frontend.onrender.com

# Frontend
NEXT_PUBLIC_API_URL=https://staging-halo-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://staging-halo-backend.onrender.com
```

### Production
```bash
# Backend
NODE_ENV=production
CORS_ORIGIN=https://your-production-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-production-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-production-domain.com
```

## 🔒 Security Considerations

### Environment Variables
- Never commit sensitive data to Git
- Use Render's environment variable system
- Rotate secrets regularly

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access

### API Security
- Implement rate limiting
- Use HTTPS everywhere
- Validate all inputs

## 📊 Monitoring & Logs

### Render Dashboard
- Monitor service health
- View logs in real-time
- Set up alerts

### Health Checks
- Backend: `GET /health`
- Frontend: Automatic Next.js health checks

### Logging
```bash
# View backend logs
render logs halo-backend

# View frontend logs
render logs halo-frontend
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check environment variables
2. Verify database connectivity
3. Check build logs

#### Frontend Build Fails
1. Check Node.js version
2. Verify dependencies
3. Check build command

#### Database Connection Issues
1. Verify DATABASE_URL format
2. Check network connectivity
3. Verify database credentials

#### CORS Errors
1. Update CORS_ORIGIN in backend
2. Check frontend API_URL
3. Verify SSL certificates

### Performance Optimization

#### Backend
- Enable compression
- Use connection pooling
- Implement caching

#### Frontend
- Optimize images
- Enable code splitting
- Use CDN for static assets

## 📈 Scaling

### Auto-Scaling
- Render automatically scales based on traffic
- Configure scaling rules in service settings

### Manual Scaling
- Upgrade to paid plans for more resources
- Add more instances for high availability

## 🔄 CI/CD

### Automatic Deployments
- Render automatically deploys on Git push
- Configure branch protection rules
- Set up staging environments

### Manual Deployments
- Use Render dashboard for manual deploys
- Rollback to previous versions if needed

## 💰 Cost Optimization

### Free Tier Limits
- 750 hours/month for web services
- 1GB RAM per service
- Shared CPU resources

### Paid Plans
- $7/month for dedicated instances
- $25/month for high-performance instances
- Custom plans for enterprise needs

## 🎯 Next Steps

1. **Set up monitoring**: Configure alerts and dashboards
2. **Implement backups**: Set up database backups
3. **Add CDN**: Use Cloudflare or similar for global performance
4. **Set up analytics**: Add Google Analytics or similar
5. **Implement testing**: Add automated tests to CI/CD pipeline

## 📞 Support

- Render Documentation: https://render.com/docs
- HALO Issues: Create GitHub issues
- Community: Join our Discord server

---

**Happy Deploying! 🚀**