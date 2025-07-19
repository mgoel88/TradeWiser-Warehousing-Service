#!/bin/bash
# Fix production deployment API routing issues

echo "🔧 Fixing TradeWiser Production Deployment API Issues"
echo "=================================================="

# Ensure proper build directory structure
echo "📁 Setting up build directories..."
npm run build

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "❌ Build failed - dist/public not found"
    exit 1
fi

# Ensure server/public exists for production static serving
echo "📂 Creating server/public directory..."
mkdir -p server/public

# Copy built files to expected location
echo "📋 Copying built files to server/public..."
cp -r dist/public/* server/public/

# Verify files were copied correctly
if [ ! -f "server/public/index.html" ]; then
    echo "❌ Failed to copy built files"
    exit 1
fi

echo "✅ Built files copied successfully"

# Check Docker build if needed
if command -v docker &> /dev/null; then
    echo "🐳 Building Docker image for production..."
    docker build -t tradewiser-production .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker build successful"
    else
        echo "❌ Docker build failed"
        exit 1
    fi
fi

echo ""
echo "🚀 Production deployment fix complete!"
echo ""
echo "Next steps for deployment:"
echo "1. If using Docker: docker compose up -d"
echo "2. If deploying to Replit: The static files are now in the correct location"
echo "3. Verify API endpoints work at: https://your-domain.replit.app/api/test"
echo ""
echo "The API routes should now work correctly in production mode."