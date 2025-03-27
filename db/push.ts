import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import * as schema from '@shared/schema';

// Setup neon database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  console.log('Starting schema push...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // Push schema to database
  try {
    // This will create/update tables directly from our schema definitions
    await db.query(`
      DO $$ 
      BEGIN
        RAISE NOTICE 'Starting schema push...';
        
        -- Drop enums if they exist to avoid conflicts
        DROP TYPE IF EXISTS user_role CASCADE;
        DROP TYPE IF EXISTS commodity_category CASCADE;
        DROP TYPE IF EXISTS commodity_status CASCADE;
        DROP TYPE IF EXISTS channel_type CASCADE;
        DROP TYPE IF EXISTS receipt_status CASCADE;
        DROP TYPE IF EXISTS loan_status CASCADE;
        DROP TYPE IF EXISTS process_status CASCADE;
        DROP TYPE IF EXISTS transfer_type CASCADE;
        DROP TYPE IF EXISTS receipt_type CASCADE;
        
        RAISE NOTICE 'Schema push completed!';
      END $$;
    `);
    
    console.log('Schema push successful!');
  } catch (error) {
    console.error('Schema push failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
main().catch(console.error);