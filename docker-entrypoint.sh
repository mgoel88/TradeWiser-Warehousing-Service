#!/bin/bash
# TradeWiser Platform - Docker Entry Point Script

set -e

echo "🚀 Starting TradeWiser Platform..."
echo "==================================="

# Function to wait for database with better error handling
wait_for_database() {
  echo "⏳ Waiting for database to be ready..."
  local max_attempts=30
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Checking database connection... (attempt $attempt/$max_attempts)"
    
    # Test database connection with multiple methods
    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" > /dev/null 2>&1; then
      echo "✅ Database is ready!"
      return 0
    fi
    
    # Also try direct connection test
    if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
      echo "✅ Database connection verified!"
      return 0
    fi
    
    echo "Database not ready, waiting... (attempt $attempt/$max_attempts)"
    sleep 3
    attempt=$((attempt + 1))
  done
  
  echo "❌ Database failed to become ready after $max_attempts attempts"
  echo "Environment variables:"
  echo "PGHOST: $PGHOST"
  echo "PGPORT: $PGPORT"
  echo "PGUSER: $PGUSER"
  echo "PGDATABASE: $PGDATABASE"
  exit 1
}

# Wait for database
wait_for_database

# Run database migrations/schema push
echo "📊 Setting up database schema..."
npx drizzle-kit push || echo "⚠️  Database schema setup failed, continuing..."

# Start the application
echo "🌐 Starting application server..."
if [ "$NODE_ENV" = "production" ]; then
    exec node dist/index.js
else
    exec npx tsx server/index.ts
fi