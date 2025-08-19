#!/bin/bash

# HALO Platform Health Check Script
# This script checks if all services are running and healthy

set -e

echo "🔍 HALO Platform Health Check"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:3001"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
DATABASE_URL=${DATABASE_URL:-"postgresql://halo_user:password@localhost:5432/halo_db"}
REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=1
    fi
}

# Function to check if a service is responding
check_service() {
    local url=$1
    local name=$2
    local timeout=${3:-5}
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        print_status 0 "$name is running"
        return 0
    else
        print_status 1 "$name is not responding"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo "Checking database connection..."
    
    # Extract database info from URL
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # Try to connect using psql if available
        if command -v psql &> /dev/null; then
            if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                print_status 0 "Database connection successful"
            else
                print_status 1 "Database connection failed"
            fi
        else
            echo -e "${YELLOW}⚠️  psql not available, skipping database connection test${NC}"
        fi
    else
        print_status 1 "Invalid DATABASE_URL format"
    fi
}

# Function to check Redis connection
check_redis() {
    echo "Checking Redis connection..."
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
            print_status 0 "Redis connection successful"
        else
            print_status 1 "Redis connection failed"
        fi
    else
        echo -e "${YELLOW}⚠️  redis-cli not available, skipping Redis connection test${NC}"
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    echo "Checking API endpoints..."
    
    # Health check
    if curl -f -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_status 0 "Backend health endpoint"
    else
        print_status 1 "Backend health endpoint"
    fi
    
    # API docs
    if curl -f -s "$BACKEND_URL/api/docs" > /dev/null 2>&1; then
        print_status 0 "API documentation"
    else
        print_status 1 "API documentation"
    fi
}

# Function to check frontend
check_frontend() {
    echo "Checking frontend..."
    
    if curl -f -s "$FRONTEND_URL" > /dev/null 2>&1; then
        print_status 0 "Frontend is accessible"
    else
        print_status 1 "Frontend is not accessible"
    fi
}

# Function to check Docker containers
check_docker_containers() {
    echo "Checking Docker containers..."
    
    if command -v docker &> /dev/null; then
        # Check if containers are running
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "halo"; then
            print_status 0 "Docker containers are running"
            
            # List running containers
            echo "Running containers:"
            docker ps --format "  - {{.Names}}: {{.Status}}" | grep "halo"
        else
            print_status 1 "No HALO Docker containers found"
        fi
    else
        echo -e "${YELLOW}⚠️  Docker not available, skipping container check${NC}"
    fi
}

# Function to check environment variables
check_environment() {
    echo "Checking environment variables..."
    
    required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status 0 "Required environment variables are set"
    else
        print_status 1 "Missing environment variables: ${missing_vars[*]}"
    fi
}

# Function to check disk space
check_disk_space() {
    echo "Checking disk space..."
    
    # Get available disk space in GB
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ "$available_space" -gt 1 ]; then
        print_status 0 "Sufficient disk space available (${available_space}GB)"
    else
        print_status 1 "Low disk space (${available_space}GB available)"
    fi
}

# Function to check memory usage
check_memory() {
    echo "Checking memory usage..."
    
    if command -v free &> /dev/null; then
        # Get available memory in GB
        available_memory=$(free -g | awk 'NR==2 {print $7}')
        
        if [ "$available_memory" -gt 0 ]; then
            print_status 0 "Sufficient memory available (${available_memory}GB)"
        else
            print_status 1 "Low memory available (${available_memory}GB)"
        fi
    else
        echo -e "${YELLOW}⚠️  free command not available, skipping memory check${NC}"
    fi
}

# Main health check
main() {
    FAILED=0
    
    echo "Starting health check at $(date)"
    echo ""
    
    # Check environment
    check_environment
    echo ""
    
    # Check system resources
    check_disk_space
    check_memory
    echo ""
    
    # Check Docker containers
    check_docker_containers
    echo ""
    
    # Check database and Redis
    check_database
    check_redis
    echo ""
    
    # Check services
    check_service "$BACKEND_URL/health" "Backend service"
    check_service "$FRONTEND_URL" "Frontend service"
    echo ""
    
    # Check API endpoints
    check_api_endpoints
    echo ""
    
    # Summary
    echo "=============================="
    echo "Health Check Summary"
    echo "=============================="
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! HALO platform is healthy.${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some checks failed. Please review the issues above.${NC}"
        exit 1
    fi
}

# Run health check
main "$@"