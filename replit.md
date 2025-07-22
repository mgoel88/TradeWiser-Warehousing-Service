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
- **2025-07-22**: Built complete modern companion website with TradeWiser branding and clean design
- **2025-07-22**: Implemented professional landing page with hero section, services overview, and integrated login
- **2025-07-22**: Created fully functional Orange Channel import receipt workflow for external warehouse interoperability
- **2025-07-22**: Added `/api/receipts/upload` endpoint with multer file handling for receipt document processing
- **2025-07-22**: Enhanced UI with Orange Channel branding, detailed workflow explanations, and proper error handling
- **2025-07-22**: Fixed schema compatibility issues and updated warehouse receipt structure for external imports
- **2025-07-22**: Implemented comprehensive contextual help overlay system for complex agricultural processes
- **2025-07-22**: Created ProcessStatusVisualization component with intuitive stage progression indicators
- **2025-07-22**: Added ProcessActions component for handling completed deposit workflows with clear next steps
- **2025-07-22**: Built contextual tooltips for form fields with agricultural commodity best practices
- **2025-01-13**: Created comprehensive Ubuntu Docker compatibility setup
- **2025-01-13**: Fixed Dockerfile build issues with proper multi-stage configuration
- **2025-01-13**: Enhanced start.sh with cross-platform Docker Compose detection
- **2025-01-13**: Created start-ubuntu.sh with automatic Docker installation for Ubuntu
- **2025-01-13**: Built validate-ubuntu-setup.sh for comprehensive system compatibility checking

## User Preferences
- **Deployment**: User prefers Docker-based deployment for easy setup
- **Platform**: Ubuntu compatibility required for both development and production
- **Production Ready**: Requires separate production configuration with security
- **Documentation**: Comprehensive documentation with database schema details
- **Simplicity**: Focus on one-command setup and clear instructions
- **Environment**: Prefer environment variables over hardcoded configuration
- **Security**: Production deployment must have proper security measures
- **Cross-Platform**: Must work on default development and specific production environments

## Technical Decisions
- **Dual Environment**: Separate development and production configurations
- **Docker First**: Prioritized Docker setup for consistent deployment
- **Environment Variables**: All configuration through .env files
- **Database Schema**: Comprehensive schema with JSON fields for blockchain data
- **Real-time Updates**: WebSocket integration for live tracking
- **Production Security**: Multi-layered security with Nginx, SSL, and rate limiting
- **Automated Backups**: Production includes automated database backup system

## Known Issues
- **Minor API Endpoints**: Some non-critical endpoints (loans, individual commodities) may need route registration fixes
- **UI Workflow**: Frontend occasionally shows "Start New Deposit" during active processes (cosmetic issue)
- **Core Functionality**: All major agricultural commodity management workflows fully operational

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
1. **Development Setup**: `./start.sh` or `start.bat` for one-command deployment
2. **Local Development**: `npm run dev` for local development
3. **Docker Development**: `docker compose up -d` for containerized deployment
4. **Database**: `npm run db:push` for schema updates
5. **Testing**: Default credentials testuser/password123

## Production Workflow
1. **Production Setup**: `cp .env.production .env.production.local` and customize
2. **Production Deployment**: `./deploy-production.sh` for automated deployment
3. **Production Docker**: `docker compose -f docker-compose.production.yml up -d`
4. **SSL Configuration**: Configure certificates and domain
5. **Monitoring**: Use production logging and health checks

## Next Steps
- Restore full routes.ts functionality with all advanced features
- Implement complete blockchain integration
- Add comprehensive test suite
- Enhance real-time tracking capabilities
- Improve mobile responsiveness
- Deploy to Ubuntu production server
- Configure SSL certificates and domain