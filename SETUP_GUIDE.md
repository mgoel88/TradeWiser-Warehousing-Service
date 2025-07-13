# TradeWiser Setup Guide

## Quick Docker Setup (Recommended)

### 1. Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### 2. Clone and Start
```bash
git clone <repository-url>
cd tradewiser

# Linux/Mac users
./start.sh

# Windows users
start.bat
```

### 3. Access the Application
- **Web App**: http://localhost:5000
- **Login**: testuser / password123

## Troubleshooting Docker Issues

### Environment Variable Warnings
If you see warnings like:
```
WARN[0000] The "PGDATABASE" variable is not set. Defaulting to a blank string.
```

**Solution:**
```bash
# Copy the environment template
cp .env.docker .env

# Verify the file exists and has content
cat .env

# Restart Docker services
docker-compose down
docker-compose up -d
```

### Database Connection Issues
If PostgreSQL fails to start:

**Check logs:**
```bash
docker-compose logs database
```

**Common fixes:**
```bash
# Clean up and restart
docker-compose down -v
docker system prune -f
cp .env.docker .env
docker-compose up -d
```

### Application Not Starting
If the app container fails:

**Check logs:**
```bash
docker-compose logs app
```

**Common fixes:**
```bash
# Rebuild the application
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Manual Setup (Alternative)

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm

### 2. Database Setup
```bash
# Create database
createdb tradewiser_db

# Create user (optional)
psql -c "CREATE USER tradewiser WITH PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;"
```

### 3. Application Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.docker .env
# Edit .env with your database credentials

# Setup database schema
npm run db:push

# Start development server
npm run dev
```

## Environment Variables Explained

### Required Variables
```env
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/database
PGHOST=database          # Database host
PGDATABASE=tradewiser_db # Database name
PGUSER=tradewiser        # Database user
PGPASSWORD=password      # Database password
PGPORT=5432              # Database port

# Application security
SESSION_SECRET=your-secure-session-secret
```

### Optional Variables
```env
# Application settings
NODE_ENV=production
PORT=5000
DEBUG=false

# Redis (if using)
REDIS_URL=redis://redis:6379

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

## Docker Commands Reference

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f database

# Check service status
docker-compose ps
```

### Maintenance Operations
```bash
# Rebuild application
docker-compose build --no-cache app

# Clean up volumes (CAUTION: deletes data)
docker-compose down -v

# Clean up system
docker system prune -f

# Remove all containers and images
docker-compose down --rmi all
```

### Development Operations
```bash
# Access application container
docker-compose exec app sh

# Access database container
docker-compose exec database psql -U tradewiser -d tradewiser_db

# Run database migrations
docker-compose exec app npm run db:push
```

## Application Structure

### Docker Services
- **app**: Main TradeWiser application (Node.js)
- **database**: PostgreSQL database
- **redis**: Redis cache (optional)

### Ports
- **5000**: Web application
- **5432**: PostgreSQL database
- **6379**: Redis cache

### Volumes
- **postgres_data**: Database persistence
- **redis_data**: Redis persistence
- **./uploads**: File uploads (mounted)
- **./logs**: Application logs (mounted)

## Health Checks

### Application Health
```bash
curl http://localhost:5000/api/test
```

### Database Health
```bash
docker-compose exec database pg_isready -U tradewiser
```

### Redis Health
```bash
docker-compose exec redis redis-cli ping
```

## Common Issues and Solutions

### Issue: "Database is uninitialized"
**Cause**: Missing environment variables
**Solution**: Ensure .env file exists with proper database credentials

### Issue: "Connection refused"
**Cause**: Services not fully started
**Solution**: Wait for health checks to pass, check logs

### Issue: "Permission denied"
**Cause**: File permissions on startup scripts
**Solution**: 
```bash
chmod +x start.sh
chmod +x docker-entrypoint.sh
```

### Issue: "Port already in use"
**Cause**: Port 5000 or 5432 already occupied
**Solution**: 
```bash
# Find and kill processes using the port
lsof -ti:5000 | xargs kill -9
# Or change ports in docker-compose.yml
```

## Development Workflow

### 1. Make Changes
Edit files in your preferred editor

### 2. Test Changes
```bash
# For frontend changes (auto-reload)
# Just refresh browser

# For backend changes
docker-compose restart app

# For database schema changes
docker-compose exec app npm run db:push
```

### 3. Debug Issues
```bash
# View real-time logs
docker-compose logs -f app

# Access container for debugging
docker-compose exec app sh
```

## Production Deployment

### 1. Environment Setup
```bash
# Copy and customize environment
cp .env.docker .env.production

# Edit production values
# - Change passwords
# - Set NODE_ENV=production
# - Configure external database if needed
```

### 2. Deploy
```bash
# Build production image
docker-compose build

# Start in production mode
docker-compose -f docker-compose.yml up -d
```

### 3. Monitoring
```bash
# Check health
docker-compose ps
docker-compose logs --tail=50

# Monitor resources
docker stats
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure Docker and Docker Compose are up to date
4. Try the clean restart procedure:
   ```bash
   docker-compose down -v
   cp .env.docker .env
   docker-compose up -d
   ```

For persistent issues, check the main README.md for detailed API documentation and architecture information.