#!/bin/bash
# Quick fix script for Docker build issues

echo "🔧 TradeWiser Docker Build Fix"
echo "============================="

# Stop all containers and clean cache
echo "🛑 Stopping containers and cleaning cache..."
docker compose down || true
docker system prune -af
docker builder prune -af

echo "✅ Cache cleaned"

# Verify Dockerfile doesn't have problematic lines
if grep -q "client/dist" Dockerfile; then
    echo "❌ Found problematic client/dist reference in Dockerfile"
    echo "🔧 Please use the corrected Dockerfile"
    exit 1
else
    echo "✅ Dockerfile looks good - no client/dist references"
fi

# Build without cache
echo "🏗️ Building without cache..."
docker compose build --no-cache

echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "🎉 Docker build fix completed!"
echo "🌐 Check: http://localhost:5000"
echo "👤 Login with: testuser / password123"
echo ""
echo "📊 To see logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"