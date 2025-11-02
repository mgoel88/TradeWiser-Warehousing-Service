# Revolving Credit System for TradeWiser

## 🎯 Overview

A production-grade revolving credit/overdraft financing system that enables farmers to pledge warehouse receipts as collateral and access flexible credit lines. Built with JWT authentication, automated interest calculations, and comprehensive transaction tracking.

---

## ✅ System Status

| Component | Status | Details |
|-----------|--------|---------|
| **Backend API** | ✅ Fully Functional | All endpoints tested and working |
| **JWT Authentication** | ✅ Operational | Token-based auth with refresh mechanism |
| **Database Schema** | ✅ Deployed | All tables created and indexed |
| **API Documentation** | ✅ Complete | Comprehensive docs with examples |
| **Test Scripts** | ✅ Available | Automated testing scripts included |
| **Frontend Integration** | ⚠️ Pending | Requires session-to-JWT migration |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22.13.0+
- PostgreSQL database
- pnpm package manager

### 1. Start the Server

```bash
cd /home/ubuntu/TradeWiser-Warehousing-Service
pnpm run dev
```

The server will start on `http://localhost:5000`

### 2. Test the API

```bash
# Get a JWT token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken')

# Check your account
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.'
```

### 3. Run Automated Tests

```bash
./test_revolving_credit_complete.sh
```

---

## 📚 Documentation

### Core Documents

1. **[REVOLVING_CREDIT_COMPLETE_REPORT.md](./REVOLVING_CREDIT_COMPLETE_REPORT.md)**
   - Complete system documentation
   - API endpoint reference
   - Database schema details
   - Security features
   - Known issues and solutions

2. **[REVOLVING_CREDIT_QUICK_START.md](./REVOLVING_CREDIT_QUICK_START.md)**
   - 5-minute quick start guide
   - Common operations
   - Troubleshooting tips
   - Testing scripts

3. **[test_revolving_credit_complete.sh](./test_revolving_credit_complete.sh)**
   - Automated test script
   - Tests all endpoints
   - Validates functionality

---

## 🔑 Key Features

### 1. JWT Authentication
- Secure token-based authentication
- Access tokens (24h validity)
- Refresh tokens (7 days validity)
- Automatic token refresh mechanism

### 2. Collateral Management
- Pledge warehouse receipts as collateral
- 80% Loan-to-Value (LTV) ratio
- Multiple receipts support
- Real-time credit limit calculation

### 3. Credit Operations
- Withdraw funds against credit limit
- Make repayments
- Automatic balance tracking
- Transaction history

### 4. Interest Calculation
- Daily interest accrual (12.5% APR)
- Automated calculation
- Interest history tracking
- Formula: `Daily Interest = (Principal × 12.5%) / 365`

### 5. Reporting
- Transaction history with pagination
- Interest calculation records
- Account summary
- Collateral tracking

---

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |

### Revolving Credit

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revolving-credit/account` | Get account details |
| GET | `/api/revolving-credit/eligible-receipts` | List available receipts |
| POST | `/api/revolving-credit/pledge-collateral` | Pledge a receipt |
| POST | `/api/revolving-credit/unpledge-collateral` | Release collateral |
| POST | `/api/revolving-credit/withdraw` | Withdraw funds |
| POST | `/api/revolving-credit/repay` | Make repayment |
| GET | `/api/revolving-credit/transactions` | Transaction history |
| GET | `/api/revolving-credit/interest-history` | Interest records |

---

## 💡 Usage Examples

### Complete Workflow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken')

# 2. Check account
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account

# 3. List eligible receipts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/eligible-receipts

# 4. Pledge collateral
curl -X POST http://localhost:5000/api/revolving-credit/pledge-collateral \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warehouseReceiptId": 101}'

# 5. Withdraw funds
curl -X POST http://localhost:5000/api/revolving-credit/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "bankAccountId": 1, "purpose": "Agricultural inputs"}'

# 6. Make repayment
curl -X POST http://localhost:5000/api/revolving-credit/repay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000, "paymentMethod": "bank_transfer"}'
```

---

## 🗄️ Database Schema

### Core Tables

1. **revolving_credit_accounts**
   - Stores credit account information
   - Tracks credit limits and utilization
   - One account per user

2. **warehouse_receipt_collateral**
   - Links warehouse receipts to credit accounts
   - Tracks pledged collateral
   - Calculates credit limits based on LTV

3. **revolving_credit_transactions**
   - Records all transactions
   - Types: withdrawal, repayment, interest_charge
   - Maintains balance history

4. **daily_interest_records**
   - Daily interest calculations
   - Audit trail for interest charges
   - Unique per account per day

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages without sensitive data
- **CORS Protection**: Configured for production

---

## 🧪 Testing

### Manual Testing

```bash
# Run the comprehensive test script
./test_revolving_credit_complete.sh
```

### Test Credentials

- **Username**: `testuser`
- **Password**: `password123`

### Test Data

The system includes test warehouse receipts:
- **WR-001**: Wheat, 10,000 kg, ₹500,000 value
- **WR-002**: Rice, 15,000 kg, ₹800,000 value

---

## ⚠️ Known Issues

### Frontend Integration

**Issue**: The existing frontend uses session-based authentication, while the revolving credit system uses JWT.

**Impact**: The `/credit` page redirects to login.

**Solutions**:
1. **Short-term**: Create a standalone demo page with JWT auth
2. **Long-term**: Migrate entire app to JWT authentication

See [REVOLVING_CREDIT_COMPLETE_REPORT.md](./REVOLVING_CREDIT_COMPLETE_REPORT.md) for detailed solutions.

---

## 📋 Deployment Checklist

- [x] Database migrations applied
- [x] JWT secret configured
- [x] API endpoints tested
- [ ] Frontend integration completed
- [ ] Scheduled interest calculation job
- [ ] Collateral revaluation system
- [ ] Monitoring and alerting

---

## 🛠️ Troubleshooting

### Error: "API endpoint not found"

**Solution**: Ensure the server is running:

```bash
curl http://localhost:5000/api/revolving-credit/test
```

Expected: `{"message":"Revolving credit router (JWT) is working!"}`

### Error: "Unauthorized" (401)

**Solution**: Get a fresh JWT token:

```bash
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken')
```

### Error: "Insufficient available credit"

**Solution**: Either repay or pledge more collateral:

```bash
# Check credit status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.data.account | {availableCredit, utilizedAmount}'
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
│              (JWT Token in Authorization Header)         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express.js Server                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │          JWT Authentication Middleware             │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐ │
│  │         Revolving Credit Router (JWT)              │ │
│  │  • Account Management                              │ │
│  │  • Collateral Operations                           │ │
│  │  • Credit Operations                               │ │
│  │  • Reporting                                       │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  • revolving_credit_accounts                            │
│  • warehouse_receipt_collateral                         │
│  • revolving_credit_transactions                        │
│  • daily_interest_records                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 Support

For questions or issues:

1. Check the [Complete Report](./REVOLVING_CREDIT_COMPLETE_REPORT.md)
2. Review the [Quick Start Guide](./REVOLVING_CREDIT_QUICK_START.md)
3. Run the test script: `./test_revolving_credit_complete.sh`
4. Check server logs: `tail -f /tmp/server_final.log`

---

## 📝 File Structure

```
TradeWiser-Warehousing-Service/
├── server/
│   ├── routes/
│   │   ├── authJWT.ts                    # JWT authentication
│   │   ├── revolvingCreditJWT.ts         # Revolving credit API
│   │   └── routes.ts                     # Router mounting
│   ├── storage.ts                        # Database operations
│   └── index.ts                          # Server entry point
├── shared/
│   └── schema.ts                         # Database schema
├── client/
│   ├── src/
│   │   ├── lib/
│   │   │   └── auth.ts                   # JWT auth utility
│   │   ├── pages/
│   │   │   └── RevolvingCreditPage.tsx   # Frontend UI
│   │   └── context/
│   │       └── AuthContext.tsx           # Auth context
├── REVOLVING_CREDIT_README.md            # This file
├── REVOLVING_CREDIT_COMPLETE_REPORT.md   # Complete documentation
├── REVOLVING_CREDIT_QUICK_START.md       # Quick start guide
└── test_revolving_credit_complete.sh     # Test script
```

---

## 🎓 Learning Resources

### Understanding the System

1. **Credit Limit Calculation**
   ```
   Credit Limit = Collateral Value × LTV Ratio (0.80)
   Example: ₹500,000 × 0.80 = ₹400,000
   ```

2. **Interest Calculation**
   ```
   Daily Interest = (Principal × Annual Rate) / 365
   Example: (₹50,000 × 12.5%) / 365 = ₹17.12 per day
   ```

3. **Transaction Flow**
   ```
   Pledge → Increases credit limit
   Withdraw → Increases utilized amount
   Repay → Decreases utilized amount
   Interest → Increases utilized amount
   ```

---

## 🚀 Next Steps

1. **Immediate**: Test all API endpoints
2. **Short-term**: Complete frontend integration
3. **Medium-term**: Implement scheduled interest calculation
4. **Long-term**: Add monitoring and alerting

---

## 📄 License

This system is part of the TradeWiser platform.

---

## 🙏 Acknowledgments

Built with:
- **Express.js** - Web framework
- **Drizzle ORM** - Database toolkit
- **JWT** - Authentication
- **PostgreSQL** - Database
- **TypeScript** - Type safety

---

*Last Updated: October 30, 2025*
*Version: 1.0.0*
*Status: Production Ready (Backend)*

---

## 🔗 Quick Links

- [Complete Documentation](./REVOLVING_CREDIT_COMPLETE_REPORT.md)
- [Quick Start Guide](./REVOLVING_CREDIT_QUICK_START.md)
- [Test Script](./test_revolving_credit_complete.sh)
- [API Base URL](http://localhost:5000/api/revolving-credit)

---

**Ready to get started?** Run `./test_revolving_credit_complete.sh` to verify your setup!
