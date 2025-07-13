#!/bin/bash
# TradeWiser Platform - Docker Setup Validation Script

echo "🧪 TradeWiser Docker Setup Validation"
echo "====================================="

# Check if Docker is installed
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker version
echo "✅ Docker version: $(docker --version)"

# Check if Docker Compose is available
echo "2. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose version: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) version: $(docker compose version)"
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Check if .env file exists
echo "3. Checking environment configuration..."
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

# Validate .env file content
echo "4. Validating environment variables..."
if grep -q "PGDATABASE=tradewiser_db" .env && grep -q "PGUSER=tradewiser" .env && grep -q "SESSION_SECRET=" .env; then
    echo "✅ Environment variables look correct"
else
    echo "⚠️  Environment variables incomplete. Recreating from template..."
    cp .env.docker .env
fi

# Check if docker-compose.yml exists
echo "5. Checking Docker Compose configuration..."
if [ -f docker-compose.yml ]; then
    echo "✅ docker-compose.yml found"
else
    echo "❌ docker-compose.yml not found. Please ensure you're in the project directory."
    exit 1
fi

# Check if Dockerfile exists
echo "6. Checking Dockerfile..."
if [ -f Dockerfile ]; then
    echo "✅ Dockerfile found"
else
    echo "❌ Dockerfile not found. Please ensure you're in the project directory."
    exit 1
fi

# Test Docker build (dry run)
echo "7. Testing Docker build (validation only)..."
if $COMPOSE_CMD config &> /dev/null; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors:"
    $COMPOSE_CMD config
    exit 1
fi

# Instructions for running
echo ""
echo "🚀 Setup validation complete!"
echo "============================"
echo ""
echo "To start the TradeWiser platform:"
echo "1. Run: $COMPOSE_CMD up --build -d"
echo "2. Wait for services to start (may take a few minutes)"
echo "3. Access the application at: http://localhost:5000"
echo "4. Login with: testuser / password123"
echo ""
echo "To monitor the startup:"
echo "- View logs: $COMPOSE_CMD logs -f"
echo "- Check status: $COMPOSE_CMD ps"
echo "- Stop services: $COMPOSE_CMD down"
echo ""
echo "📚 For troubleshooting, see SETUP_GUIDE.md"