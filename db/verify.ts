import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Setup neon database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  console.log('Starting database verification...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Check that tables exist
    console.log('Checking tables...');
    
    // Users
    const users = await db.select().from(schema.users);
    console.log(`Found ${users.length} users in the database.`);
    if (users.length > 0) {
      console.log(`Example user: ${users[0].username}`);
    }
    
    // Warehouses
    const warehouses = await db.select().from(schema.warehouses);
    console.log(`Found ${warehouses.length} warehouses in the database.`);
    if (warehouses.length > 0) {
      console.log(`Example warehouse: ${warehouses[0].name}`);
    }
    
    // Commodities
    const commodities = await db.select().from(schema.commodities);
    console.log(`Found ${commodities.length} commodities in the database.`);
    if (commodities.length > 0) {
      console.log(`Example commodity: ${commodities[0].name}`);
    }
    
    // Warehouse Receipts
    const receipts = await db.select().from(schema.warehouseReceipts);
    console.log(`Found ${receipts.length} warehouse receipts in the database.`);
    if (receipts.length > 0) {
      console.log(`Example receipt: ${receipts[0].receiptNumber}`);
    }
    
    // Loans
    const loans = await db.select().from(schema.loans);
    console.log(`Found ${loans.length} loans in the database.`);
    
    // Processes
    const processes = await db.select().from(schema.processes);
    console.log(`Found ${processes.length} processes in the database.`);
    
    console.log('Database verification complete! PostgreSQL integration is working correctly.');
  } catch (error) {
    console.error('Database verification failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the verification
main().catch(console.error);