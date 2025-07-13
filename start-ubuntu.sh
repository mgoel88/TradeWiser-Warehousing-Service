#!/bin/bash
# TradeWiser Platform - Ubuntu-Compatible Development Setup Script

set -e

echo "🚀 TradeWiser Platform - Ubuntu Docker Setup"
echo "============================================="

# Ubuntu system compatibility check
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Detected Linux system (Ubuntu compatible)"
    # Check if running on Ubuntu
    if command -v lsb_release &> /dev/null; then
        DISTRO=$(lsb_release -si)
        VERSION=$(lsb_release -sr)
        echo "📋 System: $DISTRO $VERSION"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Detected macOS system"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "✅ Detected Windows system with Unix tools"
else
    echo "⚠️  Unknown system type: $OSTYPE"
fi

# Check and install Docker if needed (Ubuntu)
install_docker_ubuntu() {
    echo "🐳 Installing Docker on Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed. Please log out and back in for group changes to take effect."
    echo "   Or run: newgrp docker"
}

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v apt-get &> /dev/null; then
        read -p "Would you like to install Docker automatically? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker_ubuntu
            # Apply group changes without logout
            exec sg docker "$0 $@"
        else
            echo "Please install Docker manually:"
            echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
            echo "   sudo sh get-docker.sh"
            exit 1
        fi
    else
        echo "Please install Docker manually from: https://docs.docker.com/get-docker/"
        exit 1
    fi
fi

# Verify Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Starting Docker service..."
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        echo "Please start Docker Desktop or the Docker daemon."
        exit 1
    fi
fi

echo "✅ Docker is installed and running"

# Check Docker Compose
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo "✅ Using docker-compose (standalone)"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "✅ Using docker compose (plugin)"
else
    echo "❌ Docker Compose is not available."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        COMPOSE_CMD="docker-compose"
        echo "✅ Docker Compose installed"
    else
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
fi

# Environment file setup
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.docker..."
    cp .env.docker .env
    echo "✅ .env file created."
else
    echo "✅ .env file already exists."
    echo "💡 If you're having issues, you can reset it with: cp .env.docker .env"
fi

# Validate environment configuration
echo "🔍 Validating environment configuration..."
if [ ! -f .env.docker ]; then
    echo "❌ .env.docker not found. Please ensure it exists."
    exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL not found in .env file."
    exit 1
fi

echo "✅ Environment configuration looks good."

# Create necessary directories with proper permissions
echo "📁 Creating necessary directories..."
mkdir -p uploads logs backups certs
chmod 755 uploads logs backups
chmod 700 certs

# Ubuntu-specific optimizations
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v sysctl &> /dev/null; then
    echo "🔧 Applying Ubuntu optimizations..."
    # Enable memory overcommit for Redis
    echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf > /dev/null || true
    sudo sysctl vm.overcommit_memory=1 || true
    
    # Disable transparent huge pages for better database performance
    echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled > /dev/null || true
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
$COMPOSE_CMD down || true

# Clean up old containers and images
echo "🧹 Cleaning up old containers..."
docker system prune -f || true

# Pull latest images
echo "📦 Pulling latest images..."
$COMPOSE_CMD pull

# Build and start services
echo "🏗️ Building and starting services..."
$COMPOSE_CMD up --build -d

# Wait for services to be ready with progress indication
echo "⏳ Waiting for services to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:5000/api/test &> /dev/null; then
        echo "✅ Application is ready!"
        break
    fi
    echo "   Waiting... ($i/60)"
    sleep 2
done

# Check service health
echo "🔍 Checking service health..."
$COMPOSE_CMD ps

# Test application endpoints
echo "🧪 Testing application..."
if curl -s http://localhost:5000/api/test | grep -q "working"; then
    echo "✅ API test passed"
else
    echo "⚠️  API test failed"
fi

# Show service logs
echo "📋 Recent service logs:"
$COMPOSE_CMD logs --tail=10

echo ""
echo "🎉 TradeWiser Platform is ready!"
echo "================================"
echo ""
echo "🌐 Application: http://localhost:5000"
echo "🗄️ Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "👤 Default login credentials:"
echo "   Username: testuser"
echo "   Password: password123"
echo ""
echo "📋 Management commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Check status: $COMPOSE_CMD ps"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart: $COMPOSE_CMD restart"
echo "   Test setup: ./docker-test-complete.sh"
echo ""
echo "🔧 Ubuntu-specific notes:"
echo "   • Docker service auto-starts on boot"
echo "   • Memory overcommit enabled for Redis"
echo "   • Firewall rules may need adjustment for external access"