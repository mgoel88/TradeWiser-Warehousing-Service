#!/bin/bash
# TradeWiser Platform - Ubuntu-Compatible Docker Testing Script

set -e

echo "🧪 TradeWiser Platform - Ubuntu Docker Test Suite"
echo "==============================================="

# Detect system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Testing on Linux system (Ubuntu compatible)"
    if command -v lsb_release &> /dev/null; then
        DISTRO=$(lsb_release -si)
        VERSION=$(lsb_release -sr)
        echo "📋 System: $DISTRO $VERSION"
    fi
else
    echo "⚠️  Testing on non-Linux system"
fi

# Function to check if service is responding
check_service() {
    local service_name=$1
    local url=$2
    local expected_response=$3
    local max_attempts=60
    local attempt=1
    
    echo "🔍 Testing $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --connect-timeout 5 "$url" | grep -q "$expected_response"; then
            echo "✅ $service_name is responding correctly"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            echo "   Still waiting... ($attempt/$max_attempts)"
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to respond after $max_attempts attempts"
    return 1
}

# Check prerequisites
echo ""
echo "📋 Checking Ubuntu prerequisites..."

MISSING_TOOLS=()

if ! command -v docker &> /dev/null; then
    MISSING_TOOLS+=("docker")
fi

if ! command -v curl &> /dev/null; then
    MISSING_TOOLS+=("curl")
fi

# Check Docker Compose
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    MISSING_TOOLS+=("docker-compose")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "❌ Missing tools: ${MISSING_TOOLS[*]}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Install with: sudo apt-get update && sudo apt-get install -y curl"
        echo "For Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    fi
    exit 1
fi

echo "✅ All prerequisites met"
echo "✅ Using: $COMPOSE_CMD"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Start with: sudo systemctl start docker"
    fi
    exit 1
fi

# Ubuntu-specific checks
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "🔧 Ubuntu-specific optimizations..."
    
    # Check memory overcommit
    OVERCOMMIT=$(cat /proc/sys/vm/overcommit_memory 2>/dev/null || echo "0")
    if [[ "$OVERCOMMIT" == "1" ]]; then
        echo "✅ Memory overcommit enabled (optimal for Redis)"
    else
        echo "⚠️  Memory overcommit disabled (may affect Redis)"
        echo "   Enable with: echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf"
    fi
    
    # Check available ports
    BUSY_PORTS=()
    if netstat -tuln 2>/dev/null | grep -q ":5000 "; then
        BUSY_PORTS+=(5000)
    fi
    if netstat -tuln 2>/dev/null | grep -q ":5432 "; then
        BUSY_PORTS+=(5432)
    fi
    if netstat -tuln 2>/dev/null | grep -q ":6379 "; then
        BUSY_PORTS+=(6379)
    fi
    
    if [ ${#BUSY_PORTS[@]} -eq 0 ]; then
        echo "✅ All required ports are available"
    else
        echo "⚠️  Ports in use: ${BUSY_PORTS[*]}"
    fi
fi

# Ensure .env file exists
echo ""
echo "📄 Environment setup..."
if [ ! -f .env ]; then
    echo "Creating .env file from .env.docker..."
    cp .env.docker .env
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

# Validate environment
if grep -q "DATABASE_URL" .env && grep -q "tradewiser" .env; then
    echo "✅ Environment configuration looks valid"
else
    echo "⚠️  Environment configuration may be incomplete"
fi

# Clean shutdown and restart
echo ""
echo "🛑 Stopping any existing containers..."
$COMPOSE_CMD down --volumes --remove-orphans 2>/dev/null || true

# Clean up old images and containers
echo "🧹 Cleaning up old Docker resources..."
docker system prune -f || true

echo "🏗️ Building and starting services..."
$COMPOSE_CMD up --build -d

echo ""
echo "⏳ Waiting for services to initialize..."

# Monitor container startup
for i in {1..30}; do
    RUNNING_CONTAINERS=$($COMPOSE_CMD ps --filter "status=running" --format "table {{.Service}}" | tail -n +2 | wc -l)
    TOTAL_CONTAINERS=$($COMPOSE_CMD ps --format "table {{.Service}}" | tail -n +2 | wc -l)
    
    echo "   Containers running: $RUNNING_CONTAINERS/$TOTAL_CONTAINERS ($i/30)"
    
    if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_CONTAINERS" ]; then
        echo "✅ All containers are running"
        break
    fi
    
    sleep 3
done

# Check container status
echo ""
echo "📊 Container status:"
$COMPOSE_CMD ps

# Test services
echo ""
echo "🧪 Testing service endpoints..."

# Test API with detailed checking
check_service "API" "http://localhost:5000/api/test" "working"

# Test Auth endpoint
echo "🔐 Testing authentication endpoint..."
AUTH_RESPONSE=$(curl -s http://localhost:5000/api/auth/session || echo "failed")
if echo "$AUTH_RESPONSE" | grep -q "Not authenticated"; then
    echo "✅ Authentication endpoint is working"
elif echo "$AUTH_RESPONSE" | grep -q "failed"; then
    echo "❌ Authentication endpoint failed to respond"
else
    echo "⚠️  Authentication endpoint response unclear: $AUTH_RESPONSE"
fi

# Test database connection
echo "🗄️ Testing database connection..."
if $COMPOSE_CMD exec -T database pg_isready -U tradewiser -d tradewiser_db -h localhost > /dev/null 2>&1; then
    echo "✅ Database is accessible"
    
    # Test database query
    if $COMPOSE_CMD exec -T database psql -U tradewiser -d tradewiser_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database queries are working"
    else
        echo "⚠️  Database connection limited"
    fi
else
    echo "❌ Database connection failed"
fi

# Test Redis connection
echo "🔄 Testing Redis connection..."
if $COMPOSE_CMD exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis is accessible"
else
    echo "❌ Redis connection failed"
fi

# Test web interface
echo "🌐 Testing web interface..."
if curl -s http://localhost:5000 | grep -q "html\|HTML"; then
    echo "✅ Web interface is serving content"
else
    echo "⚠️  Web interface response unclear"
fi

# Performance test
echo "🚀 Basic performance test..."
start_time=$(date +%s)
for i in {1..5}; do
    curl -s http://localhost:5000/api/test > /dev/null
done
end_time=$(date +%s)
avg_time=$(( (end_time - start_time) * 200 ))  # 5 requests = 200ms per request if 1 second total
echo "✅ Average response time: ~${avg_time}ms"

# Check logs for errors
echo ""
echo "📋 Checking logs for critical errors..."
CRITICAL_ERRORS=$($COMPOSE_CMD logs 2>&1 | grep -i "error\|failed\|exception" | grep -v "404\|401\|ECONNREFUSED" | wc -l)
if [ "$CRITICAL_ERRORS" -eq 0 ]; then
    echo "✅ No critical errors found in logs"
else
    echo "⚠️  Found $CRITICAL_ERRORS potential issues in logs"
    echo "   Review with: $COMPOSE_CMD logs"
fi

# Resource usage check
echo ""
echo "📈 Resource usage:"
if command -v docker &> /dev/null; then
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
fi

echo ""
echo "🎉 Ubuntu Docker testing completed!"
echo "================================="
echo ""
echo "🌐 Application: http://localhost:5000"
echo "👤 Default Login: testuser / password123"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📊 Management commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Check status: $COMPOSE_CMD ps"
echo "   Stop services: $COMPOSE_CMD down"
echo ""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔧 Ubuntu-specific notes:"
    echo "   • Ensure firewall allows ports 5000, 5432, 6379"
    echo "   • For production, configure SSL and domain"
    echo "   • Monitor with: docker stats"
fi