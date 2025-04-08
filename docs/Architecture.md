
# TradeWiser Architecture

## Overview
TradeWiser is a warehouse receipt financing platform built with:
- React + TypeScript (Frontend)
- Node.js + Express (Backend)
- PostgreSQL (Database)
- WebSocket (Real-time updates)

## Key Components

### Frontend
- React components for UI
- Real-time WebSocket integration
- Payment gateway integration
- Authentication context

### Backend
- RESTful API endpoints
- WebSocket server for real-time updates
- Database integration
- Document parsing service
- Payment processing service
- Blockchain integration

## Services

### ReceiptService
Handles warehouse receipt creation and management.

### PaymentService  
Processes payments and integrates with payment gateways.

### DocumentParsingService
Parses uploaded documents and extracts data.

### BlockchainService
Manages blockchain transactions and verification.

## Database Schema
Uses PostgreSQL with the following main tables:
- users
- warehouses  
- commodities
- warehouse_receipts
- loans
- processes
