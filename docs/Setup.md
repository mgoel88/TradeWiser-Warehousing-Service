
# TradeWiser Setup Guide

## Prerequisites
- Node.js 16+
- PostgreSQL 13+

## Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:migrate`
5. Start development server: `npm run dev`

## Configuration
Required environment variables:
- DATABASE_URL
- SESSION_SECRET
- PAYMENT_GATEWAY_KEY
- BLOCKCHAIN_NODE_URL

## Development
- Frontend: `npm run dev`
- Backend: `npm run server`
- Database migrations: `npm run db:migrate`
