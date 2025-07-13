# TradeWiser Production Deployment Guide

## Overview
This guide covers deploying TradeWiser Platform in a production environment with proper security, performance, and monitoring configurations.

## Key Differences: Development vs Production

### Development Setup (.env.docker)
- **Purpose**: Local development and testing
- **Security**: Basic passwords, development secrets
- **Performance**: Single container, no optimization
- **Monitoring**: Basic logging
- **SSL**: Not configured
- **Backup**: Not included

### Production Setup (.env.production)
- **Purpose**: Live production environment
- **Security**: Strong passwords, secure secrets, rate limiting
- **Performance**: Multi-container, optimized settings, resource limits
- **Monitoring**: Comprehensive logging, health checks
- **SSL**: HTTPS with SSL certificates
- **Backup**: Automated database backups

## Pre-Production Checklist

### 1. Security Configuration
- [ ] Change all default passwords in `.env.production`
- [ ] Generate secure SESSION_SECRET (32+ characters)
- [ ] Configure strong database passwords
- [ ] Set up Redis authentication
- [ ] Configure firewall rules
- [ ] Set up SSL certificates

### 2. Environment Configuration
- [ ] Copy `.env.production` and customize for your environment
- [ ] Set correct domain names in `nginx.conf`
- [ ] Configure external service API keys
- [ ] Set up monitoring endpoints

### 3. Infrastructure Requirements
- [ ] Server with 4GB+ RAM
- [ ] 20GB+ storage space
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained
- [ ] Domain name configured

## Production Deployment Steps

### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Application Setup
```bash
# Clone repository
git clone <repository-url>
cd tradewiser

# Configure production environment
cp .env.production .env.production.local
nano .env.production.local  # Edit with your settings
```

### Step 3: Security Configuration
```bash
# Generate secure session secret
openssl rand -hex 32

# Generate strong passwords
openssl rand -base64 32

# Set up SSL certificates (example with Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### Step 4: Deploy
```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Run production deployment
./deploy-production.sh
```

## Configuration Files Explained

### .env.production
Production environment variables with security-focused defaults:
- Strong password requirements
- Production database settings
- SSL configuration
- Rate limiting settings
- Monitoring configuration

### docker-compose.production.yml
Production-ready Docker Compose configuration:
- Resource limits and reservations
- Health checks for all services
- Network isolation
- Production-optimized database settings
- Redis with authentication
- Nginx reverse proxy
- Automated backup service

### nginx.conf
Production Nginx configuration:
- SSL/TLS termination
- Rate limiting
- Security headers
- Gzip compression
- WebSocket support
- Static file serving

### redis.conf
Production Redis configuration:
- Authentication enabled
- Persistence configured
- Memory limits
- Security restrictions
- Performance optimization

## Security Best Practices

### 1. Network Security
```bash
# Configure firewall (UFW example)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. SSL Configuration
```bash
# Copy SSL certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/private.key
sudo chmod 600 certs/private.key
```

### 3. Database Security
- Use strong passwords
- Enable SSL connections
- Configure firewall rules
- Regular security updates

### 4. Application Security
- Configure CORS origins
- Set up rate limiting
- Enable request logging
- Use secure session settings

## Monitoring and Maintenance

### 1. Health Monitoring
```bash
# Check application health
curl -f https://yourdomain.com/health

# Monitor services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f app
```

### 2. Database Backups
```bash
# Manual backup
docker-compose -f docker-compose.production.yml exec db-backup /backup.sh

# Automated backups run daily at 2 AM
# Check backup files
ls -la backups/
```

### 3. Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Check disk usage
df -h

# Monitor network
netstat -tulpn
```

## Scaling Considerations

### 1. Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple app instances
- Shared database and Redis
- Distributed file storage

### 2. Vertical Scaling
- Increase server resources
- Optimize database configuration
- Tune application settings
- Monitor performance metrics

### 3. Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization
- Index optimization

## Troubleshooting

### Common Issues

#### 1. Application Not Starting
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs app

# Check resource usage
docker stats

# Verify configuration
docker-compose -f docker-compose.production.yml config
```

#### 2. Database Connection Issues
```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec database pg_isready -U tradewiser_prod

# Check database logs
docker-compose -f docker-compose.production.yml logs database
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in certs/certificate.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose -f docker-compose.production.yml exec database psql -U tradewiser_prod -d tradewiser_production -c "SELECT * FROM pg_stat_activity;"
```

## Backup and Recovery

### 1. Database Backup
```bash
# Create manual backup
docker-compose -f docker-compose.production.yml exec database pg_dump -U tradewiser_prod tradewiser_production > backup.sql

# Restore from backup
docker-compose -f docker-compose.production.yml exec -T database psql -U tradewiser_prod -d tradewiser_production < backup.sql
```

### 2. Full System Backup
```bash
# Backup application data
tar -czf tradewiser-backup-$(date +%Y%m%d).tar.gz \
  .env.production \
  uploads/ \
  logs/ \
  backups/ \
  certs/
```

### 3. Disaster Recovery
```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Restore data
tar -xzf tradewiser-backup-YYYYMMDD.tar.gz

# Restart services
docker-compose -f docker-compose.production.yml up -d
```

## Performance Optimization

### 1. Database Optimization
- Regular VACUUM and ANALYZE
- Proper indexing
- Connection pooling
- Query optimization

### 2. Application Optimization
- Enable caching
- Optimize asset delivery
- Use CDN for static files
- Implement pagination

### 3. System Optimization
- Configure system limits
- Optimize Docker settings
- Use SSD storage
- Monitor system resources

## Compliance and Security

### 1. Data Protection
- Encrypt sensitive data
- Implement access controls
- Regular security audits
- Backup encryption

### 2. Compliance Requirements
- GDPR compliance (if applicable)
- Industry-specific regulations
- Data retention policies
- Audit logging

### 3. Security Monitoring
- Log analysis
- Intrusion detection
- Vulnerability scanning
- Security updates

## Support and Maintenance

### 1. Regular Maintenance
- System updates
- Security patches
- Database maintenance
- Performance monitoring

### 2. Monitoring Setup
- Application monitoring
- Infrastructure monitoring
- Alert configuration
- Dashboard setup

### 3. Incident Response
- Incident response plan
- Escalation procedures
- Communication protocols
- Recovery procedures

## Conclusion

This production setup provides a secure, scalable, and maintainable deployment of the TradeWiser Platform. Regular monitoring, maintenance, and security updates are essential for production success.

For additional support, refer to the main README.md and SETUP_GUIDE.md files.