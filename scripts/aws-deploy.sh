#!/bin/bash

# HALO Platform - AWS Elastic Beanstalk Deployment Script
# This script automates the deployment process to AWS Elastic Beanstalk

set -e

echo "🚀 HALO Platform - AWS Elastic Beanstalk Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_APP_NAME="halo-backend"
FRONTEND_APP_NAME="halo-frontend"
BACKEND_ENV_NAME="halo-backend-prod"
FRONTEND_ENV_NAME="halo-frontend-prod"
REGION="us-east-1"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    echo "Checking AWS CLI installation..."
    if command -v aws &> /dev/null; then
        print_status 0 "AWS CLI is installed"
    else
        print_status 1 "AWS CLI is not installed. Please install it first."
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    echo "Checking AWS credentials..."
    if aws sts get-caller-identity &> /dev/null; then
        print_status 0 "AWS credentials are configured"
        echo -e "${BLUE}Account: $(aws sts get-caller-identity --query 'Account' --output text)${NC}"
        echo -e "${BLUE}User: $(aws sts get-caller-identity --query 'Arn' --output text)${NC}"
    else
        print_status 1 "AWS credentials are not configured. Please run 'aws configure'"
    fi
}

# Function to check if EB CLI is installed
check_eb_cli() {
    echo "Checking EB CLI installation..."
    if command -v eb &> /dev/null; then
        print_status 0 "EB CLI is installed"
    else
        echo -e "${YELLOW}⚠️  EB CLI is not installed. Installing now...${NC}"
        pip install awsebcli
        print_status 0 "EB CLI installed"
    fi
}

# Function to deploy backend
deploy_backend() {
    echo -e "\n${BLUE}Deploying Backend to Elastic Beanstalk...${NC}"
    
    cd backend
    
    # Check if .elasticbeanstalk directory exists
    if [ ! -d ".elasticbeanstalk" ]; then
        echo "Initializing EB application for backend..."
        eb init $BACKEND_APP_NAME --region $REGION --platform "Node.js 18"
    fi
    
    # Check if environment exists
    if eb status $BACKEND_ENV_NAME &> /dev/null; then
        echo "Environment $BACKEND_ENV_NAME exists. Updating..."
        eb deploy $BACKEND_ENV_NAME
    else
        echo "Creating new environment $BACKEND_ENV_NAME..."
        eb create $BACKEND_ENV_NAME \
            --instance-type t3.small \
            --single-instance \
            --vpc.elbscheme public
    fi
    
    # Get the backend URL
    BACKEND_URL=$(eb status $BACKEND_ENV_NAME --output json | jq -r '.CNAME')
    echo -e "${GREEN}Backend deployed successfully!${NC}"
    echo -e "${BLUE}Backend URL: https://$BACKEND_URL${NC}"
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "\n${BLUE}Deploying Frontend to Elastic Beanstalk...${NC}"
    
    cd frontend
    
    # Update environment variables with backend URL
    if [ ! -z "$BACKEND_URL" ]; then
        echo "Updating frontend environment variables..."
        eb setenv \
            NEXT_PUBLIC_API_URL=https://$BACKEND_URL \
            NEXT_PUBLIC_WS_URL=wss://$BACKEND_URL \
            NEXTAUTH_URL=https://$FRONTEND_URL \
            NEXTAUTH_SECRET=$(openssl rand -base64 32)
    fi
    
    # Check if .elasticbeanstalk directory exists
    if [ ! -d ".elasticbeanstalk" ]; then
        echo "Initializing EB application for frontend..."
        eb init $FRONTEND_APP_NAME --region $REGION --platform "Node.js 18"
    fi
    
    # Check if environment exists
    if eb status $FRONTEND_ENV_NAME &> /dev/null; then
        echo "Environment $FRONTEND_ENV_NAME exists. Updating..."
        eb deploy $FRONTEND_ENV_NAME
    else
        echo "Creating new environment $FRONTEND_ENV_NAME..."
        eb create $FRONTEND_ENV_NAME \
            --instance-type t3.small \
            --single-instance \
            --vpc.elbscheme public
    fi
    
    # Get the frontend URL
    FRONTEND_URL=$(eb status $FRONTEND_ENV_NAME --output json | jq -r '.CNAME')
    echo -e "${GREEN}Frontend deployed successfully!${NC}"
    echo -e "${BLUE}Frontend URL: https://$FRONTEND_URL${NC}"
    
    cd ..
}

# Function to configure environment variables
configure_backend_env() {
    echo -e "\n${BLUE}Configuring Backend Environment Variables...${NC}"
    
    cd backend
    
    # Prompt for database configuration
    echo -e "${YELLOW}Please provide the following information:${NC}"
    read -p "RDS Endpoint: " RDS_ENDPOINT
    read -p "RDS Password: " -s RDS_PASSWORD
    echo
    read -p "Redis Endpoint: " REDIS_ENDPOINT
    read -p "Frontend Domain (e.g., yourdomain.com): " FRONTEND_DOMAIN
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    
    # Set environment variables
    eb setenv \
        NODE_ENV=production \
        DATABASE_URL=postgresql://halo_admin:$RDS_PASSWORD@$RDS_ENDPOINT:5432/halo_db \
        REDIS_URL=redis://$REDIS_ENDPOINT:6379 \
        JWT_SECRET=$JWT_SECRET \
        CORS_ORIGIN=https://$FRONTEND_DOMAIN \
        RATE_LIMIT_MAX_REQUESTS=100 \
        RATE_LIMIT_WINDOW_MS=900000 \
        BCRYPT_ROUNDS=12 \
        LOG_LEVEL=info
    
    echo -e "${GREEN}Backend environment variables configured!${NC}"
    
    cd ..
}

# Function to run health checks
run_health_checks() {
    echo -e "\n${BLUE}Running Health Checks...${NC}"
    
    if [ ! -z "$BACKEND_URL" ]; then
        echo "Checking backend health..."
        if curl -f -s "https://$BACKEND_URL/health" > /dev/null; then
            print_status 0 "Backend health check passed"
        else
            print_status 1 "Backend health check failed"
        fi
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "Checking frontend health..."
        if curl -f -s "https://$FRONTEND_URL" > /dev/null; then
            print_status 0 "Frontend health check passed"
        else
            print_status 1 "Frontend health check failed"
        fi
    fi
}

# Function to display deployment summary
show_summary() {
    echo -e "\n${GREEN}🎉 Deployment Summary${NC}"
    echo "======================"
    
    if [ ! -z "$BACKEND_URL" ]; then
        echo -e "${BLUE}Backend URL:${NC} https://$BACKEND_URL"
        echo -e "${BLUE}Backend Health:${NC} https://$BACKEND_URL/health"
        echo -e "${BLUE}API Documentation:${NC} https://$BACKEND_URL/api/docs"
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo -e "${BLUE}Frontend URL:${NC} https://$FRONTEND_URL"
    fi
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Configure your domain in Route 53"
    echo "2. Set up SSL certificates in AWS Certificate Manager"
    echo "3. Configure CloudWatch monitoring"
    echo "4. Set up CI/CD with GitHub Actions"
    echo "5. Test the application thoroughly"
}

# Function to show help
show_help() {
    echo "HALO Platform - AWS Elastic Beanstalk Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backend-only     Deploy only the backend"
    echo "  --frontend-only    Deploy only the frontend"
    echo "  --configure-env    Configure environment variables only"
    echo "  --health-check     Run health checks only"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 Deploy both backend and frontend"
    echo "  $0 --backend-only  Deploy only backend"
    echo "  $0 --configure-env Configure environment variables"
}

# Main deployment function
main() {
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --backend-only)
            check_aws_cli
            check_aws_credentials
            check_eb_cli
            configure_backend_env
            deploy_backend
            run_health_checks
            show_summary
            ;;
        --frontend-only)
            check_aws_cli
            check_aws_credentials
            check_eb_cli
            deploy_frontend
            run_health_checks
            show_summary
            ;;
        --configure-env)
            check_aws_cli
            check_aws_credentials
            check_eb_cli
            configure_backend_env
            ;;
        --health-check)
            run_health_checks
            ;;
        "")
            check_aws_cli
            check_aws_credentials
            check_eb_cli
            configure_backend_env
            deploy_backend
            deploy_frontend
            run_health_checks
            show_summary
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"