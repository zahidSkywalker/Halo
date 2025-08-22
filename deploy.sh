#!/bin/bash

# 🚀 HALO Social Media Platform - Quick Deployment Script
# This script helps you deploy HALO to various platforms

set -e  # Exit on any error

echo "🚀 HALO Social Media Platform - Deployment Script"
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    print_success "All dependencies are installed!"
}

# Build the backend
build_backend() {
    print_status "Building backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Build the project
    print_status "Building backend project..."
    npm run build
    
    cd ..
    print_success "Backend built successfully!"
}

# Build the frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building frontend project..."
    npm run build
    
    cd ..
    print_success "Frontend built successfully!"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_warning "Please login to Heroku first:"
        heroku login
    fi
    
    # Create Heroku app for backend
    print_status "Creating Heroku app for backend..."
    heroku create halo-backend-$(date +%s) --buildpack heroku/nodejs
    
    # Add PostgreSQL addon
    print_status "Adding PostgreSQL addon..."
    heroku addons:create heroku-postgresql:hobby-dev
    
    # Set environment variables
    print_status "Setting environment variables..."
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -base64 32)
    heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    # Deploy backend
    print_status "Deploying backend to Heroku..."
    git subtree push --prefix backend heroku main
    
    print_success "Backend deployed to Heroku!"
    print_status "Your backend URL: $(heroku info -s | grep web_url | cut -d= -f2)"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
    fi
    
    cd frontend
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod --yes
    
    cd ..
    print_success "Frontend deployed to Vercel!"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI is not installed. Installing now..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    if ! railway whoami &> /dev/null; then
        print_warning "Please login to Railway first:"
        railway login
    fi
    
    # Deploy backend
    print_status "Deploying backend to Railway..."
    cd backend
    railway up
    cd ..
    
    print_success "Backend deployed to Railway!"
}

# Setup local development
setup_local() {
    print_status "Setting up local development environment..."
    
    # Create .env file for backend
    if [ ! -f backend/.env ]; then
        print_status "Creating backend .env file..."
        cat > backend/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://localhost:5432/halo_social_media

# JWT Configuration
JWT_SECRET=local-development-secret-key
JWT_REFRESH_SECRET=local-development-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
EOF
        print_success "Backend .env file created!"
    fi
    
    # Create .env file for frontend
    if [ ! -f frontend/.env.local ]; then
        print_status "Creating frontend .env.local file..."
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
        print_success "Frontend .env.local file created!"
    fi
    
    print_warning "Please set up your database and Redis before running the application."
    print_status "Database setup: psql -d halo_social_media -f backend/db/init.sql"
    print_status "Redis setup: sudo systemctl start redis-server"
}

# Show deployment options
show_menu() {
    echo ""
    echo "🎯 Choose your deployment option:"
    echo "1) Setup local development environment"
    echo "2) Deploy to Heroku (Backend + Frontend)"
    echo "3) Deploy to Railway (Backend)"
    echo "4) Deploy to Vercel (Frontend)"
    echo "5) Build only (no deployment)"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            check_dependencies
            setup_local
            build_backend
            build_frontend
            print_success "Local development environment is ready!"
            print_status "Start backend: cd backend && npm start"
            print_status "Start frontend: cd frontend && npm run dev"
            ;;
        2)
            check_dependencies
            build_backend
            build_frontend
            deploy_heroku
            deploy_vercel
            print_success "Deployment complete! Check the URLs above."
            ;;
        3)
            check_dependencies
            build_backend
            deploy_railway
            print_success "Backend deployed to Railway!"
            ;;
        4)
            check_dependencies
            build_frontend
            deploy_vercel
            print_success "Frontend deployed to Vercel!"
            ;;
        5)
            check_dependencies
            build_backend
            build_frontend
            print_success "Build complete! Ready for manual deployment."
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
    print_status "Welcome to HALO Social Media Platform deployment!"
    echo ""
    print_status "This script will help you deploy HALO to various platforms."
    print_status "Make sure you have the following ready:"
    echo "  • Node.js 18+ installed"
    echo "  • npm installed"
    echo "  • git repository cloned"
    echo "  • Database setup (for local development)"
    echo ""
    
    show_menu
}

# Run the script
main "$@"