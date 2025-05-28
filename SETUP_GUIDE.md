# TradeWiser Platform - Complete Setup Guide

## Overview
TradeWiser is a blockchain-powered agricultural commodity platform providing secure, transparent digital infrastructure for warehousing, quality assessment, and collateral-based lending.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or Windows 10/11
- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 12 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space

## Ubuntu Setup

### 1. Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18+
```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql
```

In PostgreSQL shell, run:
```sql
CREATE USER tradewiser WITH PASSWORD 'tradewiser123';
CREATE DATABASE tradewiser_db OWNER tradewiser;
GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;
\q
```

### 4. Install Git (if not already installed)
```bash
sudo apt install git -y
```

### 5. Clone and Setup Project
```bash
# Clone the repository
git clone <your-repository-url>
cd tradewiser

# Install dependencies
npm install

# The .env file is already included and ready to use!
# No need to copy from .env.example - it's preconfigured
```

### 6. Configure PostgreSQL Database
The `.env` file is preconfigured with these database settings:
- **Database Name**: `tradewiser_db`
- **Username**: `tradewiser`
- **Password**: `tradewiser123`

You just need to create the database user and database to match these settings:

### 7. Initialize Database
```bash
# Push database schema
npm run db:push

# Generate test data
curl -X POST http://localhost:5000/api/generate-test-data
```

### 8. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Windows Setup

### 1. Install Node.js
1. Download Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Run the installer with administrator privileges
3. Verify installation in Command Prompt:
```cmd
node --version
npm --version
```

### 2. Install PostgreSQL
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Set superuser password
   - Default port: 5432
   - Default locale: [Default locale]

### 3. Configure PostgreSQL
Open PostgreSQL command line (psql) or pgAdmin:
```sql
CREATE USER tradewiser WITH PASSWORD 'tradewiser123';
CREATE DATABASE tradewiser_db OWNER tradewiser;
GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;
```

### 4. Install Git
Download and install Git from [git-scm.com](https://git-scm.com/download/win)

### 5. Clone and Setup Project
Open Command Prompt or PowerShell as Administrator:
```cmd
# Clone the repository
git clone <your-repository-url>
cd tradewiser

# Install dependencies
npm install

# The .env file is already included and ready to use!
# No need to copy from .env.example - it's preconfigured
```

### 6. Configure PostgreSQL Database
The `.env` file is preconfigured with these database settings:
- **Database Name**: `tradewiser_db`
- **Username**: `tradewiser`
- **Password**: `tradewiser123`

You just need to create the database user and database to match these settings.

### 7. Initialize Database
```cmd
# Push database schema
npm run db:push

# Generate test data (after starting the server)
curl -X POST http://localhost:5000/api/generate-test-data
```

### 8. Start the Application
```cmd
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Running the Application

### Default Access
- **URL**: http://localhost:5000
- **Test User**: 
  - Username: `testuser`
  - Password: `password123`

### Available Scripts
```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push     # Apply schema changes
npm run db:generate # Generate migrations

# Utilities
npm run lint        # Code linting
npm run test        # Run tests
```

## Application Features

### 1. Dashboard
- View commodity holdings
- Track warehouse receipts
- Monitor loan status
- Real-time notifications

### 2. Commodity Management
- **Green Channel**: Direct deposits using internal warehouses
- **Orange Channel**: Import external warehouse receipts
- **Red Channel**: Self-certified commodity documentation

### 3. Electronic Warehouse Receipts (eWRs)
- Blockchain-secured receipts
- QR code verification
- Transferable ownership
- Collateral for loans

### 4. Individual Sack Tracking
- 50kg sack granularity
- Unique blockchain hashes
- Movement history
- Quality assessments

### 5. Lending System
- Warehouse receipt financing (WRF)
- Overdraft-style credit facilities
- Multiple lending partner integration
- Automated underwriting

### 6. Payment System
- Bank API integration
- UPI support
- Downloadable receipts
- Transaction tracking

## Step-by-Step First Run

### After Installation:

1. **Start the server**:
```bash
npm run dev
```

2. **Generate test data** (in a new terminal):
```bash
curl -X POST http://localhost:5000/api/generate-test-data
```

3. **Access the application**:
   - Open browser to http://localhost:5000
   - Login with: `testuser` / `password123`

4. **Explore the features**:
   - Dashboard shows commodity overview
   - Receipts page shows electronic warehouse receipts
   - Individual sack tracking with blockchain hashes
   - Warehouse locations across India

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status (Ubuntu)
sudo systemctl status postgresql

# Check PostgreSQL status (Windows)
# Use Services.msc to check PostgreSQL service

# Test database connection
psql -h localhost -U tradewiser -d tradewiser_db
```

#### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000  # Ubuntu
netstat -ano | findstr :5000  # Windows

# Kill the process
sudo kill -9 <PID>  # Ubuntu
taskkill /PID <PID> /F  # Windows
```

#### Node.js Module Errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json  # Ubuntu
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

### Performance Optimization

#### Ubuntu
```bash
# Increase file watchers for development
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### Windows
```cmd
# Increase Node.js memory limit
set NODE_OPTIONS=--max_old_space_size=4096
```

## Production Deployment

### Ubuntu Server
1. Install PM2 for process management:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tradewiser',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

1. **Database Security**
   - Use strong passwords
   - Configure PostgreSQL for secure connections
   - Regular backups

2. **Application Security**
   - Keep dependencies updated
   - Use environment variables for secrets
   - Implement rate limiting

3. **Network Security**
   - Use HTTPS in production
   - Configure firewall rules
   - Regular security audits

## Test Data Included

The platform comes with comprehensive test data:

### Test User
- **Username**: testuser
- **Password**: password123
- **Role**: Farmer
- **KYC**: Verified

### Sample Warehouses
- Delhi Central Warehouse (Delhi)
- Mumbai Port Warehouse (Maharashtra)
- Kolkata East Warehouse (West Bengal)

### Sample Commodities
- Premium Wheat (1000kg)
- Basmati Rice (2000kg)
- Yellow Soybean (1500kg)

### Electronic Warehouse Receipts
- EWR-WHEAT-2023-001
- EWR-RICE-2023-002
- EWR-SOY-2023-003

### Individual Sack Tracking
- 10 sacks per commodity (50kg each)
- Unique blockchain hashes
- Movement and quality assessment records

## Support and Documentation

### Logs Location
- **Development**: Console output
- **Production**: PM2 logs (`pm2 logs tradewiser`)

### Configuration Files
- `.env` - Environment variables
- `drizzle.config.ts` - Database configuration
- `package.json` - Dependencies and scripts

For additional support or questions, please refer to the project documentation or contact the development team.

---

## Super Quick Start (Ready-to-Use Configuration)

The repository includes a pre-configured `.env` file with working defaults. Just follow these steps:

### Ubuntu/Linux:
```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y nodejs npm postgresql postgresql-contrib git

# 2. Setup PostgreSQL
sudo -u postgres psql -c "CREATE USER tradewiser WITH PASSWORD 'tradewiser123';"
sudo -u postgres psql -c "CREATE DATABASE tradewiser_db OWNER tradewiser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;"

# 3. Clone and start
git clone <your-repository-url>
cd tradewiser
npm install
npm run db:push
npm run dev

# 4. In another terminal, generate test data
curl -X POST http://localhost:5000/api/generate-test-data

# 5. Access the app
# Open http://localhost:5000
# Login: testuser / password123
```

### Windows:
```cmd
# 1. Install Node.js and PostgreSQL from their websites
# 2. In PostgreSQL (psql or pgAdmin):
CREATE USER tradewiser WITH PASSWORD 'tradewiser123';
CREATE DATABASE tradewiser_db OWNER tradewiser;
GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;

# 3. Clone and start
git clone <your-repository-url>
cd tradewiser
npm install
npm run db:push
npm run dev

# 4. In another command prompt, generate test data
curl -X POST http://localhost:5000/api/generate-test-data

# 5. Access the app
# Open http://localhost:5000
# Login: testuser / password123
```

## Configuration Files Included

### `.env` (Ready to Use)
The repository includes a working `.env` file with these preconfigured settings:
```env
DATABASE_URL=postgresql://tradewiser:tradewiser123@localhost:5432/tradewiser_db
PGHOST=localhost
PGPORT=5432
PGUSER=tradewiser
PGPASSWORD=tradewiser123
PGDATABASE=tradewiser_db
SESSION_SECRET=tradewiser_super_secure_session_secret_2024_blockchain_commodity_platform
PORT=5000
NODE_ENV=development
```

### `.env.example` (Template)
Contains the same configuration as a template for different environments.

**No manual configuration needed!** Just create the PostgreSQL user and database to match the settings above.

## Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install PostgreSQL
- [ ] Create database user: `tradewiser` with password: `tradewiser123`
- [ ] Create database: `tradewiser_db`
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Run `npm run db:push`
- [ ] Start server with `npm run dev`
- [ ] Generate test data via API call
- [ ] Access http://localhost:5000
- [ ] Login with testuser/password123
- [ ] Explore the platform features

The platform is now ready for use with comprehensive test data including electronic warehouse receipts and blockchain-tracked commodity sacks!