#!/bin/bash
# TradeWiser Platform - Complete Docker Test Script

set -e

echo "🚀 TradeWiser Platform - Complete Docker Test"
echo "=============================================="

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Desktop or Docker Compose."
    exit 1
fi

echo "✅ Using: $COMPOSE_CMD"

# Setup environment
echo "📝 Setting up environment..."
cp .env.docker .env
echo "✅ Environment file created"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
$COMPOSE_CMD down -v 2>/dev/null || true
echo "✅ Cleanup complete"

# Build and start services
echo "🏗️  Building and starting services..."
echo "   This may take 2-3 minutes for the first build..."
$COMPOSE_CMD up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
$COMPOSE_CMD ps

# Health check loop
echo "🏥 Performing health checks..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:5000/api/test &> /dev/null; then
        echo "✅ Application is responding!"
        break
    fi
    
    echo "   Waiting for application... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 10
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Application failed to start within timeout"
    echo "📋 Checking logs..."
    $COMPOSE_CMD logs app --tail=50
    exit 1
fi

# Test database connection
echo "🗄️  Testing database connection..."
if $COMPOSE_CMD exec database pg_isready -U tradewiser -d tradewiser_db &> /dev/null; then
    echo "✅ Database is ready!"
else
    echo "❌ Database connection failed"
    $COMPOSE_CMD logs database --tail=20
    exit 1
fi

# Test API endpoints
echo "🔗 Testing API endpoints..."

# Test session endpoint
if curl -f http://localhost:5000/api/auth/session &> /dev/null; then
    echo "✅ Session endpoint responding"
else
    echo "⚠️  Session endpoint returned error (expected for unauthenticated request)"
fi

# Test basic API
if curl -f http://localhost:5000/api/test &> /dev/null; then
    echo "✅ Test endpoint responding"
else
    echo "❌ Test endpoint failed"
    exit 1
fi

# Show final status
echo ""
echo "🎉 Docker deployment successful!"
echo "================================"
echo ""
echo "🌐 Application: http://localhost:5000"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "🔐 Test Login:"
echo "   Username: testuser"
echo "   Password: password123"
echo ""
echo "📊 Management commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Check status: $COMPOSE_CMD ps"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart: $COMPOSE_CMD restart"
echo ""
echo "📋 Current service status:"
$COMPOSE_CMD ps