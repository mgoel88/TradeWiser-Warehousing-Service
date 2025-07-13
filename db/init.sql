-- TradeWiser Platform - Database Initialization Script
-- This script is automatically executed when the PostgreSQL container starts

-- Create database if it doesn't exist (handled by POSTGRES_DB environment variable)
-- Create user if it doesn't exist (handled by POSTGRES_USER environment variable)

-- Set timezone
SET timezone = 'UTC';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO tradewiser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradewiser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradewiser;

-- Note: Actual table creation will be handled by Drizzle ORM migrations
-- This script only handles basic database setup and permissions