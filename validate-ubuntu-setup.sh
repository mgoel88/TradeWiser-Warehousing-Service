#!/bin/bash
# TradeWiser Platform - Ubuntu Setup Validation Script

set -e

echo "🔍 TradeWiser Platform - Ubuntu Compatibility Check"
echo "=================================================="

# Initialize counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper functions
check_pass() {
    echo "✅ $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo "❌ $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo "⚠️  $1"
    ((WARN_COUNT++))
}

# System Information
echo ""
echo "📋 System Information"
echo "===================="

if command -v lsb_release &> /dev/null; then
    DISTRO=$(lsb_release -si)
    VERSION=$(lsb_release -sr)
    CODENAME=$(lsb_release -sc)
    echo "OS: $DISTRO $VERSION ($CODENAME)"
    
    if [[ "$DISTRO" == "Ubuntu" ]]; then
        MAJOR_VERSION=$(echo $VERSION | cut -d. -f1)
        if [[ $MAJOR_VERSION -ge 20 ]]; then
            check_pass "Ubuntu $VERSION is fully supported"
        elif [[ $MAJOR_VERSION -ge 18 ]]; then
            check_warn "Ubuntu $VERSION has limited support. Consider upgrading to 20.04+"
        else
            check_fail "Ubuntu $VERSION is not supported. Requires Ubuntu 18.04+"
        fi
    else
        check_warn "Non-Ubuntu system detected. Some features may not work optimally."
    fi
else
    check_warn "Cannot determine OS version. Assuming Ubuntu compatibility."
fi

echo "Architecture: $(uname -m)"
echo "Kernel: $(uname -r)"

# Hardware Requirements
echo ""
echo "🖥️ Hardware Requirements"
echo "======================"

# Check RAM
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [[ $TOTAL_RAM -ge 4 ]]; then
    check_pass "RAM: ${TOTAL_RAM}GB (meets minimum 4GB requirement)"
elif [[ $TOTAL_RAM -ge 2 ]]; then
    check_warn "RAM: ${TOTAL_RAM}GB (below recommended 4GB, may affect performance)"
else
    check_fail "RAM: ${TOTAL_RAM}GB (insufficient, requires at least 2GB)"
fi

# Check disk space
AVAILABLE_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
if [[ $AVAILABLE_SPACE -ge 20 ]]; then
    check_pass "Disk space: ${AVAILABLE_SPACE}GB available (meets 20GB requirement)"
elif [[ $AVAILABLE_SPACE -ge 10 ]]; then
    check_warn "Disk space: ${AVAILABLE_SPACE}GB available (below recommended 20GB)"
else
    check_fail "Disk space: ${AVAILABLE_SPACE}GB available (insufficient, requires 10GB+)"
fi

# Check CPU cores
CPU_CORES=$(nproc)
if [[ $CPU_CORES -ge 2 ]]; then
    check_pass "CPU: $CPU_CORES cores (sufficient)"
else
    check_warn "CPU: $CPU_CORES core (may affect performance)"
fi

# System Dependencies
echo ""
echo "📦 System Dependencies"
echo "===================="

# Essential packages
REQUIRED_PACKAGES=("curl" "git" "ca-certificates")
RECOMMENDED_PACKAGES=("jq" "htop" "unzip" "wget")

for package in "${REQUIRED_PACKAGES[@]}"; do
    if command -v $package &> /dev/null; then
        check_pass "$package is installed"
    else
        check_fail "$package is missing (required)"
    fi
done

for package in "${RECOMMENDED_PACKAGES[@]}"; do
    if command -v $package &> /dev/null; then
        check_pass "$package is installed"
    else
        check_warn "$package is missing (recommended)"
    fi
done

# Docker Installation
echo ""
echo "🐳 Docker Environment"
echo "==================="

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    check_pass "Docker is installed (version $DOCKER_VERSION)"
    
    # Check Docker daemon
    if docker info &> /dev/null; then
        check_pass "Docker daemon is running"
        
        # Check Docker permissions
        if docker ps &> /dev/null; then
            check_pass "Docker permissions are correct"
        else
            check_warn "Docker requires sudo. Add user to docker group: sudo usermod -aG docker \$USER"
        fi
    else
        check_fail "Docker daemon is not running"
    fi
else
    check_fail "Docker is not installed"
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | sed 's/,//')
    check_pass "Docker Compose is installed (standalone version $COMPOSE_VERSION)"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    check_pass "Docker Compose is installed (plugin version $COMPOSE_VERSION)"
else
    check_fail "Docker Compose is not installed"
fi

# Network Connectivity
echo ""
echo "🌐 Network Connectivity"
echo "====================="

# Check internet connectivity
if curl -s --connect-timeout 5 https://google.com > /dev/null; then
    check_pass "Internet connectivity is working"
else
    check_fail "No internet connectivity"
fi

# Check Docker Hub connectivity
if curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
    check_pass "Docker Hub is accessible"
else
    check_warn "Docker Hub connectivity issues"
fi

# Check PostgreSQL port availability
if ! netstat -tuln 2>/dev/null | grep -q ":5432 "; then
    check_pass "Port 5432 is available for PostgreSQL"
else
    check_warn "Port 5432 is already in use"
fi

# Check Redis port availability
if ! netstat -tuln 2>/dev/null | grep -q ":6379 "; then
    check_pass "Port 6379 is available for Redis"
else
    check_warn "Port 6379 is already in use"
fi

# Check application port availability
if ! netstat -tuln 2>/dev/null | grep -q ":5000 "; then
    check_pass "Port 5000 is available for application"
else
    check_warn "Port 5000 is already in use"
fi

# File System Permissions
echo ""
echo "📁 File System Permissions"
echo "========================="

# Check if we can create necessary directories
if mkdir -p /tmp/tradewiser-test/{uploads,logs,backups} 2>/dev/null; then
    check_pass "Can create necessary directories"
    rm -rf /tmp/tradewiser-test
else
    check_fail "Cannot create directories"
fi

# Check write permissions in current directory
if touch test-write-permission 2>/dev/null; then
    check_pass "Write permissions in current directory"
    rm -f test-write-permission
else
    check_fail "No write permissions in current directory"
fi

# Security Considerations
echo ""
echo "🔒 Security Configuration"
echo "======================="

# Check if UFW is available
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1)
    if [[ "$UFW_STATUS" == *"active"* ]]; then
        check_pass "UFW firewall is active"
    else
        check_warn "UFW firewall is inactive"
    fi
else
    check_warn "UFW firewall is not installed"
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    check_warn "Running as root (not recommended for production)"
else
    check_pass "Running as non-root user"
fi

# Performance Optimizations
echo ""
echo "⚡ Performance Configuration"
echo "=========================="

# Check memory overcommit setting
OVERCOMMIT=$(cat /proc/sys/vm/overcommit_memory 2>/dev/null || echo "unknown")
if [[ "$OVERCOMMIT" == "1" ]]; then
    check_pass "Memory overcommit is enabled (optimal for Redis)"
else
    check_warn "Memory overcommit is disabled (may affect Redis performance)"
fi

# Check transparent huge pages
THP=$(cat /sys/kernel/mm/transparent_hugepage/enabled 2>/dev/null || echo "unknown")
if [[ "$THP" == *"[never]"* ]]; then
    check_pass "Transparent huge pages are disabled (optimal for databases)"
else
    check_warn "Transparent huge pages are enabled (may affect database performance)"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "==================="
echo "✅ Passed: $PASS_COUNT"
echo "⚠️  Warnings: $WARN_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
    if [[ $WARN_COUNT -eq 0 ]]; then
        echo "🎉 Perfect! Your Ubuntu system is fully ready for TradeWiser Platform."
        echo ""
        echo "Next steps:"
        echo "1. Run './start.sh' for development setup"
        echo "2. Run './deploy-production.sh' for production deployment"
    else
        echo "✅ Good! Your system is ready with $WARN_COUNT warnings."
        echo ""
        echo "Consider addressing the warnings above for optimal performance."
        echo ""
        echo "Next steps:"
        echo "1. Run './start.sh' for development setup"
        echo "2. Run './deploy-production.sh' for production deployment"
    fi
    exit 0
else
    echo "❌ Issues found! Please resolve the $FAIL_COUNT failed checks before proceeding."
    echo ""
    echo "Common fixes:"
    echo "• Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    echo "• Add user to docker group: sudo usermod -aG docker \$USER"
    echo "• Install missing packages: sudo apt-get update && sudo apt-get install -y curl git jq"
    echo "• Start Docker: sudo systemctl start docker && sudo systemctl enable docker"
    exit 1
fi