import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import { insertUserSchema, insertWarehouseSchema, insertCommoditySchema, insertWarehouseReceiptSchema, insertLoanSchema, insertProcessSchema } from '@shared/schema';
import { z } from 'zod';

// Setup neon database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  console.log('Starting database seeding...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Seed initial data
    await seedDatabase(db);
    
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await pool.end();
  }
}

async function seedDatabase(db: any) {
  console.log('Seeding database with initial data...');
  
  try {
    // Create a test user
    const userInsert = {
      username: "rajiv",
      password: "securepassword",
      fullName: "Rajiv Sharma",
      email: "rajiv@example.com",
      phone: "+91 9876543210",
      role: "farmer",
      kycVerified: true,
      kycDocuments: {},
      businessDetails: {}
    };
    
    // Validate the user data against the schema
    const validUser = insertUserSchema.parse(userInsert);
    
    // Insert the user into the database
    const [user] = await db.insert(schema.users)
      .values(validUser)
      .returning();
    
    console.log('Created test user:', user.username);
    
    // Create test warehouses
    const warehousesInsert = [
      {
        name: "Delhi Agri Storage Hub",
        address: "123 Warehouse St",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        latitude: "28.6139",
        longitude: "77.2090",
        capacity: "5000",
        availableSpace: "1500",
        channelType: "green",
        ownerId: user.id,
        specializations: { crops: ["wheat", "rice", "pulses"] },
        facilities: { cleaning: true, sorting: true, packaging: true }
      },
      {
        name: "Punjab Grain Storage",
        address: "456 Storage Ave",
        city: "Delhi",
        state: "Delhi",
        pincode: "110002",
        latitude: "28.6519",
        longitude: "77.2315",
        capacity: "3500",
        availableSpace: "800",
        channelType: "orange",
        ownerId: user.id,
        specializations: { crops: ["wheat", "rice"] },
        facilities: { cleaning: true, sorting: true, packaging: false }
      }
    ];
    
    for (const warehouseData of warehousesInsert) {
      const validWarehouse = insertWarehouseSchema.parse(warehouseData);
      const [warehouse] = await db.insert(schema.warehouses)
        .values(validWarehouse)
        .returning();
      
      console.log('Created warehouse:', warehouse.name);
    }
    
    // Get the warehouses
    const warehouses = await db.select().from(schema.warehouses);
    
    // Create test commodities
    const commoditiesInsert = [
      {
        name: "Wheat",
        type: "Grain",
        quantity: "750",
        measurementUnit: "MT",
        qualityParameters: { moisture: "11.2%", foreignMatter: "0.5%" },
        gradeAssigned: "A",
        warehouseId: warehouses[0].id,
        ownerId: user.id,
        status: "active",
        channelType: "green",
        valuation: "1575000"
      },
      {
        name: "Rice",
        type: "Grain",
        quantity: "320",
        measurementUnit: "MT",
        qualityParameters: { moisture: "8.5%", foreignMatter: "0.3%" },
        gradeAssigned: "A",
        warehouseId: warehouses[1].id,
        ownerId: user.id,
        status: "active",
        channelType: "orange",
        valuation: "2400000"
      }
    ];
    
    for (const commodityData of commoditiesInsert) {
      const validCommodity = insertCommoditySchema.parse(commodityData);
      const [commodity] = await db.insert(schema.commodities)
        .values(validCommodity)
        .returning();
      
      console.log('Created commodity:', commodity.name);
    }
    
    // Get the commodities
    const commodities = await db.select().from(schema.commodities);
    
    // Create test warehouse receipts
    const receiptsInsert = [
      {
        receiptNumber: "WR950951-20",
        commodityId: commodities[0].id,
        ownerId: user.id,
        warehouseId: warehouses[0].id,
        quantity: "750",
        status: "active",
        blockchainHash: "0x123abc",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        valuation: "1575000",
        liens: {}
      },
      {
        receiptNumber: "WR950952-20",
        commodityId: commodities[1].id,
        ownerId: user.id,
        warehouseId: warehouses[1].id,
        quantity: "320",
        status: "active",
        blockchainHash: "0x456def",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        valuation: "2400000",
        liens: {}
      }
    ];
    
    for (const receiptData of receiptsInsert) {
      const validReceipt = insertWarehouseReceiptSchema.parse(receiptData);
      const [receipt] = await db.insert(schema.warehouseReceipts)
        .values(validReceipt)
        .returning();
      
      console.log('Created warehouse receipt:', receipt.receiptNumber);
    }
    
    // Get the receipts
    const receipts = await db.select().from(schema.warehouseReceipts);
    
    // Create test loan
    const loanInsert = {
      userId: user.id,
      amount: "188750",
      interestRate: "9.5",
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      status: "active",
      collateralReceiptIds: [receipts[0].id],
      outstandingAmount: "188750",
      repaymentSchedule: {}
    };
    
    const validLoan = insertLoanSchema.parse(loanInsert);
    const [loan] = await db.insert(schema.loans)
      .values(validLoan)
      .returning();
    
    console.log('Created loan with amount:', loan.amount);
    
    // Create test process
    const processInsert = {
      commodityId: commodities[0].id,
      warehouseId: warehouses[0].id,
      userId: user.id,
      processType: "deposit",
      status: "in_progress",
      currentStage: "pre_cleaning",
      stageProgress: {
        deposit_reception: "completed",
        pre_cleaning: "in_progress",
        quality_assessment: "pending",
        ewr_generation: "pending"
      },
      estimatedCompletionTime: new Date(new Date().setHours(new Date().getHours() + 2))
    };
    
    const validProcess = insertProcessSchema.parse(processInsert);
    const [process] = await db.insert(schema.processes)
      .values(validProcess)
      .returning();
    
    console.log('Created process:', process.processType);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the migration
main().catch(console.error);