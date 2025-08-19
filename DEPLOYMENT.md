# HALO Platform Deployment Guide

This guide covers deploying the HALO social media platform to various environments.

## 🚀 Quick Start (Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd halo
```

### 2. Environment Configuration
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your configuration
```

### 3. Start Development Environment
```bash
# Start all services
docker-compose up -d

# Install dependencies (if developing locally)
cd backend && npm install
cd ../frontend && npm install

# Run database migrations
cd backend && npm run migrate

# Seed database with sample data
cd backend && npm run seed
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🏭 Production Deployment

### Option 1: Docker Compose (Recommended)

#### 1. Production Environment Setup
```bash
# Create production environment file
cp backend/.env.example backend/.env.prod
cp frontend/.env.example frontend/.env.prod

# Edit production environment variables
nano backend/.env.prod
nano frontend/.env.prod
```

#### 2. Deploy with Docker Compose
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml --env-file backend/.env.prod up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 3. Database Setup
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Option 2: Kubernetes Deployment

#### 1. Create Kubernetes Cluster
```bash
# Using minikube for local testing
minikube start

# Or use a cloud provider (GKE, EKS, AKS)
```

#### 2. Apply Kubernetes Manifests
```bash
# Create namespace
kubectl create namespace halo

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

#### 3. Check Deployment Status
```bash
kubectl get pods -n halo
kubectl get services -n halo
kubectl get ingress -n halo
```

### Option 3: Cloud Platform Deployment

#### AWS Deployment (ECS/Fargate)

1. **Setup AWS CLI and ECR**
```bash
aws configure
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

2. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name halo-backend
aws ecr create-repository --repository-name halo-frontend
```

3. **Build and Push Images**
```bash
# Backend
docker build -t halo-backend ./backend
docker tag halo-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/halo-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/halo-backend:latest

# Frontend
docker build -t halo-frontend ./frontend
docker tag halo-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/halo-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/halo-frontend:latest
```

4. **Deploy with CloudFormation**
```bash
aws cloudformation create-stack --stack-name halo-platform --template-body file://aws/cloudformation.yaml
```

#### Google Cloud Platform (GKE)

1. **Create GKE Cluster**
```bash
gcloud container clusters create halo-cluster --zone us-central1-a --num-nodes 3
gcloud container clusters get-credentials halo-cluster --zone us-central1-a
```

2. **Deploy Application**
```bash
kubectl apply -f gcp/k8s/
```

#### Azure (AKS)

1. **Create AKS Cluster**
```bash
az aks create --resource-group halo-rg --name halo-cluster --node-count 3
az aks get-credentials --resource-group halo-rg --name halo-cluster
```

2. **Deploy Application**
```bash
kubectl apply -f azure/k8s/
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=halo-media-bucket

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@halo.com

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=https://yourdomain.com
BCRYPT_ROUNDS=12
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Database Configuration

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE halo_prod;

-- Create user
CREATE USER halo_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE halo_prod TO halo_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Redis Configuration
```bash
# Redis configuration for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🔒 Security Considerations

### SSL/TLS Configuration
```bash
# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/nginx.key -out nginx/ssl/nginx.crt

# Configure Nginx with SSL
# See nginx/nginx.conf for SSL configuration
```

### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Database Security
```bash
# PostgreSQL security settings
# Edit postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

# Edit pg_hba.conf
hostssl all all 0.0.0.0/0 md5
```

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000
# Jaeger: http://localhost:16686
```

### Log Management
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Setup log aggregation with ELK Stack
docker-compose -f docker-compose.prod.yml -f docker-compose.logging.yml up -d
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy HALO Platform

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Add your deployment commands here
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### Redis Connection Issues
```bash
# Check Redis connectivity
docker-compose -f docker-compose.prod.yml exec backend redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

#### Application Startup Issues
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_posts_author_created ON posts(author_id, created_at);
CREATE INDEX CONCURRENTLY idx_comments_post_created ON comments(post_id, created_at);
CREATE INDEX CONCURRENTLY idx_notifications_user_read ON notifications(user_id, is_read);
```

#### Redis Optimization
```bash
# Configure Redis for better performance
maxmemory 4gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 📞 Support

For deployment issues and support:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the logs for error messages
- Ensure all environment variables are properly configured

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### Backup and Recovery
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U halo_user halo_prod > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U halo_user halo_prod < backup.sql
```