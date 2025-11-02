#!/bin/bash

# Revolving Credit System - Comprehensive Test Script
# This script tests all endpoints of the revolving credit system

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000"
TOKEN=""

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test 1: Login
print_header "Test 1: Authentication"
echo "Logging in with test credentials..."
LOGIN_RESPONSE=$(curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -s)

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    print_error "Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Login successful"
print_info "Token: ${TOKEN:0:50}..."

# Test 2: Get Account Details
print_header "Test 2: Get Account Details"
ACCOUNT_RESPONSE=$(curl -H "Authorization: Bearer $TOKEN" \
  $API_BASE/api/revolving-credit/account \
  -s)

echo "$ACCOUNT_RESPONSE" | jq '.data.account'

if [ "$(echo $ACCOUNT_RESPONSE | jq -r '.success')" = "true" ]; then
    print_success "Account details retrieved"
    CREDIT_LIMIT=$(echo $ACCOUNT_RESPONSE | jq -r '.data.account.totalCreditLimit')
    AVAILABLE_CREDIT=$(echo $ACCOUNT_RESPONSE | jq -r '.data.account.availableCredit')
    UTILIZED=$(echo $ACCOUNT_RESPONSE | jq -r '.data.account.utilizedAmount')
    print_info "Credit Limit: ₹$CREDIT_LIMIT"
    print_info "Available Credit: ₹$AVAILABLE_CREDIT"
    print_info "Utilized: ₹$UTILIZED"
else
    print_error "Failed to get account details"
fi

# Test 3: List Eligible Receipts
print_header "Test 3: List Eligible Warehouse Receipts"
RECEIPTS_RESPONSE=$(curl -H "Authorization: Bearer $TOKEN" \
  $API_BASE/api/revolving-credit/eligible-receipts \
  -s)

echo "$RECEIPTS_RESPONSE" | jq '.data.receipts'

RECEIPT_COUNT=$(echo $RECEIPTS_RESPONSE | jq '.data.receipts | length')
if [ "$RECEIPT_COUNT" -gt 0 ]; then
    print_success "Found $RECEIPT_COUNT eligible receipt(s)"
    FIRST_RECEIPT_ID=$(echo $RECEIPTS_RESPONSE | jq -r '.data.receipts[0].id')
    print_info "First receipt ID: $FIRST_RECEIPT_ID"
else
    print_info "No eligible receipts found (this is okay if all are already pledged)"
fi

# Test 4: List Collateral
print_header "Test 4: List Pledged Collateral"
COLLATERAL=$(echo $ACCOUNT_RESPONSE | jq '.data.collateralReceipts')
echo "$COLLATERAL" | jq '.'

COLLATERAL_COUNT=$(echo $COLLATERAL | jq 'length')
if [ "$COLLATERAL_COUNT" -gt 0 ]; then
    print_success "Found $COLLATERAL_COUNT pledged collateral(s)"
else
    print_info "No collateral pledged yet"
fi

# Test 5: Transaction History
print_header "Test 5: Transaction History"
TRANSACTIONS_RESPONSE=$(curl -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/revolving-credit/transactions?page=1&limit=10" \
  -s)

echo "$TRANSACTIONS_RESPONSE" | jq '.data.transactions'

TRANSACTION_COUNT=$(echo $TRANSACTIONS_RESPONSE | jq '.data.transactions | length')
if [ "$TRANSACTION_COUNT" -gt 0 ]; then
    print_success "Found $TRANSACTION_COUNT transaction(s)"
else
    print_info "No transactions yet"
fi

# Test 6: Interest History
print_header "Test 6: Interest History"
START_DATE=$(date -d "30 days ago" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)

INTEREST_RESPONSE=$(curl -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/revolving-credit/interest-history?startDate=$START_DATE&endDate=$END_DATE" \
  -s)

echo "$INTEREST_RESPONSE" | jq '.data'

INTEREST_COUNT=$(echo $INTEREST_RESPONSE | jq '.data.interestRecords | length')
if [ "$INTEREST_COUNT" -gt 0 ]; then
    print_success "Found $INTEREST_COUNT interest record(s)"
    TOTAL_INTEREST=$(echo $INTEREST_RESPONSE | jq -r '.data.totalInterest')
    print_info "Total interest: ₹$TOTAL_INTEREST"
else
    print_info "No interest records yet"
fi

# Test 7: Test Router Health
print_header "Test 7: Router Health Check"
HEALTH_RESPONSE=$(curl $API_BASE/api/revolving-credit/test -s)
echo "$HEALTH_RESPONSE" | jq '.'

if [ "$(echo $HEALTH_RESPONSE | jq -r '.message')" = "Revolving credit router (JWT) is working!" ]; then
    print_success "Router is healthy"
else
    print_error "Router health check failed"
fi

# Summary
print_header "Test Summary"
echo -e "${GREEN}All tests completed!${NC}\n"
echo "Account Status:"
echo "  - Credit Limit: ₹$CREDIT_LIMIT"
echo "  - Available: ₹$AVAILABLE_CREDIT"
echo "  - Utilized: ₹$UTILIZED"
echo "  - Collateral: $COLLATERAL_COUNT item(s)"
echo "  - Transactions: $TRANSACTION_COUNT"
echo "  - Interest Records: $INTEREST_COUNT"
echo ""
print_info "For detailed API documentation, see REVOLVING_CREDIT_COMPLETE_REPORT.md"
print_info "For quick start guide, see REVOLVING_CREDIT_QUICK_START.md"

