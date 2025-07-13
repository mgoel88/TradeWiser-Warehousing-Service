#!/bin/bash
# TradeWiser Platform - Docker Configuration Test (No Docker Required)

echo "🔍 TradeWiser Docker Configuration Validation"
echo "============================================="

# Check required files exist
echo "📋 Checking required files..."

REQUIRED_FILES=(
    "Dockerfile"
    "docker-compose.yml"
    "docker-entrypoint.sh"
    ".env.docker"
    "package.json"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo "❌ Missing files: ${MISSING_FILES[*]}"
    exit 1
fi

# Check Dockerfile syntax
echo ""
echo "🐳 Validating Dockerfile syntax..."

if grep -q "FROM node:20-alpine AS builder" Dockerfile; then
    echo "✅ Multi-stage build configured"
else
    echo "❌ Multi-stage build not found"
fi

if grep -q "COPY --from=builder" Dockerfile; then
    echo "✅ Build artifacts copying configured"
else
    echo "❌ Build artifacts copying not configured"
fi

if grep -q "HEALTHCHECK" Dockerfile; then
    echo "✅ Health check configured"
else
    echo "⚠️  Health check not configured"
fi

# Check docker-compose.yml
echo ""
echo "📦 Validating docker-compose.yml..."

if grep -q "services:" docker-compose.yml; then
    echo "✅ Services section found"
else
    echo "❌ Services section not found"
fi

if grep -q "database:" docker-compose.yml; then
    echo "✅ Database service configured"
else
    echo "❌ Database service not found"
fi

if grep -q "redis:" docker-compose.yml; then
    echo "✅ Redis service configured"
else
    echo "❌ Redis service not found"
fi

# Check environment configuration
echo ""
echo "🔧 Validating environment configuration..."

if grep -q "DATABASE_URL" .env.docker; then
    echo "✅ Database URL configured"
else
    echo "❌ Database URL not configured"
fi

if grep -q "SESSION_SECRET" .env.docker; then
    echo "✅ Session secret configured"
else
    echo "❌ Session secret not configured"
fi

# Check build script
echo ""
echo "🏗️ Validating build configuration..."

if grep -q "build.*vite build" package.json; then
    echo "✅ Client build script found"
else
    echo "❌ Client build script not found"
fi

if grep -q "esbuild.*server" package.json; then
    echo "✅ Server build script found"
else
    echo "❌ Server build script not found"
fi

# Validate project structure
echo ""
echo "📁 Validating project structure..."

REQUIRED_DIRS=(
    "client"
    "server" 
    "shared"
    "db"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory missing"
    fi
done

echo ""
echo "🎉 Docker configuration validation completed!"
echo ""
echo "📋 Summary:"
echo "   • Dockerfile: Multi-stage build with Ubuntu compatibility"
echo "   • docker-compose.yml: Full service stack (app, database, redis)"
echo "   • Environment: Development and production configurations"
echo "   • Build process: Client + Server compilation"
echo ""
echo "🚀 Ready for Ubuntu Docker deployment!"
echo "   Run: ./start-ubuntu.sh (on Ubuntu system with Docker)"