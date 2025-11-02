# Revolving Credit System - Quick Start Guide

## Overview

The Revolving Credit System allows farmers to pledge warehouse receipts as collateral and access flexible credit lines. This guide will help you get started quickly.

---

## Prerequisites

- TradeWiser server running on `http://localhost:5000`
- PostgreSQL database configured
- Test user account created (username: `testuser`, password: `password123`)

---

## Quick Start (5 Minutes)

### Step 1: Get Your JWT Token

```bash
# Login and save the token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken' > token.txt

# Set the token as an environment variable
export TOKEN=$(cat token.txt)
```

### Step 2: Check Your Account

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "account": {
      "totalCreditLimit": 0,
      "utilizedAmount": 0,
      "availableCredit": 0,
      "annualInterestRate": 12.5,
      "status": "active"
    },
    "collateralReceipts": [],
    "recentTransactions": [],
    "recentInterest": []
  }
}
```

### Step 3: Find Eligible Warehouse Receipts

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/eligible-receipts \
  -s | jq '.data.receipts'
```

### Step 4: Pledge a Warehouse Receipt

```bash
# Pledge receipt ID 101 (replace with your actual receipt ID)
curl -X POST http://localhost:5000/api/revolving-credit/pledge-collateral \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warehouseReceiptId": 101}' \
  -s | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Collateral pledged successfully",
  "data": {
    "collateral": {
      "id": 1,
      "creditLimit": 400000,
      "ltvRatio": 0.8
    },
    "newCreditLimit": 400000,
    "newAvailableCredit": 400000
  }
}
```

### Step 5: Withdraw Funds

```bash
curl -X POST http://localhost:5000/api/revolving-credit/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "bankAccountId": 1,
    "purpose": "Purchase agricultural inputs"
  }' \
  -s | jq '.'
```

### Step 6: Make a Repayment

```bash
curl -X POST http://localhost:5000/api/revolving-credit/repay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25000,
    "paymentMethod": "bank_transfer"
  }' \
  -s | jq '.'
```

### Step 7: View Transaction History

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/revolving-credit/transactions?page=1&limit=10" \
  -s | jq '.data.transactions'
```

---

## Common Operations

### Check Available Credit

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.data.account | {availableCredit, utilizedAmount, totalCreditLimit}'
```

### List All Collateral

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.data.collateralReceipts'
```

### View Interest Charges

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/revolving-credit/interest-history?startDate=2025-10-01&endDate=2025-10-31" \
  -s | jq '.data'
```

### Unpledge Collateral

```bash
# Unpledge collateral ID 1 (only if sufficient credit available)
curl -X POST http://localhost:5000/api/revolving-credit/unpledge-collateral \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"collateralId": 1}' \
  -s | jq '.'
```

---

## Understanding the System

### Credit Limit Calculation

- **Loan-to-Value (LTV) Ratio**: 80%
- **Formula**: Credit Limit = Collateral Value × 0.80
- **Example**: ₹500,000 warehouse receipt → ₹400,000 credit limit

### Interest Calculation

- **Annual Interest Rate**: 12.5% (configurable)
- **Daily Interest**: (Principal × Annual Rate) / 365
- **Example**: ₹50,000 balance → ₹17.12 per day

### Transaction Types

1. **Withdrawal**: Borrowing funds (increases utilized amount)
2. **Repayment**: Paying back funds (decreases utilized amount)
3. **Interest Charge**: Daily interest accrual (increases utilized amount)

---

## Troubleshooting

### Error: "API endpoint not found"

**Solution**: Ensure the server is running and the router is properly mounted.

```bash
# Test if the server is running
curl http://localhost:5000/api/test

# Test if the revolving credit router is mounted
curl http://localhost:5000/api/revolving-credit/test
```

### Error: "Unauthorized" (401)

**Solution**: Your JWT token may have expired. Get a new token:

```bash
export TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken')
```

### Error: "Warehouse receipt not found or already pledged"

**Solution**: Check eligible receipts:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/eligible-receipts \
  -s | jq '.data.receipts[] | {id, receiptNumber, status}'
```

### Error: "Insufficient available credit"

**Solution**: Either repay some of your balance or pledge more collateral:

```bash
# Check your current credit status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.data.account | {availableCredit, utilizedAmount}'
```

---

## Testing Script

Save this as `test_revolving_credit.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Revolving Credit System Test ===${NC}\n"

# 1. Login
echo -e "${GREEN}1. Logging in...${NC}"
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Login successful${NC}\n"

# 2. Check account
echo -e "${GREEN}2. Checking account...${NC}"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/account \
  -s | jq '.data.account | {totalCreditLimit, availableCredit, utilizedAmount}'
echo ""

# 3. List eligible receipts
echo -e "${GREEN}3. Listing eligible receipts...${NC}"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/revolving-credit/eligible-receipts \
  -s | jq '.data.receipts[] | {id, receiptNumber, commodityType, maxCreditLimit}'
echo ""

# 4. View transactions
echo -e "${GREEN}4. Viewing transaction history...${NC}"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/revolving-credit/transactions?limit=5" \
  -s | jq '.data.transactions[] | {type, amount, date}'
echo ""

echo -e "${BLUE}=== Test Complete ===${NC}"
```

Make it executable and run:

```bash
chmod +x test_revolving_credit.sh
./test_revolving_credit.sh
```

---

## Next Steps

1. **Explore the API**: Try different endpoints and parameters
2. **Read the Full Documentation**: See `REVOLVING_CREDIT_COMPLETE_REPORT.md`
3. **Integrate with Frontend**: Use the JWT auth utility in `client/src/lib/auth.ts`
4. **Set Up Monitoring**: Track credit usage and interest accrual

---

## Support

For detailed API documentation, see:
- `REVOLVING_CREDIT_COMPLETE_REPORT.md` - Complete system documentation
- `server/routes/revolvingCreditJWT.ts` - API implementation
- `shared/schema.ts` - Database schema

**Test Credentials**:
- Username: `testuser`
- Password: `password123`

**API Base URL**: http://localhost:5000/api/revolving-credit

---

*Last updated: October 30, 2025*
