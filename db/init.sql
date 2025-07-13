-- Database initialization script for TradeWiser Platform
-- This script creates the necessary database structure

-- Create the database user if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'tradewiser') THEN
        CREATE USER tradewiser WITH PASSWORD 'tradewiser_secure_password_2024';
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE tradewiser_db TO tradewiser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradewiser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradewiser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tradewiser;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for the application
CREATE TYPE user_role AS ENUM ('farmer', 'trader', 'warehouse_manager', 'lender', 'admin');
CREATE TYPE commodity_status AS ENUM ('active', 'reserved', 'withdrawn', 'expired');
CREATE TYPE channel_type AS ENUM ('green', 'orange', 'red');
CREATE TYPE process_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'active', 'repaid', 'defaulted');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Grant usage on schema and types to tradewiser user
GRANT USAGE ON SCHEMA public TO tradewiser;
GRANT CREATE ON SCHEMA public TO tradewiser;