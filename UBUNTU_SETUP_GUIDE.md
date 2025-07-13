# TradeWiser Platform - Ubuntu Setup Guide

## Overview
Complete guide for setting up TradeWiser Platform on Ubuntu systems, with support for both development and production environments using Docker.

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 18.04 LTS or later
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space minimum, 20GB recommended
- **CPU**: 1 core minimum, 2+ cores recommended
- **Network**: Internet connectivity for Docker images

### Recommended Production
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: 8GB or more
- **Storage**: 50GB+ SSD storage
- **CPU**: 4+ cores
- **Network**: Dedicated server with static IP

## Quick Start

### 1. System Validation
```bash
# Clone repository
git clone <repository-url>
cd tradewiser

# Run Ubuntu compatibility check
chmod +x validate-ubuntu-setup.sh
./validate-ubuntu-setup.sh
```

### 2. Development Setup
```bash
# Standard setup (requires Docker installed)
chmod +x start.sh
./start.sh

# Ubuntu-specific setup (installs Docker if needed)
chmod +x start-ubuntu.sh
./start-ubuntu.sh

# Test setup
chmod +x docker-test-ubuntu.sh
./docker-test-ubuntu.sh
```

### 3. Production Deployment
```bash
# Configure production environment
cp .env.production .env.production.local
nano .env.production.local  # Edit with your settings

# Deploy to production
chmod +x deploy-production.sh
./deploy-production.sh
```

## Detailed Installation

### Manual Docker Installation (Ubuntu)
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### System Optimizations (Ubuntu)
```bash
# Enable memory overcommit for Redis
echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.overcommit_memory=1

# Disable transparent huge pages (improves database performance)
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled

# Configure file limits
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf

# Apply changes
sudo sysctl -p
```

## Configuration Files

### Development Environment (.env.docker)
```bash
# Basic development configuration
DATABASE_URL=postgresql://tradewiser:tradewiser_secure_password_2024@database:5432/tradewiser_db
PGHOST=database
PGDATABASE=tradewiser_db
PGUSER=tradewiser
PGPASSWORD=tradewiser_secure_password_2024
SESSION_SECRET=tradewiser_super_secure_session_secret_2024
NODE_ENV=development
PORT=5000
```

### Production Environment (.env.production)
```bash
# Secure production configuration
DATABASE_URL=postgresql://tradewiser_prod:YOUR_SECURE_PASSWORD@database:5432/tradewiser_production
PGHOST=database
PGDATABASE=tradewiser_production
PGUSER=tradewiser_prod
PGPASSWORD=YOUR_SECURE_PASSWORD
SESSION_SECRET=YOUR_SECURE_32_CHAR_SECRET
NODE_ENV=production
PORT=5000
SSL_ENABLED=true
```

## Available Scripts

### Development Scripts
- `./validate-ubuntu-setup.sh` - System compatibility check
- `./start.sh` - Standard Docker setup
- `./start-ubuntu.sh` - Ubuntu-specific setup with auto-installation
- `./docker-test-complete.sh` - Basic Docker testing
- `./docker-test-ubuntu.sh` - Ubuntu-optimized testing

### Production Scripts
- `./deploy-production.sh` - Production deployment
- `docker-compose -f docker-compose.production.yml` - Production containers

## Ubuntu Version Compatibility

### Fully Supported
- **Ubuntu 22.04 LTS** - Latest LTS, fully tested
- **Ubuntu 20.04 LTS** - Stable LTS, recommended for production

### Supported with Warnings
- **Ubuntu 18.04 LTS** - Older LTS, limited support
- **Ubuntu 19.10+** - Non-LTS versions

### Not Recommended
- **Ubuntu 16.04** - End of life, security issues
- **Ubuntu 14.04** - Unsupported, lacks Docker compatibility

## Firewall Configuration (UFW)

### Development (local access only)
```bash
# No firewall changes needed for local development
# Docker handles internal networking
```

### Production (external access)
```bash
# Install and configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 to your SSH port)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow database access from specific IPs
# sudo ufw allow from YOUR_IP_ADDRESS to any port 5432

# Enable firewall
sudo ufw --force enable
sudo ufw status verbose
```

## SSL/TLS Configuration (Production)

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt-get install -y certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/private.key
sudo chmod 600 certs/private.key

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Monitoring and Maintenance

### System Monitoring
```bash
# Check Docker resource usage
docker stats

# Monitor system resources
htop
df -h
free -h

# Check service logs
docker-compose logs -f app
docker-compose logs -f database
```

### Database Maintenance
```bash
# Connect to database
docker-compose exec database psql -U tradewiser -d tradewiser_db

# Create database backup
docker-compose exec database pg_dump -U tradewiser tradewiser_db > backup.sql

# Restore from backup
docker-compose exec -T database psql -U tradewiser -d tradewiser_db < backup.sql
```

### Updates and Upgrades
```bash
# Update application
git pull
docker-compose down
docker-compose up --build -d

# Update Ubuntu system
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y

# Update Docker images
docker-compose pull
docker system prune -f
```

## Troubleshooting

### Common Issues

#### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

#### Port Already in Use
```bash
# Check which process is using the port
sudo netstat -tulpn | grep :5000
# Kill the process or change the port in .env file
```

#### Database Connection Failed
```bash
# Check database container
docker-compose ps
docker-compose logs database

# Test database connectivity
docker-compose exec database pg_isready -U tradewiser
```

#### Memory Issues
```bash
# Check memory usage
free -h
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Disk Space Issues
```bash
# Clean Docker resources
docker system prune -a -f
docker volume prune -f

# Check disk usage
df -h
du -sh /var/lib/docker
```

## Performance Tuning

### Database Optimization
```bash
# PostgreSQL configuration (production)
# Add to docker-compose.production.yml:
command: >
  postgres
  -c max_connections=200
  -c shared_buffers=256MB
  -c effective_cache_size=1GB
  -c maintenance_work_mem=64MB
```

### Application Optimization
```bash
# Node.js configuration
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=16
```

### System Optimization
```bash
# Kernel parameters
echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Security Best Practices

### System Security
- Keep Ubuntu updated with security patches
- Use UFW firewall with minimal open ports
- Configure SSH key authentication
- Disable root login
- Use fail2ban for intrusion prevention

### Application Security
- Use strong passwords in production
- Enable SSL/TLS with valid certificates
- Configure rate limiting
- Regular security audits
- Monitor logs for suspicious activity

### Docker Security
- Don't run containers as root
- Use official base images
- Regular image updates
- Scan images for vulnerabilities
- Limit container resources

## Support and Documentation

### Getting Help
- Check logs: `docker-compose logs -f`
- Run diagnostics: `./validate-ubuntu-setup.sh`
- Test setup: `./docker-test-ubuntu.sh`
- Review documentation: `README.md` and `PRODUCTION_GUIDE.md`

### Additional Resources
- Ubuntu Documentation: https://help.ubuntu.com/
- Docker Documentation: https://docs.docker.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Nginx Documentation: https://nginx.org/en/docs/

## Conclusion

This guide provides comprehensive setup instructions for TradeWiser Platform on Ubuntu systems. For additional support or advanced configurations, refer to the main documentation or submit issues to the project repository.