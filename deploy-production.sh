#!/bin/bash
# TradeWiser Platform - Production Deployment Script

set -e

echo "🚀 TradeWiser Platform - Production Deployment"
echo "=============================================="

# Check if running as root (not recommended for production)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root is not recommended for production."
    echo "   Consider creating a dedicated user for the application."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not available."
    exit 1
fi

echo "✅ Using: $COMPOSE_CMD"

# Create production environment file
echo "📝 Setting up production environment..."
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it from .env.production template."
    exit 1
fi

# Validate critical production settings
echo "🔍 Validating production configuration..."
if grep -q "CHANGE_THIS_PASSWORD" .env.production; then
    echo "❌ Default passwords found in .env.production!"
    echo "   Please change all 'CHANGE_THIS_PASSWORD' values to secure passwords."
    exit 1
fi

if grep -q "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING" .env.production; then
    echo "❌ Default session secret found in .env.production!"
    echo "   Please change SESSION_SECRET to a secure random string."
    exit 1
fi

echo "✅ Production configuration validated"

# Create necessary directories
echo "📁 Creating production directories..."
mkdir -p backups logs uploads certs scripts
chmod 700 backups logs
chmod 755 uploads

# Create backup script
echo "📦 Creating backup script..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/tradewiser_backup_${DATE}.sql"
pg_dump -h database -U "$PGUSER" -d "$PGDATABASE" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Keep only last 30 days of backups
find /backups -name "*.sql.gz" -mtime +30 -delete
echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x scripts/backup.sh

# Pull latest images
echo "📦 Pulling latest images..."
$COMPOSE_CMD -f docker-compose.production.yml pull

# Stop existing services
echo "🛑 Stopping existing services..."
$COMPOSE_CMD -f docker-compose.production.yml down

# Build and start production services
echo "🏗️  Building and starting production services..."
$COMPOSE_CMD -f docker-compose.production.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 60

# Health check
echo "🏥 Performing health checks..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:5000/api/test &> /dev/null; then
        echo "✅ Application is healthy!"
        break
    fi
    
    echo "   Waiting for application... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 10
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Application failed to start"
    echo "📋 Checking logs..."
    $COMPOSE_CMD -f docker-compose.production.yml logs app --tail=50
    exit 1
fi

# Show final status
echo ""
echo "🎉 Production deployment successful!"
echo "==================================="
echo ""
echo "🌐 Application: http://localhost:5000"
echo "🔒 HTTPS: https://yourdomain.com (configure nginx and SSL)"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📊 Management commands:"
echo "   View logs: $COMPOSE_CMD -f docker-compose.production.yml logs -f"
echo "   Check status: $COMPOSE_CMD -f docker-compose.production.yml ps"
echo "   Stop services: $COMPOSE_CMD -f docker-compose.production.yml down"
echo "   Restart: $COMPOSE_CMD -f docker-compose.production.yml restart"
echo ""
echo "🔐 Security reminders:"
echo "   • Configure firewall rules"
echo "   • Set up SSL certificates"
echo "   • Configure domain DNS"
echo "   • Set up monitoring"
echo "   • Configure automated backups"
echo ""
echo "📋 Current service status:"
$COMPOSE_CMD -f docker-compose.production.yml ps