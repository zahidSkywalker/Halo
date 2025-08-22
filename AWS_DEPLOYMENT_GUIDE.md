# 🚀 HALO Social Media Platform - AWS Free Tier Deployment Guide

## 🎯 **Quick Start: Deploy HALO to AWS in 10 Minutes!**

### **✅ What You'll Get:**
- **Frontend**: AWS Amplify (Next.js) - FREE
- **Backend**: AWS Elastic Beanstalk (Node.js) - FREE
- **Database**: RDS PostgreSQL (t3.micro) - FREE
- **Storage**: S3 Bucket (5GB) - FREE
- **CDN**: CloudFront - FREE

---

## 📋 **Prerequisites:**

### **1. AWS Account Setup**
- ✅ **AWS Account** with free tier access
- ✅ **AWS CLI** installed and configured
- ✅ **GitHub repository** connected

### **2. AWS CLI Configuration**
```bash
# Configure AWS CLI
aws configure

# Enter your credentials:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region: us-east-1
# Default output format: json
```

---

## 🚀 **Step-by-Step Deployment:**

### **Step 1: Configure AWS CLI**
```bash
# Check if AWS CLI is configured
aws sts get-caller-identity

# If not configured, run:
aws configure
```

### **Step 2: Run the Deployment Script**
```bash
# Make script executable
chmod +x aws-deploy.sh

# Run the deployment
./aws-deploy.sh

# Choose option 1: Full deployment
```

### **Step 3: Manual Deployment (Alternative)**

#### **Option A: AWS Amplify (Frontend)**
```bash
# 1. Go to AWS Amplify Console
# 2. Click "New App" → "Host web app"
# 3. Connect to GitHub repository
# 4. Select branch: main
# 5. Build settings:
#    - Build command: npm run build
#    - Output directory: .next
# 6. Deploy
```

#### **Option B: AWS Elastic Beanstalk (Backend)**
```bash
# 1. Go to AWS Elastic Beanstalk Console
# 2. Click "Create Application"
# 3. Application name: halo-backend
# 4. Platform: Node.js
# 5. Upload your code or connect to GitHub
# 6. Environment type: Single instance (free tier)
# 7. Deploy
```

#### **Option C: RDS PostgreSQL (Database)**
```bash
# 1. Go to AWS RDS Console
# 2. Click "Create database"
# 3. Choose PostgreSQL
# 4. Template: Free tier
# 5. DB instance: db.t3.micro
# 6. Storage: 20 GB
# 7. Create database
```

---

## 🔧 **Environment Variables Setup:**

### **Backend Environment Variables:**
```bash
# Create .env file in backend directory
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/halo_social_media
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=production
PORT=8081
AWS_S3_BUCKET=your-s3-bucket-name
CORS_ORIGIN=https://your-amplify-domain.com
```

### **Frontend Environment Variables:**
```bash
# Create .env.local file in frontend directory
NEXT_PUBLIC_API_URL=https://your-elastic-beanstalk-url.com
```

---

## 🗄️ **Database Setup:**

### **1. Create Database Schema**
```bash
# Connect to your RDS instance
psql -h your-rds-endpoint -U username -d halo_social_media

# Run the schema file
\i backend/db/init.sql
```

### **2. Verify Tables**
```sql
-- Check if tables are created
\dt

-- Should show:
-- users, posts, comments, likes, follows, notifications, etc.
```

---

## 📁 **S3 Bucket Setup:**

### **1. Create S3 Bucket**
```bash
# Create bucket
aws s3 mb s3://halo-media-your-unique-name

# Configure for media storage
aws s3api put-bucket-cors --bucket halo-media-your-unique-name --cors-configuration file://cors.json
```

### **2. CORS Configuration (cors.json)**
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}
```

---

## 🔗 **Connect Frontend to Backend:**

### **Update API Endpoints:**
```typescript
// In frontend/src/app/dashboard/page.tsx
// Replace localhost:3001 with your Elastic Beanstalk URL

const API_BASE_URL = 'https://your-elastic-beanstalk-url.com/api';
```

---

## 🧪 **Testing Your Deployment:**

### **1. Health Check**
```bash
# Test backend
curl https://your-elastic-beanstalk-url.com/health

# Expected response:
# {"status":"OK","timestamp":"...","uptime":...}
```

### **2. Frontend Test**
```bash
# Visit your Amplify URL
# Should show HALO landing page
```

### **3. User Registration**
```bash
# Go to /auth/register
# Create a test account
# Verify registration works
```

---

## 💰 **Cost Breakdown (Free Tier):**

| Service | Free Tier Limit | Monthly Cost |
|---------|----------------|--------------|
| **EC2 (Elastic Beanstalk)** | 750 hours | $0 |
| **RDS PostgreSQL** | 750 hours | $0 |
| **S3 Storage** | 5 GB | $0 |
| **CloudFront** | 1 TB transfer | $0 |
| **Amplify** | 1,000 build minutes | $0 |
| **Data Transfer** | 15 GB | $0 |

**Total Monthly Cost: $0** ✅

---

## 🚨 **Common Issues & Solutions:**

### **Issue 1: CORS Errors**
```bash
# Solution: Update CORS_ORIGIN in backend
CORS_ORIGIN=https://your-amplify-domain.com
```

### **Issue 2: Database Connection**
```bash
# Solution: Check DATABASE_URL format
DATABASE_URL=postgresql://username:password@endpoint:5432/database
```

### **Issue 3: Build Failures**
```bash
# Solution: Check build logs in Amplify Console
# Common issues: missing dependencies, build commands
```

---

## 📈 **Scaling Beyond Free Tier:**

### **When to Upgrade:**
- **Users > 1,000**: Upgrade to t3.small
- **Storage > 5GB**: Add S3 storage
- **Traffic > 1TB**: Add CloudFront distribution

### **Cost Estimates:**
- **t3.small**: ~$15/month
- **RDS t3.small**: ~$25/month
- **S3 (100GB)**: ~$2.30/month
- **Total**: ~$42/month for 10K+ users

---

## 🎉 **Congratulations!**

**Your HALO social media platform is now live on AWS!**

### **Your URLs:**
- **Frontend**: https://your-amplify-domain.com
- **Backend**: https://your-elastic-beanstalk-url.com
- **API Docs**: https://your-elastic-beanstalk-url.com/api/docs

### **Next Steps:**
1. **Test all features** (register, login, posts, likes)
2. **Invite users** to join your platform
3. **Monitor usage** in AWS Console
4. **Scale up** when needed

---

## 🆘 **Need Help?**

### **AWS Support:**
- **Documentation**: AWS Console → Help
- **Community**: AWS Forums
- **Support**: AWS Support Center

### **HALO Support:**
- **GitHub Issues**: Report bugs
- **Documentation**: Check README files
- **Community**: Join HALO Discord

---

**🚀 Your social media platform is ready to connect people in the digital age!** ✨