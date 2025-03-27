import { pgTable, text, serial, numeric, timestamp, integer, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['farmer', 'trader', 'warehouse_owner', 'logistics_provider']);
export const commodityCategoryEnum = pgEnum('commodity_category', ['cereals', 'pulses', 'oilseeds', 'spices', 'others']);

// Commodity categories and parameters table
export const commodityCategories = pgTable('commodity_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: commodityCategoryEnum('category').notNull(),
  qualityParameters: json('quality_parameters').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Commodity parameter defaults
export const defaultQualityParameters = {
  cereals: {
    moisture: { min: 10, max: 14, unit: '%' },
    foreignMatter: { min: 0, max: 2, unit: '%' },
    brokenGrains: { min: 0, max: 4, unit: '%' },
    weeviled: { min: 0, max: 1, unit: '%' }
  },
  pulses: {
    moisture: { min: 8, max: 12, unit: '%' },
    foreignMatter: { min: 0, max: 1, unit: '%' },
    damaged: { min: 0, max: 3, unit: '%' },
    weeviled: { min: 0, max: 1, unit: '%' }
  },
  oilseeds: {
    moisture: { min: 6, max: 12, unit: '%' },
    foreignMatter: { min: 0, max: 2, unit: '%' },
    oilContent: { min: 35, max: 45, unit: '%' },
    freefattyAcid: { min: 0, max: 2, unit: '%' }
  },
  spices: {
    moisture: { min: 8, max: 12, unit: '%' },
    foreignMatter: { min: 0, max: 1, unit: '%' },
    volatileOil: { min: 1, max: 4, unit: '%' }
  }
};
export const commodityStatusEnum = pgEnum('commodity_status', ['active', 'processing', 'withdrawn', 'transferred']);
export const channelTypeEnum = pgEnum('channel_type', ['green', 'orange', 'red']);
export const receiptStatusEnum = pgEnum('receipt_status', ['active', 'processing', 'withdrawn', 'transferred', 'collateralized']);
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'active', 'repaid', 'defaulted']);
export const processStatusEnum = pgEnum('process_status', ['pending', 'in_progress', 'completed', 'failed']);
export const transferTypeEnum = pgEnum('transfer_type', ['ownership', 'collateral', 'pledge', 'release']);

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

// Warehouse Receipt table - Simplified to match actual database structure
export const receiptTypeEnum = pgEnum('receipt_type', ['negotiable', 'non_negotiable']);
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
  // Orange Channel: External Receipt fields
  externalId: text('external_id'),                       // ID in external system
  externalSource: text('external_source'),               // Source provider (e.g., 'agriapp')
  commodityName: text('commodity_name'),                 // Name of commodity from external source
  qualityGrade: text('quality_grade'),                   // Quality grade from external source
  warehouseName: text('warehouse_name'),                 // External warehouse name
  warehouseAddress: text('warehouse_address'),           // External warehouse address
  measurementUnit: text('measurement_unit'),             // Unit of measurement
  metadata: json('metadata'),                            // Additional metadata from external source
});

// Receipt transfers tracking
export const receiptTransfers = pgTable('receipt_transfers', {
  id: serial('id').primaryKey(),
  receiptId: integer('receipt_id').references(() => warehouseReceipts.id),
  fromUserId: integer('from_user_id').references(() => users.id),
  toUserId: integer('to_user_id').references(() => users.id),
  transferType: transferTypeEnum('transfer_type').notNull(),
  transferDate: timestamp('transfer_date').defaultNow(),
  transactionHash: text('transaction_hash'),
  metadata: json('metadata'),
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
export const insertReceiptTransferSchema = createInsertSchema(receiptTransfers).omit({ id: true, transferDate: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, startDate: true });
// Create process schema with proper date handling (without transformation)
export const insertProcessSchema = createInsertSchema(processes)
  .omit({ id: true, startTime: true, completedTime: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type Commodity = typeof commodities.$inferSelect;

export type InsertWarehouseReceipt = z.infer<typeof insertWarehouseReceiptSchema>;
export type WarehouseReceipt = typeof warehouseReceipts.$inferSelect;

export type InsertReceiptTransfer = z.infer<typeof insertReceiptTransferSchema>;
export type ReceiptTransfer = typeof receiptTransfers.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;
