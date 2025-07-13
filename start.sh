#!/bin/bash
# TradeWiser Platform - Cross-Platform Docker Setup Script

set -e

echo "🚀 TradeWiser Platform - Docker Setup"
echo "======================================"

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Detected Linux system"
    OS_TYPE="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Detected macOS system"
    OS_TYPE="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "✅ Detected Windows system"
    OS_TYPE="windows"
else
    echo "⚠️  Unknown system type: $OSTYPE"
    OS_TYPE="unknown"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    if [ "$OS_TYPE" = "linux" ]; then
        echo "Install with: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    else
        echo "Please install Docker Desktop from: https://docs.docker.com/get-docker/"
    fi
    exit 1
fi

# Check Docker Compose with better detection
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo "✅ Using docker-compose (standalone)"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "✅ Using docker compose (plugin)"
else
    echo "❌ Docker Compose is not available."
    if [ "$OS_TYPE" = "linux" ]; then
        echo "Install with: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
    else
        echo "Docker Compose should be included with Docker Desktop."
    fi
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "✅ .env file created with default configuration."
else
    echo "✅ .env file already exists."
    echo "💡 If you're having issues, you can reset it with: cp .env.docker .env"
fi

# Validate environment file
if [ -f .env ]; then
    echo "🔍 Validating environment configuration..."
    if grep -q "PGDATABASE=tradewiser_db" .env && grep -q "PGUSER=tradewiser" .env; then
        echo "✅ Environment configuration looks good."
    else
        echo "⚠️  Environment configuration might be incomplete. Using defaults."
        cp .env.docker .env
    fi
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p db

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$COMPOSE_CMD down 2>/dev/null || true

# Pull latest images
echo "📦 Pulling latest images..."
$COMPOSE_CMD pull

# Build and start services
echo "🏗️  Building and starting services..."
$COMPOSE_CMD up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000/api/test &> /dev/null; then
        echo "✅ Application is ready!"
        break
    fi
    echo "   Checking... ($i/30)"
    sleep 2
done

# Check service health
echo "🔍 Checking service health..."
$COMPOSE_CMD ps

# Test application
echo "🧪 Testing application endpoints..."
if curl -s http://localhost:5000/api/test | grep -q "working"; then
    echo "✅ API test passed"
else
    echo "⚠️  API test result unclear"
fi

# Show logs
echo "📋 Service logs:"
$COMPOSE_CMD logs --tail=20

echo ""
echo "🎉 TradeWiser Platform is now running!"
echo "======================================"
echo "🌐 Web Application: http://localhost:5000"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "🔐 Default Login:"
echo "   Username: testuser"
echo "   Password: password123"
echo ""
echo "📊 Management commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart services: $COMPOSE_CMD restart"
echo "   View status: $COMPOSE_CMD ps"
echo "   Test setup: ./docker-test-complete.sh"
echo ""
echo "📚 For more information, check the README.md file."