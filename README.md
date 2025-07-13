# TradeWiser - Blockchain-Powered Agricultural Commodity Platform

A comprehensive digital platform for warehouse management, collateral management, and lending services focused on agricultural commodities. The platform integrates blockchain technology for secure ownership transfers and lending processes with real-time tracking capabilities.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd tradewiser
cp .env.docker .env
```

### 2. Start with Docker Compose
```bash
# Option 1: Use provided scripts (recommended)
./start.sh              # Linux/Mac
start.bat               # Windows

# Option 2: Manual Docker commands
docker-compose up --build -d    # or: docker compose up --build -d
```

### 3. Wait for Services (2-3 minutes)
```bash
# Monitor startup progress
docker-compose logs -f

# Check service status
docker-compose ps

# Test when ready
curl http://localhost:5000/api/test
```

### 4. Access the Application
- **Web App**: http://localhost:5000
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 5. Default Login Credentials
- **Username**: `testuser`
- **Password**: `password123`

### 6. Troubleshooting
If you encounter issues:
```bash
# Run comprehensive test
./docker-test-complete.sh

# Or check individual components
docker-compose logs app
docker-compose logs database
docker-compose exec database pg_isready -U tradewiser
```

## 📋 Manual Setup (Alternative)

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Setup database
createdb tradewiser_db
psql -d tradewiser_db -f db/init.sql

# Configure environment
cp .env.docker .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## 🏗️ Project Architecture

### Core Components
1. **Frontend (React + TypeScript)**
   - Modern React with hooks and TypeScript
   - Tailwind CSS for styling
   - React Query for data fetching
   - Real-time updates via WebSockets

2. **Backend (Node.js + Express)**
   - Express.js REST API
   - PostgreSQL with Drizzle ORM
   - Session-based authentication
   - WebSocket for real-time features

3. **Database (PostgreSQL)**
   - Relational database with JSON fields
   - Blockchain transaction tracking
   - Audit trails and movement history

4. **Blockchain Integration**
   - Smart contract simulation
   - Transaction hash tracking
   - Ownership transfer verification

## 🗄️ Database Schema

### Core Tables

#### 1. Users
```sql
users (
  id: INTEGER PRIMARY KEY,
  username: VARCHAR UNIQUE,
  email: VARCHAR UNIQUE,
  password: VARCHAR,
  full_name: VARCHAR,
  phone: VARCHAR,
  role: user_role,
  created_at: TIMESTAMP
)
```

#### 2. Warehouses
```sql
warehouses (
  id: INTEGER PRIMARY KEY,
  name: VARCHAR,
  location: VARCHAR,
  capacity: INTEGER,
  manager_id: INTEGER (FK -> users.id),
  license_number: VARCHAR,
  created_at: TIMESTAMP
)
```

#### 3. Commodities
```sql
commodities (
  id: INTEGER PRIMARY KEY,
  name: VARCHAR,
  category: VARCHAR,
  description: TEXT,
  owner_id: INTEGER (FK -> users.id),
  warehouse_id: INTEGER (FK -> warehouses.id),
  quantity: DECIMAL,
  measurement_unit: VARCHAR,
  quality_grade: VARCHAR,
  channel_type: channel_type,
  status: commodity_status,
  created_at: TIMESTAMP
)
```

#### 4. Warehouse Receipts (eWRs)
```sql
warehouse_receipts (
  id: INTEGER PRIMARY KEY,
  receipt_number: VARCHAR UNIQUE,
  commodity_id: INTEGER (FK -> commodities.id),
  owner_id: INTEGER (FK -> users.id),
  warehouse_id: INTEGER (FK -> warehouses.id),
  quantity: DECIMAL,
  status: VARCHAR,
  blockchain_hash: VARCHAR,
  liens: JSONB,
  created_at: TIMESTAMP
)
```

#### 5. Commodity Sacks (Individual Tracking)
```sql
commodity_sacks (
  id: INTEGER PRIMARY KEY,
  sack_id: VARCHAR UNIQUE,
  receipt_id: INTEGER (FK -> warehouse_receipts.id),
  weight: DECIMAL,
  quality_grade: VARCHAR,
  blockchain_hash: VARCHAR,
  barcode_data: JSONB,
  location: VARCHAR,
  status: VARCHAR,
  created_at: TIMESTAMP
)
```

#### 6. Loans
```sql
loans (
  id: INTEGER PRIMARY KEY,
  borrower_id: INTEGER (FK -> users.id),
  lender_id: INTEGER (FK -> users.id),
  collateral_receipt_id: INTEGER (FK -> warehouse_receipts.id),
  amount: DECIMAL,
  interest_rate: DECIMAL,
  duration_days: INTEGER,
  status: loan_status,
  blockchain_hash: VARCHAR,
  created_at: TIMESTAMP
)
```

#### 7. Processes (Workflow Tracking)
```sql
processes (
  id: INTEGER PRIMARY KEY,
  user_id: INTEGER (FK -> users.id),
  warehouse_id: INTEGER (FK -> warehouses.id),
  commodity_id: INTEGER (FK -> commodities.id),
  process_type: VARCHAR,
  status: process_status,
  current_stage: VARCHAR,
  stage_progress: JSONB,
  created_at: TIMESTAMP
)
```

### Supporting Tables
- **sack_movements**: Track sack location changes
- **sack_quality_assessments**: Quality inspection records
- **loan_repayments**: Loan payment history
- **receipt_transfers**: Ownership transfer records

## 🔄 Application Flow

### 1. User Registration & Authentication
```
Register/Login → Session Creation → Role-Based Access
```

### 2. Commodity Management Flow
```
Commodity Creation → Warehouse Assignment → Quality Assessment → 
Channel Classification (Green/Orange/Red) → eWR Generation
```

### 3. Blockchain Tracking Flow
```
Asset Creation → Hash Generation → Blockchain Recording → 
Ownership Transfer → Smart Contract Execution
```

### 4. Lending Process Flow
```
Collateral Evaluation → Credit Assessment → Loan Approval → 
Disbursement → Repayment Tracking → Collateral Release
```

### 5. Warehouse Operations Flow
```
Commodity Deposit → Quality Check → Sack Tagging → 
Storage Assignment → Movement Tracking → Withdrawal Process
```

## 🚦 Channel Classification System

### Green Channel
- **Requirements**: High-quality commodities, verified farmers
- **Features**: Direct trading, minimal paperwork, fast processing
- **Benefits**: Lower fees, priority processing

### Orange Channel
- **Requirements**: Medium-quality commodities, additional verification
- **Features**: Moderate processing time, standard documentation
- **Benefits**: Standard rates, regular processing

### Red Channel
- **Requirements**: Lower-quality or high-risk commodities
- **Features**: Extensive verification, detailed documentation
- **Benefits**: Higher scrutiny, additional safeguards

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Check session
- `POST /api/auth/logout` - User logout

### Commodities
- `GET /api/commodities` - List commodities
- `POST /api/commodities` - Create commodity
- `GET /api/commodities/:id` - Get commodity details
- `POST /api/commodities/:id/withdraw` - Withdraw commodity

### Warehouse Receipts
- `GET /api/receipts` - List receipts
- `POST /api/receipts` - Create receipt
- `GET /api/receipts/:id` - Get receipt details
- `POST /api/receipts/:id/transfer` - Transfer ownership

### Loans
- `GET /api/loans` - List loans
- `POST /api/loans` - Create loan
- `GET /api/loans/:id` - Get loan details
- `POST /api/loans/:id/repay` - Repay loan

### Sack Tracking
- `GET /api/commodity-sacks` - List sacks
- `POST /api/commodity-sacks` - Create sack
- `GET /api/commodity-sacks/:id` - Get sack details
- `POST /api/commodity-sacks/:id/transfer` - Transfer sack

## 🔒 Security Features

### Authentication & Authorization
- Session-based authentication
- Role-based access control
- Secure password hashing
- CSRF protection

### Data Security
- SQL injection prevention
- Input validation with Zod
- File upload restrictions
- Rate limiting

### Blockchain Security
- Hash verification
- Transaction immutability
- Smart contract validation
- Audit trail maintenance

## 🛠️ Development

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tradewiser_db
PGHOST=localhost
PGPORT=5432
PGUSER=tradewiser
PGPASSWORD=password

# Session
SESSION_SECRET=your_secret_key

# Application
NODE_ENV=development
PORT=5000
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open database studio

# Docker operations
docker-compose up -d              # Start all services
docker-compose logs -f app        # View app logs
docker-compose down               # Stop all services
```

### Testing
```bash
# Test API endpoints
curl http://localhost:5000/api/test

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 🎯 Use Cases

### For Farmers
- Deposit commodities in certified warehouses
- Generate electronic warehouse receipts (eWRs)
- Use eWRs as collateral for loans
- Track commodity quality and location

### For Traders
- Purchase commodities using eWRs
- Verify authenticity through blockchain
- Transfer ownership securely
- Access market pricing data

### For Lenders
- Evaluate collateral value
- Monitor loan performance
- Automate repayment processes
- Manage risk exposure

### For Warehouse Managers
- Track inventory in real-time
- Manage quality assessments
- Process deposits and withdrawals
- Generate compliance reports

## 🌟 Key Features

### Blockchain Integration
- **Immutable Records**: All transactions recorded on blockchain
- **Smart Contracts**: Automated loan processing and collateral management
- **Hash Verification**: Ensure data integrity and prevent tampering
- **Audit Trails**: Complete transaction history

### Real-Time Tracking
- **WebSocket Updates**: Live status updates
- **Location Tracking**: Real-time commodity location
- **Quality Monitoring**: Continuous quality assessment
- **Movement History**: Complete audit trail

### Advanced Analytics
- **Risk Assessment**: Automated risk scoring
- **Portfolio Analysis**: Comprehensive portfolio insights
- **Market Intelligence**: Real-time pricing and trends
- **Compliance Reporting**: Regulatory compliance tools

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Monitor deployment
docker-compose logs -f

# Health checks
docker-compose ps
```

### Manual Deployment
```bash
# Build application
npm run build

# Start production server
npm start

# Process manager (PM2)
pm2 start dist/index.js --name tradewiser
```

## 📞 Support

For technical support or questions:
- Check the logs: `docker-compose logs -f`
- Review the API documentation in this README
- Verify database connections and environment variables
- Test with the provided default credentials

## 🔮 Future Enhancements

- Multi-currency support
- Advanced analytics dashboard
- Mobile application
- Integration with external exchanges
- AI-powered risk assessment
- Automated market making

---

**TradeWiser** - Empowering agricultural trade through blockchain technology and digital innovation.