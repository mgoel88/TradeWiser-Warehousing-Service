import { pgTable, text, serial, numeric, timestamp, integer, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['farmer', 'trader', 'warehouse_owner', 'logistics_provider']);
export const commodityStatusEnum = pgEnum('commodity_status', ['active', 'processing', 'withdrawn', 'transferred']);
export const channelTypeEnum = pgEnum('channel_type', ['green', 'orange', 'red']);
export const receiptStatusEnum = pgEnum('receipt_status', ['active', 'processing', 'withdrawn', 'transferred', 'collateralized']);
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'active', 'repaid', 'defaulted']);
export const processStatusEnum = pgEnum('process_status', ['pending', 'in_progress', 'completed', 'failed']);

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull().default('farmer'),
  kycVerified: boolean('kyc_verified').default(false),
  kycDocuments: json('kyc_documents'),
  businessDetails: json('business_details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Warehouse table
export const warehouses = pgTable('warehouses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 6 }).notNull(),
  capacity: numeric('capacity', { precision: 12, scale: 2 }).notNull(),
  availableSpace: numeric('available_space', { precision: 12, scale: 2 }).notNull(),
  channelType: channelTypeEnum('channel_type').notNull(),
  ownerId: integer('owner_id').references(() => users.id),
  specializations: json('specializations'),
  facilities: json('facilities'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Commodity table
export const commodities = pgTable('commodities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  measurementUnit: text('measurement_unit').notNull().default('MT'),
  qualityParameters: json('quality_parameters'),
  gradeAssigned: text('grade_assigned'),
  warehouseId: integer('warehouse_id').references(() => warehouses.id),
  ownerId: integer('owner_id').references(() => users.id),
  status: commodityStatusEnum('status').notNull().default('processing'),
  channelType: channelTypeEnum('channel_type').notNull(),
  valuation: numeric('valuation', { precision: 14, scale: 2 }),
  depositDate: timestamp('deposit_date').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Warehouse Receipt table
export const warehouseReceipts = pgTable('warehouse_receipts', {
  id: serial('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull().unique(),
  commodityId: integer('commodity_id').references(() => commodities.id),
  ownerId: integer('owner_id').references(() => users.id),
  warehouseId: integer('warehouse_id').references(() => warehouses.id),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  status: receiptStatusEnum('status').notNull().default('processing'),
  blockchainHash: text('blockchain_hash'),
  issuedDate: timestamp('issued_date').defaultNow(),
  expiryDate: timestamp('expiry_date'),
  valuation: numeric('valuation', { precision: 14, scale: 2 }),
  liens: json('liens'),
});

// Loan table
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date').notNull(),
  status: loanStatusEnum('status').notNull().default('pending'),
  collateralReceiptIds: json('collateral_receipt_ids').notNull(),
  outstandingAmount: numeric('outstanding_amount', { precision: 14, scale: 2 }),
  repaymentSchedule: json('repayment_schedule'),
});

// Process tracking table
export const processes = pgTable('processes', {
  id: serial('id').primaryKey(),
  commodityId: integer('commodity_id').references(() => commodities.id),
  warehouseId: integer('warehouse_id').references(() => warehouses.id),
  userId: integer('user_id').references(() => users.id),
  processType: text('process_type').notNull(),
  status: processStatusEnum('status').notNull().default('pending'),
  currentStage: text('current_stage'),
  stageProgress: json('stage_progress'),
  startTime: timestamp('start_time').defaultNow(),
  estimatedCompletionTime: timestamp('estimated_completion_time'),
  completedTime: timestamp('completed_time'),
});

// Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({ id: true, depositDate: true, lastUpdated: true });
export const insertWarehouseReceiptSchema = createInsertSchema(warehouseReceipts).omit({ id: true, issuedDate: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, startDate: true });
// Create process schema with proper date handling
export const insertProcessSchema = createInsertSchema(processes)
  .omit({ id: true, startTime: true, completedTime: true })
  .transform((data) => {
    // Convert string dates to Date objects if they're provided as strings
    if (data.estimatedCompletionTime && typeof data.estimatedCompletionTime === 'string') {
      return {
        ...data,
        estimatedCompletionTime: new Date(data.estimatedCompletionTime)
      };
    }
    return data;
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type Commodity = typeof commodities.$inferSelect;

export type InsertWarehouseReceipt = z.infer<typeof insertWarehouseReceiptSchema>;
export type WarehouseReceipt = typeof warehouseReceipts.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;
