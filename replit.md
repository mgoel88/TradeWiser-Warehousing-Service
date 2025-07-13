# TradeWiser Platform - Replit Configuration

## Project Overview
TradeWiser is a comprehensive blockchain-powered agricultural commodity platform that provides secure, transparent digital infrastructure for warehousing, commodity tracking, and collateral-based lending. The platform features electronic warehouse receipts (eWRs), individual 50kg sack tracking with blockchain verification, and a three-channel classification system.

## Current Status
- **Application Status**: Running successfully on port 5000
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: Session-based with test user (testuser/password123)
- **Docker Support**: Full containerization with docker-compose
- **Deployment**: Simplified with one-command setup

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js with Express, PostgreSQL, Drizzle ORM
- **Database**: PostgreSQL with JSON fields for blockchain data
- **Real-time**: WebSocket integration for live updates
- **Containerization**: Docker with multi-service compose setup

## Recent Changes
- **2025-01-13**: Fixed Docker environment variable issues in docker-compose.yml
- **2025-01-13**: Added proper env_file configuration and Docker entry point script
- **2025-01-13**: Enhanced startup scripts with environment validation
- **2025-01-13**: Created comprehensive .dockerignore for optimized builds
- **2025-01-13**: Added database initialization script for PostgreSQL setup
- **2025-01-11**: Fixed application startup issues by resolving template literal syntax errors
- **2025-01-11**: Added comprehensive Docker support with docker-compose.yml
- **2025-01-11**: Created detailed README.md with complete database schema documentation
- **2025-01-11**: Implemented simplified setup scripts for Windows and Unix systems
- **2025-01-11**: Added Makefile for developer convenience commands
- **2025-01-11**: Created production-ready .env configuration files

## User Preferences
- **Deployment**: User prefers Docker-based deployment for easy setup
- **Documentation**: Comprehensive documentation with database schema details
- **Simplicity**: Focus on one-command setup and clear instructions
- **Environment**: Prefer environment variables over hardcoded configuration

## Technical Decisions
- **Simplified Routes**: Temporarily simplified routes.ts to resolve startup issues
- **Docker First**: Prioritized Docker setup for consistent deployment
- **Environment Variables**: All configuration through .env files
- **Database Schema**: Comprehensive schema with JSON fields for blockchain data
- **Real-time Updates**: WebSocket integration for live tracking

## Known Issues
- **Routes Restoration**: Need to restore full routes.ts functionality from routes-full.ts
- **Environment Variables**: Fixed Docker environment loading issues
- **Production Ready**: Docker setup fully functional with proper database initialization

## Database Schema
### Core Tables
- **users**: User accounts and authentication
- **warehouses**: Warehouse locations and management
- **commodities**: Agricultural commodities with blockchain tracking
- **warehouse_receipts**: Electronic warehouse receipts (eWRs)
- **commodity_sacks**: Individual 50kg sack tracking
- **loans**: Collateral-based lending system
- **processes**: Workflow and status tracking

### Features
- **Blockchain Integration**: Transaction hashes and smart contract simulation
- **Channel Classification**: Green, Orange, Red channel system
- **Real-time Tracking**: Live updates via WebSocket
- **Audit Trails**: Complete transaction history
- **Quality Management**: Continuous quality assessment

## Development Workflow
1. **Setup**: `./start.sh` or `start.bat` for one-command deployment
2. **Development**: `npm run dev` for local development
3. **Docker**: `docker-compose up -d` for containerized deployment
4. **Database**: `npm run db:push` for schema updates
5. **Testing**: Default credentials testuser/password123

## Next Steps
- Restore full routes.ts functionality with all advanced features
- Implement complete blockchain integration
- Add comprehensive test suite
- Enhance real-time tracking capabilities
- Improve mobile responsiveness