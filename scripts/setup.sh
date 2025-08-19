#!/bin/bash

# HALO Platform Setup Script
# This script sets up the development environment for the HALO social media platform

set -e

echo "🚀 HALO Platform Setup Script"
echo "=============================="

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

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Some features may not work properly."
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION is installed"
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Created frontend/.env.local"
    else
        print_warning "frontend/.env.local already exists, skipping..."
    fi
}

# Start Docker services
start_services() {
    print_status "Starting Docker services..."
    docker-compose up -d
    
    print_success "Docker services started"
    print_status "Waiting for services to be ready..."
    sleep 10
}

# Install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    cd backend
    npm run migrate
    cd ..
    
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database with sample data..."
    cd backend
    npm run seed
    cd ..
    
    print_success "Database seeded with sample data"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "All services are running"
    else
        print_error "Some services are not running. Check with 'docker-compose ps'"
        exit 1
    fi
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend API is healthy"
    else
        print_warning "Backend API health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend health check failed"
    fi
}

# Display final information
show_final_info() {
    echo ""
    echo "🎉 HALO Platform Setup Complete!"
    echo "================================"
    echo ""
    echo "Your HALO platform is now running at:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔧 Backend API: http://localhost:3001"
    echo "  📚 API Documentation: http://localhost:3001/api/docs"
    echo ""
    echo "Default accounts:"
    echo "  👑 Admin: admin@halo.com / admin123"
    echo "  👤 User: user@halo.com / user123"
    echo "  👥 Test users: john@halo.com, jane@halo.com, mike@halo.com, sarah@halo.com / test123"
    echo ""
    echo "Useful commands:"
    echo "  📊 View logs: docker-compose logs -f"
    echo "  🛑 Stop services: docker-compose down"
    echo "  🔄 Restart services: docker-compose restart"
    echo "  🧹 Clean up: docker-compose down -v"
    echo ""
    echo "Happy coding! 🚀"
}

# Main setup function
main() {
    echo "Starting HALO platform setup..."
    echo ""
    
    check_docker
    check_nodejs
    setup_environment
    start_services
    install_dependencies
    run_migrations
    seed_database
    check_health
    show_final_info
}

# Run main function
main "$@"