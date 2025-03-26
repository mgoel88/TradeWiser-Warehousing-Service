import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-pool';
import * as schema from '../shared/schema';

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });