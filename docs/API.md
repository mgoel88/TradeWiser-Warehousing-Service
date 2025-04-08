
# TradeWiser API Documentation

## Authentication
All API endpoints require authentication using session-based auth.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "fullName": "string"
}
```

## Warehouses

### List Warehouses
```http
GET /api/warehouses
```

### Get Warehouse
```http
GET /api/warehouses/{id}
```

## Receipts

### List Receipts
```http
GET /api/receipts
```

### Create Receipt
```http
POST /api/receipts
Content-Type: application/json

{
  "commodityId": "number",
  "quantity": "string",
  "warehouseId": "number"
}
```

### Transfer Receipt
```http
POST /api/receipts/{id}/transfer
Content-Type: application/json

{
  "receiverId": "number",
  "transferType": "string",
  "transactionHash": "string"
}
```

## Loans

### List Loans
```http
GET /api/loans
```

### Create Loan
```http
POST /api/loans
Content-Type: application/json

{
  "amount": "string",
  "collateralReceiptIds": "number[]",
  "interestRate": "string"
}
```

### Repay Loan
```http
POST /api/loans/{id}/repay
Content-Type: application/json

{
  "amount": "string",
  "paymentMethod": "string"
}
```
