#!/bin/bash
# TradeWiser Platform - Docker Entry Point Script

set -e

echo "🚀 Starting TradeWiser Platform..."
echo "==================================="

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations/schema push
echo "📊 Setting up database schema..."
npm run db:push || echo "⚠️  Database schema setup failed, continuing..."

# Start the application
echo "🌐 Starting application server..."
exec node dist/index.js