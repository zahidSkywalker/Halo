#!/bin/bash

# 🚀 HALO Social Media Platform - AWS Free Tier Deployment Script
# This script deploys HALO to AWS using free tier services

set -e  # Exit on any error

echo "🚀 HALO Social Media Platform - AWS Free Tier Deployment"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check AWS CLI configuration
check_aws_config() {
    print_status "Checking AWS configuration..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run:"
        echo "aws configure"
        echo ""
        echo "You'll need:"
        echo "- AWS Access Key ID"
        echo "- AWS Secret Access Key"
        echo "- Default region (e.g., us-east-1)"
        echo "- Default output format (json)"
        exit 1
    fi
    
    print_success "AWS CLI configured successfully!"
}

# Create S3 bucket for media storage
create_s3_bucket() {
    print_status "Creating S3 bucket for media storage..."
    
    BUCKET_NAME="halo-media-$(date +%s)"
    
    # Create bucket
    aws s3 mb s3://$BUCKET_NAME
    
    # Configure bucket for static website hosting
    aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document error.html
    
    # Set bucket policy for public read access
    cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
    
    # Configure CORS
    cat > cors-policy.json << EOF
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
EOF
    
    aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-policy.json
    
    echo $BUCKET_NAME > .s3-bucket-name
    print_success "S3 bucket created: $BUCKET_NAME"
}

# Create RDS PostgreSQL instance
create_rds_instance() {
    print_status "Creating RDS PostgreSQL instance..."
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create DB subnet group
    aws rds create-db-subnet-group \
        --db-subnet-group-name halo-db-subnet-group \
        --db-subnet-group-description "HALO database subnet group" \
        --subnet-ids subnet-12345678 subnet-87654321 2>/dev/null || true
    
    # Create RDS instance (free tier)
    aws rds create-db-instance \
        --db-instance-identifier halo-db \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --master-username halo_admin \
        --master-user-password $DB_PASSWORD \
        --allocated-storage 20 \
        --storage-type gp2 \
        --db-name halo_social_media \
        --vpc-security-group-ids sg-12345678 \
        --db-subnet-group-name halo-db-subnet-group \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "sun:04:00-sun:05:00" \
        --storage-encrypted \
        --deletion-protection
    
    echo $DB_PASSWORD > .db-password
    print_success "RDS instance created: halo-db"
    print_warning "Database password saved to .db-password"
}

# Create Elastic Beanstalk application
create_elastic_beanstalk() {
    print_status "Creating Elastic Beanstalk application..."
    
    # Create application
    aws elasticbeanstalk create-application \
        --application-name halo-backend \
        --description "HALO Social Media Platform Backend"
    
    # Create environment
    aws elasticbeanstalk create-environment \
        --application-name halo-backend \
        --environment-name halo-backend-prod \
        --solution-stack-name "64bit Amazon Linux 2 v5.8.2 running Node.js 18" \
        --option-settings file://eb-config.json
    
    print_success "Elastic Beanstalk application created"
}

# Create EB configuration
create_eb_config() {
    print_status "Creating Elastic Beanstalk configuration..."
    
    cat > eb-config.json << EOF
[
    {
        "Namespace": "aws:autoscaling:launchconfiguration",
        "OptionName": "IamInstanceProfile",
        "Value": "aws-elasticbeanstalk-ec2-role"
    },
    {
        "Namespace": "aws:elasticbeanstalk:environment",
        "OptionName": "EnvironmentType",
        "Value": "SingleInstance"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "NODE_ENV",
        "Value": "production"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "PORT",
        "Value": "8081"
    }
]
EOF
    
    print_success "EB configuration created"
}

# Create Amplify app for frontend
create_amplify_app() {
    print_status "Creating Amplify app for frontend..."
    
    # Create Amplify app
    aws amplify create-app \
        --name halo-frontend \
        --description "HALO Social Media Platform Frontend"
    
    # Get app ID
    APP_ID=$(aws amplify list-apps --query 'apps[?name==`halo-frontend`].appId' --output text)
    
    # Create branch
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name main \
        --description "Main branch"
    
    echo $APP_ID > .amplify-app-id
    print_success "Amplify app created: $APP_ID"
}

# Update backend environment variables
update_backend_env() {
    print_status "Updating backend environment variables..."
    
    # Get S3 bucket name
    S3_BUCKET=$(cat .s3-bucket-name)
    
    # Get database password
    DB_PASSWORD=$(cat .db-password)
    
    # Get RDS endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier halo-db --query 'DBInstances[0].Endpoint.Address' --output text)
    
    # Update EB environment
    aws elasticbeanstalk update-environment \
        --environment-name halo-backend-prod \
        --option-settings file://eb-env-vars.json
    
    print_success "Backend environment variables updated"
}

# Create environment variables file
create_env_vars() {
    print_status "Creating environment variables file..."
    
    S3_BUCKET=$(cat .s3-bucket-name)
    DB_PASSWORD=$(cat .db-password)
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier halo-db --query 'DBInstances[0].Endpoint.Address' --output text)
    
    cat > eb-env-vars.json << EOF
[
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "DATABASE_URL",
        "Value": "postgresql://halo_admin:$DB_PASSWORD@$DB_ENDPOINT:5432/halo_social_media"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "JWT_SECRET",
        "Value": "$(openssl rand -base64 32)"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "JWT_REFRESH_SECRET",
        "Value": "$(openssl rand -base64 32)"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "AWS_S3_BUCKET",
        "Value": "$S3_BUCKET"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "NODE_ENV",
        "Value": "production"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "PORT",
        "Value": "8081"
    }
]
EOF
    
    print_success "Environment variables file created"
}

# Deploy backend to Elastic Beanstalk
deploy_backend() {
    print_status "Deploying backend to Elastic Beanstalk..."
    
    cd backend
    
    # Create .ebextensions directory
    mkdir -p .ebextensions
    
    # Create Procfile
    echo "web: npm start" > Procfile
    
    # Create .ebextensions configuration
    cat > .ebextensions/01_environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8081
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
EOF
    
    # Initialize EB application
    eb init halo-backend --platform node.js --region us-east-1 --source codecommit/halo-backend
    
    # Deploy
    eb deploy halo-backend-prod
    
    cd ..
    print_success "Backend deployed to Elastic Beanstalk"
}

# Deploy frontend to Amplify
deploy_frontend() {
    print_status "Deploying frontend to Amplify..."
    
    cd frontend
    
    # Build the project
    npm run build
    
    # Get app ID
    APP_ID=$(cat ../.amplify-app-id)
    
    # Deploy to Amplify
    aws amplify start-job \
        --app-id $APP_ID \
        --branch-name main \
        --job-type RELEASE \
        --source-url https://github.com/zahidSkyWalker/Halo.git \
        --source-branch main \
        --source-version HEAD
    
    cd ..
    print_success "Frontend deployed to Amplify"
}

# Setup database schema
setup_database() {
    print_status "Setting up database schema..."
    
    # Get database endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier halo-db --query 'DBInstances[0].Endpoint.Address' --output text)
    DB_PASSWORD=$(cat .db-password)
    
    # Wait for database to be available
    print_status "Waiting for database to be available..."
    aws rds wait db-instance-available --db-instance-identifier halo-db
    
    # Run database schema
    PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U halo_admin -d halo_social_media -f backend/db/init.sql
    
    print_success "Database schema setup complete"
}

# Show deployment summary
show_summary() {
    print_success "🎉 HALO Social Media Platform deployed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "======================"
    echo ""
    
    # Get backend URL
    BACKEND_URL=$(aws elasticbeanstalk describe-environments --environment-names halo-backend-prod --query 'Environments[0].CNAME' --output text)
    echo "🔧 Backend URL: http://$BACKEND_URL"
    
    # Get frontend URL
    APP_ID=$(cat .amplify-app-id)
    FRONTEND_URL=$(aws amplify get-app --app-id $APP_ID --query 'app.defaultDomain' --output text)
    echo "🎨 Frontend URL: https://$FRONTEND_URL"
    
    # Get S3 bucket
    S3_BUCKET=$(cat .s3-bucket-name)
    echo "📁 Media Storage: s3://$S3_BUCKET"
    
    # Get database info
    DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier halo-db --query 'DBInstances[0].Endpoint.Address' --output text)
    echo "🗄️ Database: $DB_ENDPOINT"
    
    echo ""
    echo "🔐 Credentials:"
    echo "==============="
    echo "Database Password: $(cat .db-password)"
    echo ""
    
    echo "📚 Next Steps:"
    echo "=============="
    echo "1. Update frontend API endpoint to: http://$BACKEND_URL"
    echo "2. Test user registration and login"
    echo "3. Create your first post"
    echo "4. Invite users to join HALO!"
    echo ""
    
    echo "💰 Cost Information:"
    echo "==================="
    echo "✅ All services are within AWS Free Tier limits"
    echo "✅ 12 months free for new accounts"
    echo "✅ No charges for the first year"
    echo ""
    
    echo "🚀 Your social media platform is ready to connect people!"
}

# Main deployment function
main_deployment() {
    print_status "Starting HALO deployment to AWS Free Tier..."
    
    # Check prerequisites
    check_aws_config
    
    # Create infrastructure
    create_s3_bucket
    create_rds_instance
    create_eb_config
    create_elastic_beanstalk
    create_amplify_app
    
    # Setup environment
    create_env_vars
    update_backend_env
    
    # Deploy applications
    deploy_backend
    deploy_frontend
    
    # Setup database
    setup_database
    
    # Show summary
    show_summary
}

# Show menu
show_menu() {
    echo ""
    echo "🎯 Choose your deployment option:"
    echo "1) Full deployment (Backend + Frontend + Database)"
    echo "2) Deploy backend only"
    echo "3) Deploy frontend only"
    echo "4) Setup database only"
    echo "5) Show deployment status"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            main_deployment
            ;;
        2)
            check_aws_config
            create_eb_config
            deploy_backend
            ;;
        3)
            check_aws_config
            create_amplify_app
            deploy_frontend
            ;;
        4)
            check_aws_config
            create_rds_instance
            setup_database
            ;;
        5)
            show_summary
            ;;
        6)
            print_status "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Main execution
main() {
    echo ""
    print_status "Welcome to HALO Social Media Platform AWS deployment!"
    echo ""
    print_status "This script will deploy HALO to AWS Free Tier services."
    print_status "Make sure you have:"
    echo "  • AWS account with free tier access"
    echo "  • AWS CLI configured with credentials"
    echo "  • Sufficient permissions to create resources"
    echo ""
    
    show_menu
}

# Run the script
main "$@"