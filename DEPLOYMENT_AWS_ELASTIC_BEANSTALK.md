# 🚀 HALO Platform - AWS Elastic Beanstalk Deployment Guide

This guide will help you deploy the HALO social media platform to AWS Elastic Beanstalk with RDS PostgreSQL and ElastiCache Redis.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Git repository with HALO codebase
- Domain name (optional but recommended)

## 🏗️ Architecture Overview

```
Internet → CloudFront → ALB → Elastic Beanstalk (Frontend)
                    ↓
                Elastic Beanstalk (Backend) → RDS PostgreSQL
                    ↓
                ElastiCache Redis
```

## 📦 Step-by-Step Deployment

### 1. AWS Infrastructure Setup

#### 1.1 Create RDS PostgreSQL Database

1. **Go to RDS Console**
   - Navigate to AWS RDS Console
   - Click "Create database"

2. **Choose Configuration**
   ```
   Engine: PostgreSQL
   Version: 14.x
   Template: Free tier (for testing) or Production
   ```

3. **Settings**
   ```
   DB instance identifier: halo-postgres
   Master username: halo_admin
   Master password: [generate strong password]
   ```

4. **Instance Configuration**
   ```
   DB instance class: db.t3.micro (free tier) or db.t3.small (production)
   Storage: 20 GB (free tier) or 100 GB (production)
   Storage type: General Purpose SSD (gp2)
   ```

5. **Connectivity**
   ```
   VPC: Default VPC
   Public access: Yes (for Elastic Beanstalk access)
   VPC security group: Create new (halo-postgres-sg)
   Availability Zone: No preference
   Database port: 5432
   ```

6. **Database Authentication**
   ```
   Password authentication
   ```

7. **Additional Configuration**
   ```
   Initial database name: halo_db
   Backup retention: 7 days
   Monitoring: Enable enhanced monitoring
   ```

#### 1.2 Create ElastiCache Redis

1. **Go to ElastiCache Console**
   - Navigate to AWS ElastiCache Console
   - Click "Create"

2. **Choose Configuration**
   ```
   Engine: Redis
   Version: 7.x
   Template: Free tier (for testing) or Production
   ```

3. **Settings**
   ```
   Name: halo-redis
   Description: HALO Platform Redis Cache
   Port: 6379
   ```

4. **Node Type**
   ```
   Node type: cache.t3.micro (free tier) or cache.t3.small (production)
   Number of replicas: 0 (free tier) or 1 (production)
   ```

5. **Network and Security**
   ```
   VPC: Same as RDS
   Subnet group: Create new (halo-redis-subnet)
   Security group: Create new (halo-redis-sg)
   ```

#### 1.3 Create S3 Bucket for Media Storage

1. **Go to S3 Console**
   - Navigate to AWS S3 Console
   - Click "Create bucket"

2. **Bucket Configuration**
   ```
   Bucket name: halo-media-[your-unique-id]
   Region: Same as your Elastic Beanstalk
   ```

3. **Configure Options**
   ```
   Versioning: Enable
   Server-side encryption: Enable
   Object-level logging: Enable
   ```

### 2. Security Groups Configuration

#### 2.1 Backend Security Group (halo-backend-sg)
```
Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
- Custom TCP (8081) from Elastic Beanstalk security group

Outbound Rules:
- All traffic to 0.0.0.0/0
```

#### 2.2 Frontend Security Group (halo-frontend-sg)
```
Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0

Outbound Rules:
- All traffic to 0.0.0.0/0
```

#### 2.3 Database Security Group (halo-postgres-sg)
```
Inbound Rules:
- PostgreSQL (5432) from halo-backend-sg

Outbound Rules:
- All traffic to 0.0.0.0/0
```

#### 2.4 Redis Security Group (halo-redis-sg)
```
Inbound Rules:
- Redis (6379) from halo-backend-sg

Outbound Rules:
- All traffic to 0.0.0.0/0
```

### 3. Backend Deployment

#### 3.1 Prepare Backend Code

1. **Update Environment Variables**
   ```bash
   cd backend
   ```

2. **Update `.ebextensions/01_environment.config`**
   ```yaml
   # Replace placeholder values with actual values
   DATABASE_URL: postgresql://halo_admin:your_actual_password@your_rds_endpoint:5432/halo_db
   REDIS_URL: redis://your_redis_endpoint:6379
   JWT_SECRET: your_actual_jwt_secret
   CORS_ORIGIN: https://your-frontend-domain.com
   ```

#### 3.2 Deploy Backend to Elastic Beanstalk

1. **Initialize EB Application**
   ```bash
   cd backend
   eb init halo-backend
   ```

2. **Create Environment**
   ```bash
   eb create halo-backend-prod \
     --instance-type t3.small \
     --single-instance \
     --vpc.id vpc-xxxxxxxxx \
     --vpc.ec2subnets subnet-xxxxxxxxx,subnet-yyyyyyyy \
     --vpc.securitygroups sg-xxxxxxxxx \
     --vpc.elbsubnets subnet-xxxxxxxxx,subnet-yyyyyyyy \
     --vpc.elbscheme public
   ```

3. **Configure Environment Variables**
   ```bash
   eb setenv \
     NODE_ENV=production \
     DATABASE_URL=postgresql://halo_admin:password@your-rds-endpoint:5432/halo_db \
     REDIS_URL=redis://your-redis-endpoint:6379 \
     JWT_SECRET=your_super_secure_jwt_secret \
     CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### 4. Frontend Deployment

#### 4.1 Prepare Frontend Code

1. **Update Environment Variables**
   ```bash
   cd frontend
   ```

2. **Update `.ebextensions/01_environment.config`**
   ```yaml
   # Replace with your actual backend URL
   NEXT_PUBLIC_API_URL: https://your-backend-eb-environment.elasticbeanstalk.com
   NEXT_PUBLIC_WS_URL: wss://your-backend-eb-environment.elasticbeanstalk.com
   NEXTAUTH_URL: https://your-frontend-domain.com
   ```

#### 4.2 Deploy Frontend to Elastic Beanstalk

1. **Initialize EB Application**
   ```bash
   cd frontend
   eb init halo-frontend
   ```

2. **Create Environment**
   ```bash
   eb create halo-frontend-prod \
     --instance-type t3.small \
     --single-instance \
     --vpc.id vpc-xxxxxxxxx \
     --vpc.ec2subnets subnet-xxxxxxxxx,subnet-yyyyyyyy \
     --vpc.securitygroups sg-xxxxxxxxx \
     --vpc.elbsubnets subnet-xxxxxxxxx,subnet-yyyyyyyy \
     --vpc.elbscheme public
   ```

3. **Configure Environment Variables**
   ```bash
   eb setenv \
     NODE_ENV=production \
     NEXT_PUBLIC_API_URL=https://your-backend-eb-environment.elasticbeanstalk.com \
     NEXT_PUBLIC_WS_URL=wss://your-backend-eb-environment.elasticbeanstalk.com \
     NEXTAUTH_URL=https://your-frontend-domain.com \
     NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### 5. Domain Configuration

#### 5.1 Route 53 Setup (Optional)

1. **Create Hosted Zone**
   - Go to Route 53 Console
   - Create hosted zone for your domain

2. **Create A Records**
   ```
   api.yourdomain.com → Backend Elastic Beanstalk URL
   www.yourdomain.com → Frontend Elastic Beanstalk URL
   yourdomain.com → Frontend Elastic Beanstalk URL
   ```

#### 5.2 SSL Certificate

1. **Request Certificate**
   - Go to AWS Certificate Manager
   - Request certificate for your domain
   - Validate via DNS or email

2. **Configure Load Balancer**
   - Attach certificate to Elastic Beanstalk load balancer
   - Redirect HTTP to HTTPS

### 6. Monitoring and Logging

#### 6.1 CloudWatch Setup

1. **Enable Enhanced Monitoring**
   - Configure in Elastic Beanstalk environment
   - Set up CloudWatch alarms

2. **Application Logs**
   ```bash
   # View logs
   eb logs
   
   # Stream logs
   eb logs --all --stream
   ```

#### 6.2 Health Checks

1. **Backend Health Check**
   ```
   URL: /health
   Expected: 200 OK
   ```

2. **Frontend Health Check**
   ```
   URL: /
   Expected: 200 OK
   ```

## 🔧 Configuration Files

### Backend Configuration

#### `.ebextensions/01_environment.config`
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8081
    DATABASE_URL: postgresql://halo_admin:password@your-rds-endpoint:5432/halo_db
    REDIS_URL: redis://your-redis-endpoint:6379
    JWT_SECRET: your_super_secure_jwt_secret
    CORS_ORIGIN: https://your-frontend-domain.com
```

#### `.ebextensions/02_nginx.config`
```nginx
# CORS and proxy configuration
location / {
    proxy_pass http://nodejs;
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    # ... other headers
}
```

### Frontend Configuration

#### `.ebextensions/01_environment.config`
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: https://your-backend-eb-environment.elasticbeanstalk.com
    NEXT_PUBLIC_WS_URL: wss://your-backend-eb-environment.elasticbeanstalk.com
```

## 📊 Cost Estimation

### Free Tier (12 months)
- **EC2**: 750 hours/month (t3.micro)
- **RDS**: 750 hours/month (db.t3.micro)
- **ElastiCache**: 750 hours/month (cache.t3.micro)
- **S3**: 5 GB storage
- **Data Transfer**: 15 GB/month
- **Total**: $0/month

### Production (After Free Tier)
- **EC2**: $15-30/month (t3.small instances)
- **RDS**: $25-50/month (db.t3.small)
- **ElastiCache**: $15-30/month (cache.t3.small)
- **S3**: $0.023/GB/month
- **Data Transfer**: $0.09/GB
- **Total**: $55-110/month

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check RDS security group
# Verify DATABASE_URL format
# Test connection from EC2 instance
```

#### 2. Redis Connection Issues
```bash
# Check ElastiCache security group
# Verify REDIS_URL format
# Test connection from EC2 instance
```

#### 3. CORS Issues
```bash
# Update CORS_ORIGIN in backend
# Check nginx configuration
# Verify frontend API_URL
```

#### 4. Build Failures
```bash
# Check Node.js version compatibility
# Verify package.json dependencies
# Check build logs in Elastic Beanstalk
```

### Useful Commands

```bash
# View environment status
eb status

# View logs
eb logs

# SSH into instance
eb ssh

# Open application
eb open

# Terminate environment
eb terminate
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Deploy to AWS Elastic Beanstalk

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: halo-backend
          environment_name: halo-backend-prod
          region: us-east-1
          deployment_package: backend.zip
```

## 📈 Scaling Configuration

### Auto Scaling

```yaml
# Backend Auto Scaling
aws:autoscaling:asg:
  MinSize: 1
  MaxSize: 4
  Cooldown: 300

# Scale up when CPU > 70%
aws:autoscaling:trigger:
  BreachDuration: 5
  LowerBreachScaleIncrement: -1
  UpperBreachScaleIncrement: 1
  UpperThreshold: 70
```

## 🎯 Next Steps

1. **Deploy Infrastructure**: Follow the step-by-step guide above
2. **Configure Monitoring**: Set up CloudWatch alarms and dashboards
3. **Set up CI/CD**: Configure GitHub Actions for automatic deployment
4. **Add Custom Domain**: Configure Route 53 and SSL certificates
5. **Performance Optimization**: Implement CDN and caching strategies

## 📞 Support

- **AWS Documentation**: https://docs.aws.amazon.com/elasticbeanstalk/
- **HALO Issues**: Create GitHub issues
- **AWS Support**: Available with paid plans

---

**🚀 Ready to deploy HALO to AWS Elastic Beanstalk!**