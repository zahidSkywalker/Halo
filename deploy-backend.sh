#!/bin/bash

# 🚀 HALO Backend - AWS Elastic Beanstalk Deployment Script

set -e  # Exit on any error

echo "🚀 HALO Backend - AWS Elastic Beanstalk Deployment"
echo "=================================================="

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

# Check if AWS CLI is available
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run: aws configure"
        exit 1
    fi
    
    print_success "AWS CLI configured successfully!"
}

# Build the backend
build_backend() {
    print_status "Building backend application..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci --production
    
    # Build TypeScript
    print_status "Building TypeScript..."
    npm run build
    
    # Create deployment package
    print_status "Creating deployment package..."
    cd ..
    zip -r backend-deploy.zip backend/ -x "backend/node_modules/*" "backend/src/*" "backend/.git/*" "backend/.env*"
    
    print_success "Backend built successfully!"
}

# Deploy to Elastic Beanstalk
deploy_to_eb() {
    print_status "Deploying to AWS Elastic Beanstalk..."
    
    # Check if EB CLI is available
    if ! command -v eb &> /dev/null; then
        print_warning "EB CLI not found. Installing..."
        pip install awsebcli
    fi
    
    # Initialize EB application if not exists
    if [ ! -f ".elasticbeanstalk/config.yml" ]; then
        print_status "Initializing Elastic Beanstalk application..."
        eb init halo-backend --platform node.js --region us-east-1
    fi
    
    # Create environment if not exists
    if ! eb status | grep -q "Environment: halo-backend-prod"; then
        print_status "Creating Elastic Beanstalk environment..."
        eb create halo-backend-prod --instance-type t3.micro --single-instance
    fi
    
    # Deploy
    print_status "Deploying application..."
    eb deploy halo-backend-prod
    
    print_success "Backend deployed successfully!"
}

# Show deployment info
show_deployment_info() {
    print_status "Getting deployment information..."
    
    # Get the environment URL
    ENV_URL=$(eb status halo-backend-prod | grep "CNAME" | awk '{print $2}')
    
    echo ""
    echo "🎉 HALO Backend Deployed Successfully!"
    echo "======================================"
    echo "🌐 Backend URL: http://$ENV_URL"
    echo "📚 API Docs: http://$ENV_URL/api/docs"
    echo "💚 Health Check: http://$ENV_URL/health"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Update your frontend .env.local with:"
    echo "   NEXT_PUBLIC_API_URL=http://$ENV_URL"
    echo "2. Test the API endpoints"
    echo "3. Update CORS_ORIGIN in backend environment variables"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting HALO backend deployment..."
    
    # Check prerequisites
    check_aws_cli
    
    # Build and deploy
    build_backend
    deploy_to_eb
    
    # Show results
    show_deployment_info
}

# Run the script
main "$@"