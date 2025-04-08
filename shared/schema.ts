import { pgTable, text, serial, numeric, timestamp, integer, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// JavaScript/TypeScript enum types for use throughout the application
export enum LendingPartnerType {
  BANK = 'bank',
  NBFC = 'nbfc',
  MICROFINANCE = 'microfinance',
  P2P_LENDING = 'p2p_lending',
  COOPERATIVE = 'cooperative'
}

export enum CollateralStatus {
  AVAILABLE = 'available',
  PLEDGED = 'pledged',
  PARTIAL_PLEDGED = 'partial_pledged',
  RELEASED = 'released',
  LIQUIDATED = 'liquidated'
}

export enum LoanStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  REPAID = 'repaid',
  DEFAULTED = 'defaulted',
  LIQUIDATED = 'liquidated'
}

export enum CreditRating {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
  C = 'C',
  D = 'D'
}

// PostgreSQL Enums
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
export const loanStatusEnum = pgEnum('loan_status', ['pending_approval', 'approved', 'active', 'repaid', 'defaulted', 'liquidated']);
export const processStatusEnum = pgEnum('process_status', ['pending', 'in_progress', 'completed', 'failed']);
export const transferTypeEnum = pgEnum('transfer_type', ['ownership', 'collateral', 'pledge', 'release']);
export const sackStatusEnum = pgEnum('sack_status', ['active', 'processing', 'withdrawn', 'transferred', 'damaged']);

// Lending partner type enum
export const lendingPartnerTypeEnum = pgEnum('lending_partner_type', [
  'bank', 'nbfc', 'microfinance', 'p2p_lending', 'cooperative'
]);

// Collateral status enum
export const collateralStatusEnum = pgEnum('collateral_status', [
  'available', 'pledged', 'partial_pledged', 'released', 'liquidated'
]);

// Credit rating enum
export const creditRatingEnum = pgEnum('credit_rating', [
  'AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'
]);

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
  attachmentUrl: text('attachment_url'),                 // URL to uploaded receipt file attachment
  smartContractId: text('smart_contract_id'),            // Smart contract identifier
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
  lendingPartnerId: integer('lending_partner_id'), // Reference to the lending partner
  lendingPartnerName: text('lending_partner_name'), // For display purposes
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date').notNull(),
  status: loanStatusEnum('status').notNull().default('pending_approval'),
  collateralReceiptIds: json('collateral_receipt_ids').notNull(),
  outstandingAmount: numeric('outstanding_amount', { precision: 14, scale: 2 }),
  repaymentSchedule: json('repayment_schedule'),
  lastPaymentDate: timestamp('last_payment_date'),
  externalLoanId: text('external_loan_id'), // ID provided by external lending partner
  blockchain: json('blockchain'), // Blockchain-related information (transaction hashes, smart contract details)
  purpose: text('purpose'), // Purpose of the loan
  creditScore: integer('credit_score'), // User's credit score at the time of loan approval
  maxDrawdownAmount: numeric('max_drawdown_amount', { precision: 14, scale: 2 }), // For overdraft facility
  availableCredit: numeric('available_credit', { precision: 14, scale: 2 }), // For overdraft facility
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


// Lending partners table
export const lendingPartners = pgTable('lending_partners', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: lendingPartnerTypeEnum('type').notNull(),
  interestRateMin: numeric('interest_rate_min', { precision: 5, scale: 2 }).notNull(),
  interestRateMax: numeric('interest_rate_max', { precision: 5, scale: 2 }).notNull(),
  maxLoanAmount: numeric('max_loan_amount', { precision: 14, scale: 2 }).notNull(),
  minLoanAmount: numeric('min_loan_amount', { precision: 14, scale: 2 }).notNull(),
  maxTenureDays: integer('max_tenure_days').notNull(),
  creditRatingCriteria: json('credit_rating_criteria'),
  apiEndpoint: text('api_endpoint'),
  apiKey: text('api_key'),
  apiSecretKey: text('api_secret_key'),
  logoUrl: text('logo_url'),
  description: text('description'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Loan applications table
export const loanApplications = pgTable('loan_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  lendingPartnerId: integer('lending_partner_id').references(() => lendingPartners.id).notNull(),
  requestedAmount: numeric('requested_amount', { precision: 14, scale: 2 }).notNull(),
  requestedTenureDays: integer('requested_tenure_days').notNull(),
  purpose: text('purpose'),
  creditScore: integer('credit_score'),
  applicationDate: timestamp('application_date').defaultNow(),
  status: loanStatusEnum('status').notNull().default('pending_approval'),
  externalApplicationId: text('external_application_id'),
  applicationData: json('application_data'),
  underwritingResult: json('underwriting_result'),
  rejectionReason: text('rejection_reason'),
});

// Collateral pledges table
export const collateralPledges = pgTable('collateral_pledges', {
  id: serial('id').primaryKey(),
  receiptId: integer('receipt_id').references(() => warehouseReceipts.id).notNull(),
  loanId: integer('loan_id').references(() => loans.id),
  applicationId: integer('application_id').references(() => loanApplications.id),
  pledgeDate: timestamp('pledge_date').defaultNow(),
  releaseDate: timestamp('release_date'),
  status: collateralStatusEnum('status').notNull().default('available'),
  transactionHash: text('transaction_hash'),
  valuationAmount: numeric('valuation_amount', { precision: 14, scale: 2 }).notNull(),
  loanAmount: numeric('loan_amount', { precision: 14, scale: 2 }),
  smartContractId: text('smart_contract_id'),
  blockchainData: json('blockchain_data'),
});

// Loan repayments table
export const loanRepayments = pgTable('loan_repayments', {
  id: serial('id').primaryKey(),
  loanId: integer('loan_id').references(() => loans.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  transactionDate: timestamp('transaction_date').defaultNow(),
  paymentMethod: text('payment_method').notNull(),
  externalTransactionId: text('external_transaction_id'),
  status: text('status').notNull(),
  interestAmount: numeric('interest_amount', { precision: 14, scale: 2 }),
  principalAmount: numeric('principal_amount', { precision: 14, scale: 2 }),
  transactionHash: text('transaction_hash'),
  blockchainData: json('blockchain_data'),
  receiptUrl: text('receipt_url'),
  receiptNumber: text('receipt_number'),
});

// User credit profiles
export const userCreditProfiles = pgTable('user_credit_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  creditScore: integer('credit_score'),
  creditRating: creditRatingEnum('credit_rating'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  creditHistory: json('credit_history'),
  externalCreditReportId: text('external_credit_report_id'),
  riskAssessment: json('risk_assessment'),
  creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }),
  defaultRiskScore: numeric('default_risk_score', { precision: 5, scale: 2 }),
});

export const commoditySacks = pgTable('commodity_sacks', {
  id: serial('id').primaryKey(),
  // Unique identifiers
  sackId: text('sack_id').notNull().unique(), // Unique identifier for the sack (e.g., SC-SAK-12345678)
  receiptId: integer('receipt_id').references(() => warehouseReceipts.id), // Parent receipt ID
  qrCodeUrl: text('qr_code_url'), // URL to generated QR code for physical tracking
  barcodeData: text('barcode_data'), // Data embedded in the barcode/QR code
  
  // Basic details
  commodityId: integer('commodity_id').references(() => commodities.id),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull().default('50'), // Default 50kg
  measurementUnit: text('measurement_unit').notNull().default('kg'),
  
  // Ownership and location information
  ownerId: integer('owner_id').references(() => users.id),
  warehouseId: integer('warehouse_id').references(() => warehouses.id),
  locationInWarehouse: text('location_in_warehouse'), // Specific location code within warehouse
  
  // Status tracking
  status: sackStatusEnum('status').notNull().default('processing'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  
  // Quality & inspection details
  qualityParameters: json('quality_parameters'),
  gradeAssigned: text('grade_assigned'),
  lastInspectionDate: timestamp('last_inspection_date'),
  
  // Blockchain tracking
  blockchainHash: text('blockchain_hash'), // Hash of the most recent blockchain transaction
  smartContractId: text('smart_contract_id'), // Individual smart contract ID for this sack
  
  // Privacy and additional data
  isOwnerHidden: boolean('is_owner_hidden').default(false), // Flag to hide owner details
  metadata: json('metadata'), // Additional flexible metadata
});

// Sack Movements to track individual sack history
export const sackMovements = pgTable('sack_movements', {
  id: serial('id').primaryKey(),
  sackId: integer('sack_id').references(() => commoditySacks.id),
  fromLocationId: integer('from_location_id').references(() => warehouses.id),
  toLocationId: integer('to_location_id').references(() => warehouses.id),
  fromOwnerId: integer('from_owner_id').references(() => users.id),
  toOwnerId: integer('to_owner_id').references(() => users.id),
  movementType: text('movement_type').notNull(), // 'transfer', 'withdrawal', 'loan_collateral', etc.
  movementDate: timestamp('movement_date').defaultNow(),
  transactionHash: text('transaction_hash'), // Blockchain transaction hash
  metadata: json('metadata'),
});

// Sack Quality Assessments to track quality checks over time
export const sackQualityAssessments = pgTable('sack_quality_assessments', {
  id: serial('id').primaryKey(),
  sackId: integer('sack_id').references(() => commoditySacks.id),
  inspectionDate: timestamp('inspection_date').defaultNow(),
  inspectorId: integer('inspector_id').references(() => users.id),
  qualityParameters: json('quality_parameters').notNull(),
  gradeAssigned: text('grade_assigned'),
  notes: text('notes'),
  attachmentUrls: json('attachment_urls'), // URLs to any pictures or documents
  blockchainHash: text('blockchain_hash'), // Verification hash
});

// Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({ id: true, depositDate: true, lastUpdated: true });
export const insertWarehouseReceiptSchema = createInsertSchema(warehouseReceipts).omit({ id: true, issuedDate: true });
export const insertReceiptTransferSchema = createInsertSchema(receiptTransfers).omit({ id: true, transferDate: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, startDate: true });
export const insertProcessSchema = createInsertSchema(processes)
  .omit({ id: true, startTime: true, completedTime: true });

// Schemas for the new sack-level tracking tables
export const insertCommoditySackSchema = createInsertSchema(commoditySacks)
  .omit({ id: true, createdAt: true, lastUpdated: true });
export const insertSackMovementSchema = createInsertSchema(sackMovements)
  .omit({ id: true, movementDate: true });
export const insertSackQualityAssessmentSchema = createInsertSchema(sackQualityAssessments)
  .omit({ id: true, inspectionDate: true });

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

// Types for lending partners and applications
export type LendingPartner = typeof lendingPartners.$inferSelect;
export const insertLendingPartnerSchema = createInsertSchema(lendingPartners)
  .omit({ id: true, createdAt: true });
export type InsertLendingPartner = z.infer<typeof insertLendingPartnerSchema>;

export type LoanApplication = typeof loanApplications.$inferSelect;
export const insertLoanApplicationSchema = createInsertSchema(loanApplications)
  .omit({ id: true, applicationDate: true });
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;

export type CollateralPledge = typeof collateralPledges.$inferSelect;
export const insertCollateralPledgeSchema = createInsertSchema(collateralPledges)
  .omit({ id: true, pledgeDate: true });
export type InsertCollateralPledge = z.infer<typeof insertCollateralPledgeSchema>;

export type LoanRepayment = typeof loanRepayments.$inferSelect;
export const insertLoanRepaymentSchema = createInsertSchema(loanRepayments)
  .omit({ id: true, transactionDate: true });
export type InsertLoanRepayment = z.infer<typeof insertLoanRepaymentSchema>;

export type UserCreditProfile = typeof userCreditProfiles.$inferSelect;
export const insertUserCreditProfileSchema = createInsertSchema(userCreditProfiles)
  .omit({ id: true, lastUpdated: true });
export type InsertUserCreditProfile = z.infer<typeof insertUserCreditProfileSchema>;

// Types for sack-level tracking
export type InsertCommoditySack = z.infer<typeof insertCommoditySackSchema>;
export type CommoditySack = typeof commoditySacks.$inferSelect;

export type InsertSackMovement = z.infer<typeof insertSackMovementSchema>;
export type SackMovement = typeof sackMovements.$inferSelect;

export type InsertSackQualityAssessment = z.infer<typeof insertSackQualityAssessmentSchema>;
export type SackQualityAssessment = typeof sackQualityAssessments.$inferSelect;

// Bank payment type for receipt generation
export interface BankPayment {
  transactionId: string;
  status: string;
  amount: string;
  paymentMethod: string;
  timestamp: Date | string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  referenceNumber?: string;
  createdAt?: Date;
}
