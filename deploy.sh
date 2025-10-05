#!/bin/bash
# Mene Portal Deployment Script
# Complete AI Bridge + RAG + Memory System

set -e

echo "🚀 Starting Mene Portal Deployment..."

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

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found - Docker will handle this"
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 not found - Docker will handle this"
    fi
    
    print_success "System requirements check completed"
}

# Setup directories
setup_directories() {
    print_status "Setting up directories..."
    
    mkdir -p data/{chroma,screenshots,logs,memory,processed,redis}
    mkdir -p ssl
    
    print_success "Directories created"
}

# Environment setup
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Mene Portal Environment Configuration

# Node.js Configuration
NODE_ENV=production
PORT=3000

# ChromaDB Configuration
CHROMA_URL=http://chroma:8000

# Feature Flags
RAG_ENABLED=true
MEMORY_ENABLED=true
BROWSER_ENABLED=true

# Browser Configuration
BROWSER_HEADLESS=true

# Memory Configuration
MEMORY_RETENTION=30d
AUTO_PROCESS_DOCUMENTS=true

# Security
ENCRYPTION_KEY=your-32-char-encryption-key-here
SESSION_SECRET=your-session-secret-here

# API Configuration
MAX_CONCURRENT_REQUESTS=10
RATE_LIMIT=100

# AI Drive Configuration
AI_DRIVE_PATH=/mnt/aidrive
VERITAS_MEMORY_PATH=/mnt/aidrive/veritas_ai_memory
EOF
        print_success ".env file created - please update with your values"
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies (local development)
install_dependencies() {
    if [ "$1" = "local" ]; then
        print_status "Installing local dependencies..."
        
        if command -v npm &> /dev/null; then
            npm install
            print_success "Node.js dependencies installed"
        fi
        
        if command -v python3 &> /dev/null && command -v pip3 &> /dev/null; then
            pip3 install -r requirements.python.txt
            python3 -m playwright install chromium
            print_success "Python dependencies installed"
        fi
    fi
}

# Docker deployment
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check health
    print_status "Checking service health..."
    
    # Check Node.js service
    if curl -f http://localhost:3000/api/agents > /dev/null 2>&1; then
        print_success "Mene Portal API is healthy"
    else
        print_warning "Mene Portal API health check failed"
    fi
    
    # Check ChromaDB
    if curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        print_success "ChromaDB is healthy"
    else
        print_warning "ChromaDB health check failed"
    fi
    
    print_success "Docker deployment completed"
}

# Local development deployment
deploy_local() {
    print_status "Deploying for local development..."
    
    install_dependencies "local"
    
    # Start with PM2
    if command -v pm2 &> /dev/null || command -v npx &> /dev/null; then
        print_status "Starting with PM2..."
        npx pm2 start ecosystem.config.js
        print_success "Mene Portal started with PM2"
    else
        print_status "Starting with Node.js directly..."
        node server.js &
        print_success "Mene Portal started"
    fi
}

# Main deployment function
main() {
    echo "🧠 Mene Portal - AI Bridge + RAG + Memory System"
    echo "================================================"
    
    # Parse command line arguments
    DEPLOYMENT_TYPE=${1:-"docker"}
    
    case $DEPLOYMENT_TYPE in
        "docker")
            print_status "Docker deployment selected"
            check_requirements
            setup_directories
            setup_environment
            deploy_docker
            ;;
        "local")
            print_status "Local development deployment selected"
            setup_directories
            setup_environment
            deploy_local
            ;;
        "setup")
            print_status "Setup mode - preparing environment only"
            setup_directories
            setup_environment
            install_dependencies "local"
            ;;
        *)
            echo "Usage: $0 [docker|local|setup]"
            echo "  docker - Full Docker deployment (default)"
            echo "  local  - Local development deployment"
            echo "  setup  - Setup environment only"
            exit 1
            ;;
    esac
    
    # Print completion message
    echo ""
    echo "🎉 Mene Portal Deployment Complete!"
    echo "=================================="
    echo ""
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        echo "🌐 Portal URL: http://localhost:3000"
        echo "📚 ChromaDB: http://localhost:8000"
        echo "🐍 Python Service: http://localhost:8888"
        echo ""
        echo "📋 Useful commands:"
        echo "  docker-compose logs -f          # View logs"
        echo "  docker-compose restart         # Restart services"
        echo "  docker-compose down            # Stop services"
    elif [ "$DEPLOYMENT_TYPE" = "local" ]; then
        echo "🌐 Portal URL: http://localhost:3000"
        echo ""
        echo "📋 Useful commands:"
        echo "  npx pm2 status                 # Check PM2 status"
        echo "  npx pm2 logs mene-portal       # View logs"
        echo "  npx pm2 restart mene-portal    # Restart service"
    fi
    
    echo ""
    print_success "Your Mene Portal with integrated LTM, RAG, and Browser automation is ready!"
}

# Run main function
main "$@"