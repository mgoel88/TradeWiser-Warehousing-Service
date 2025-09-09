import { 
  users, User, InsertUser, 
  warehouses, Warehouse, InsertWarehouse,
  commodities, Commodity, InsertCommodity,
  warehouseReceipts, WarehouseReceipt, InsertWarehouseReceipt,
  loans, Loan, InsertLoan,
  processes, Process, InsertProcess,
  // Lending-related imports
  lendingPartners, LendingPartner, InsertLendingPartner,
  loanApplications, LoanApplication, InsertLoanApplication,
  collateralPledges, CollateralPledge, InsertCollateralPledge,
  loanRepayments, LoanRepayment, InsertLoanRepayment,
  userCreditProfiles, UserCreditProfile, InsertUserCreditProfile,
  // Enums for lending and loan status
  LendingPartnerType, CollateralStatus, LoanStatus, CreditRating,
  // Sack-level tracking imports
  commoditySacks, CommoditySack, InsertCommoditySack,
  sackMovements, SackMovement, InsertSackMovement,
  sackQualityAssessments, SackQualityAssessment, InsertSackQualityAssessment
} from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { db } from "./db";

// Interface for storage operations
// Receipt transfer interface for blockchain-secured ownership transfers
export interface ReceiptTransfer {
  id: number;
  receiptId: number;
  fromUserId: number;
  toUserId: number;
  transferType: 'endorsement' | 'delivery' | 'pledge';
  transferDate: Date;
  transactionHash: string;
  metadata?: any;
}

export interface InsertReceiptTransfer {
  receiptId: number;
  fromUserId: number;
  toUserId: number;
  transferType: 'endorsement' | 'delivery' | 'pledge';
  transactionHash: string;
  metadata?: any;
}

export interface IStorage {
  // User operations - Enhanced for multiple auth methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUserSettings(userId: number): Promise<any>;
  updateUserSettings(userId: number, settings: any): Promise<any>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  
  // OTP operations
  storeOTP(phone: string, otp: string, purpose: string, expiryMinutes: number): Promise<void>;
  verifyOTP(phone: string, otp: string, purpose: string): Promise<boolean>;
  cleanupExpiredOTPs(): Promise<void>;
  
  // Warehouse operations
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  listWarehouses(): Promise<Warehouse[]>;
  listWarehousesByLocation(latitude: number, longitude: number, radius: number): Promise<Warehouse[]>;
  getWarehousesByState(state: string): Promise<Warehouse[]>;
  getWarehousesByDistrict(district: string): Promise<Warehouse[]>;
  getWarehousesByCommodity(commodity: string): Promise<Warehouse[]>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  seedMandiWarehouses(): Promise<number>; // Seed database with mandi data
  
  // Lending Partner operations
  getLendingPartner(id: number): Promise<LendingPartner | undefined>;
  createLendingPartner(partner: InsertLendingPartner): Promise<LendingPartner>;
  listLendingPartners(): Promise<LendingPartner[]>;
  updateLendingPartner(id: number, partnerData: Partial<InsertLendingPartner>): Promise<LendingPartner | undefined>;
  
  // Loan Application operations
  getLoanApplication(id: number): Promise<LoanApplication | undefined>;
  createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication>;
  listLoanApplications(): Promise<LoanApplication[]>;
  listLoanApplicationsByUser(userId: number): Promise<LoanApplication[]>;
  updateLoanApplication(id: number, applicationData: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined>;
  
  // Collateral Pledge operations
  getCollateralPledge(id: number): Promise<CollateralPledge | undefined>;
  createCollateralPledge(pledge: InsertCollateralPledge): Promise<CollateralPledge>;
  listCollateralPledges(): Promise<CollateralPledge[]>;
  listCollateralPledgesByReceipt(receiptId: number): Promise<CollateralPledge[]>;
  listCollateralPledgesByLoan(loanId: number): Promise<CollateralPledge[]>;
  updateCollateralPledge(id: number, pledgeData: Partial<InsertCollateralPledge>): Promise<CollateralPledge | undefined>;
  
  // Loan Repayment operations
  getLoanRepayment(id: number): Promise<LoanRepayment | undefined>;
  createLoanRepayment(repayment: InsertLoanRepayment): Promise<LoanRepayment>;
  updateLoanRepaymentReceipt(id: number, receiptUrl: string, receiptNumber: string): Promise<LoanRepayment | undefined>;
  listLoanRepayments(): Promise<LoanRepayment[]>;
  listLoanRepaymentsByLoan(loanId: number): Promise<LoanRepayment[]>;
  
  // User Credit Profile operations
  getUserCreditProfile(userId: number): Promise<UserCreditProfile | undefined>;
  createUserCreditProfile(profile: InsertUserCreditProfile): Promise<UserCreditProfile>;
  updateUserCreditProfile(userId: number, profileData: Partial<InsertUserCreditProfile>): Promise<UserCreditProfile | undefined>;
  
  // Commodity operations
  getCommodity(id: number): Promise<Commodity | undefined>;
  createCommodity(commodity: InsertCommodity): Promise<Commodity>;
  listCommodities(): Promise<Commodity[]>;
  listCommoditiesByOwner(ownerId: number): Promise<Commodity[]>;
  updateCommodity(id: number, commodity: Partial<InsertCommodity>): Promise<Commodity | undefined>;
  
  // Warehouse Receipt operations
  getWarehouseReceipt(id: number): Promise<WarehouseReceipt | undefined>;
  getWarehouseReceiptByNumber(receiptNumber: string): Promise<WarehouseReceipt | undefined>;
  getWarehouseReceiptByExternalId(externalId: string, source: string): Promise<WarehouseReceipt | undefined>;
  createWarehouseReceipt(receipt: InsertWarehouseReceipt): Promise<WarehouseReceipt>;
  listWarehouseReceipts(): Promise<WarehouseReceipt[]>;
  listWarehouseReceiptsByOwner(ownerId: number): Promise<WarehouseReceipt[]>;
  listWarehouseReceiptsByCommodity(commodityId: number): Promise<WarehouseReceipt[]>;
  listWarehouseReceiptsByExternalSource(source: string): Promise<WarehouseReceipt[]>;
  listUserReceipts(userId: number): Promise<WarehouseReceipt[]>;
  getReceiptsByIds(receiptIds: number[]): Promise<WarehouseReceipt[]>;
  updateWarehouseReceipt(id: number, receipt: Partial<InsertWarehouseReceipt>): Promise<WarehouseReceipt | undefined>;
  
  // Loan operations
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  listLoans(): Promise<Loan[]>;
  listLoansByUser(userId: number): Promise<Loan[]>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  
  // Receipt transfer operations (blockchain)
  createReceiptTransfer(transfer: InsertReceiptTransfer): Promise<ReceiptTransfer>;
  listReceiptTransfersByReceipt(receiptId: number): Promise<ReceiptTransfer[]>;
  getReceiptTransferByHash(transactionHash: string): Promise<ReceiptTransfer | undefined>;
  
  // Process operations
  getProcess(id: number): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  listProcesses(): Promise<Process[]>;
  listProcessesByUser(userId: number): Promise<Process[]>;
  listProcessesByCommodity(commodityId: number): Promise<Process[]>;
  updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined>;
  
  // Commodity Sack operations
  getCommoditySack(id: number): Promise<CommoditySack | undefined>;
  getCommoditySackBySackId(sackId: string): Promise<CommoditySack | undefined>;
  createCommoditySack(sack: InsertCommoditySack): Promise<CommoditySack>;
  createManyCommoditySacks(sacks: InsertCommoditySack[]): Promise<CommoditySack[]>;
  listCommoditySacks(): Promise<CommoditySack[]>;
  listCommoditySacksByReceipt(receiptId: number): Promise<CommoditySack[]>;
  listCommoditySacksByOwner(ownerId: number, includeHidden?: boolean): Promise<CommoditySack[]>;
  listCommoditySacksByWarehouse(warehouseId: number): Promise<CommoditySack[]>;
  updateCommoditySack(id: number, sack: Partial<InsertCommoditySack>): Promise<CommoditySack | undefined>;
  
  // Sack Movement operations
  createSackMovement(movement: InsertSackMovement): Promise<SackMovement>;
  getSackMovementHistory(sackId: number): Promise<SackMovement[]>;
  listRecentSackMovements(limit?: number): Promise<SackMovement[]>;
  
  // Sack Quality Assessment operations
  createSackQualityAssessment(assessment: InsertSackQualityAssessment): Promise<SackQualityAssessment>;
  getSackQualityAssessmentHistory(sackId: number): Promise<SackQualityAssessment[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private warehouses: Map<number, Warehouse>;
  private commodities: Map<number, Commodity>;
  private warehouseReceipts: Map<number, WarehouseReceipt>;
  private loans: Map<number, Loan>;
  private processes: Map<number, Process>;
  
  // Maps for lending-related entities
  private lendingPartners: Map<number, LendingPartner>;
  private loanApplications: Map<number, LoanApplication>;
  private collateralPledges: Map<number, CollateralPledge>;
  private loanRepayments: Map<number, LoanRepayment>;
  private userCreditProfiles: Map<number, UserCreditProfile>;
  
  // Sack-level tracking maps
  private commoditySacks: Map<number, CommoditySack>;
  private sackMovements: Map<number, SackMovement>;
  private sackQualityAssessments: Map<number, SackQualityAssessment>;
  
  // ID counters
  private currentUserId: number;
  private currentWarehouseId: number;
  private currentCommodityId: number;
  private currentReceiptId: number;
  private currentLoanId: number;
  private currentProcessId: number;
  
  // ID counters for lending-related entities
  private currentLendingPartnerId: number;
  private currentLoanApplicationId: number;
  private currentCollateralPledgeId: number;
  private currentLoanRepaymentId: number;
  private currentUserCreditProfileId: number;
  
  // ID counters for sack-level tracking entities
  private currentSackId: number;
  private currentSackMovementId: number;
  private currentSackQualityAssessmentId: number;
  
  constructor() {
    this.users = new Map();
    this.warehouses = new Map();
    this.commodities = new Map();
    this.warehouseReceipts = new Map();
    this.loans = new Map();
    this.processes = new Map();
    
    // Initialize maps for lending-related entities
    this.lendingPartners = new Map();
    this.loanApplications = new Map();
    this.collateralPledges = new Map();
    this.loanRepayments = new Map();
    this.userCreditProfiles = new Map();
    
    // Initialize maps for sack-level tracking
    this.commoditySacks = new Map();
    this.sackMovements = new Map();
    this.sackQualityAssessments = new Map();
    
    // Set starting ID counters
    this.currentUserId = 1;
    this.currentWarehouseId = 1;
    this.currentCommodityId = 1;
    
    // Create test user for development
    this.createUser({
      username: 'testuser',
      password: 'password123',
      email: 'testuser@example.com',
      fullName: 'Test User',
      phone: '+919876543210',
      role: 'user',
      address: 'Test Address, New Delhi',
      kycVerified: true
    }).then(user => {
      console.log('Test user created at startup: testuser/password123');
      
      // Create sample warehouses
      Promise.all([
        this.createWarehouse({
          name: "Delhi Central Warehouse",
          address: "Industrial Area, New Delhi",
          latitude: "28.6139",
          longitude: "77.2090",
          capacity: "5000",
          availableSpace: "3500",
          storageRate: "2.50",
          phoneNumber: "+911234567890",
          email: "delhi@warehouses.com",
          manager: "Rajiv Sharma",
          certifications: ["ISO 9001", "FSSAI"],
          storageConditions: ["Climate Controlled", "Secure"],
          whType: "public"
        }),
        this.createWarehouse({
          name: "Mumbai Port Storage",
          address: "Port Area, Mumbai",
          latitude: "19.0760",
          longitude: "72.8777",
          capacity: "8000",
          availableSpace: "4000",
          storageRate: "3.25",
          phoneNumber: "+912234567890",
          email: "mumbai@warehouses.com",
          manager: "Priya Patel",
          certifications: ["ISO 9001", "FSSAI", "SAFE"],
          storageConditions: ["Fumigated", "24/7 Security"],
          whType: "public"
        }),
        this.createWarehouse({
          name: "Kolkata Bulk Storage",
          address: "Riverside Area, Kolkata",
          latitude: "22.5726",
          longitude: "88.3639",
          capacity: "6000",
          availableSpace: "2000",
          storageRate: "2.00",
          phoneNumber: "+913334567890",
          email: "kolkata@warehouses.com",
          manager: "Amit Sen",
          certifications: ["ISO 9001"],
          storageConditions: ["Pest Control", "Fire Safety"],
          whType: "private"
        })
      ]).then(() => {
        console.log('Created 3 sample warehouses');
      });

      // Create sample commodities for the test user
      this.createCommodity({
        name: "Premium Wheat",
        type: "Grain",
        grade: "A",
        quantity: "1500",
        measurementUnit: "kg",
        storageConditions: ["Dry", "Climate Controlled"],
        ownerId: user.id,
        warehouseId: 1,
        quality: "Premium",
        harvestDate: new Date('2023-11-15'),
        status: "active",
        channelType: "green"
      }).then(() => {
        console.log('Created sample commodities for test user');
      });
    }).catch(err => {
      console.error('Error creating test user:', err);
    });
    this.currentReceiptId = 1;
    this.currentLoanId = 1;
    this.currentProcessId = 1;
    
    // Set starting IDs for lending-related entities
    this.currentLendingPartnerId = 1;
    this.currentLoanApplicationId = 1;
    this.currentCollateralPledgeId = 1;
    this.currentLoanRepaymentId = 1;
    this.currentUserCreditProfileId = 1;
    
    // Set starting IDs for sack-level tracking entities
    this.currentSackId = 1;
    this.currentSackMovementId = 1;
    this.currentSackQualityAssessmentId = 1;
  }
  
  // Lending Partner operations
  async getLendingPartner(id: number): Promise<LendingPartner | undefined> {
    return this.lendingPartners.get(id);
  }
  
  async createLendingPartner(partner: InsertLendingPartner): Promise<LendingPartner> {
    const id = this.currentLendingPartnerId++;
    const now = new Date();
    const lendingPartner: LendingPartner = { 
      ...partner, 
      id, 
      createdAt: now,
      partnerType: partner.partnerType || LendingPartnerType.BANK,
      status: partner.status || 'active'
    };
    this.lendingPartners.set(id, lendingPartner);
    return lendingPartner;
  }
  
  async listLendingPartners(): Promise<LendingPartner[]> {
    return Array.from(this.lendingPartners.values());
  }
  
  async updateLendingPartner(id: number, partnerData: Partial<InsertLendingPartner>): Promise<LendingPartner | undefined> {
    const partner = await this.getLendingPartner(id);
    if (!partner) return undefined;
    
    const updatedPartner: LendingPartner = { ...partner, ...partnerData };
    this.lendingPartners.set(id, updatedPartner);
    return updatedPartner;
  }
  
  // Loan Application operations
  async getLoanApplication(id: number): Promise<LoanApplication | undefined> {
    return this.loanApplications.get(id);
  }
  
  async createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication> {
    const id = this.currentLoanApplicationId++;
    const now = new Date();
    const loanApplication: LoanApplication = { ...application, id, applicationDate: now };
    this.loanApplications.set(id, loanApplication);
    return loanApplication;
  }
  
  async listLoanApplications(): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values());
  }
  
  async listLoanApplicationsByUser(userId: number): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values()).filter(
      application => application.userId === userId
    );
  }
  
  async updateLoanApplication(id: number, applicationData: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined> {
    const application = await this.getLoanApplication(id);
    if (!application) return undefined;
    
    const updatedApplication: LoanApplication = { ...application, ...applicationData };
    this.loanApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Collateral Pledge operations
  async getCollateralPledge(id: number): Promise<CollateralPledge | undefined> {
    return this.collateralPledges.get(id);
  }
  
  async createCollateralPledge(pledge: InsertCollateralPledge): Promise<CollateralPledge> {
    const id = this.currentCollateralPledgeId++;
    const now = new Date();
    const collateralPledge: CollateralPledge = { 
      ...pledge, 
      id, 
      pledgeDate: now,
      status: pledge.status || CollateralStatus.PLEDGED
    };
    this.collateralPledges.set(id, collateralPledge);
    return collateralPledge;
  }
  
  async listCollateralPledges(): Promise<CollateralPledge[]> {
    return Array.from(this.collateralPledges.values());
  }
  
  async listCollateralPledgesByReceipt(receiptId: number): Promise<CollateralPledge[]> {
    return Array.from(this.collateralPledges.values()).filter(
      pledge => pledge.receiptId === receiptId
    );
  }
  
  async listCollateralPledgesByLoan(loanId: number): Promise<CollateralPledge[]> {
    return Array.from(this.collateralPledges.values()).filter(
      pledge => pledge.loanId === loanId
    );
  }
  
  async updateCollateralPledge(id: number, pledgeData: Partial<InsertCollateralPledge>): Promise<CollateralPledge | undefined> {
    const pledge = await this.getCollateralPledge(id);
    if (!pledge) return undefined;
    
    const updatedPledge: CollateralPledge = { ...pledge, ...pledgeData };
    this.collateralPledges.set(id, updatedPledge);
    return updatedPledge;
  }
  
  // Loan Repayment operations
  async getLoanRepayment(id: number): Promise<LoanRepayment | undefined> {
    return this.loanRepayments.get(id);
  }
  
  async createLoanRepayment(repayment: InsertLoanRepayment): Promise<LoanRepayment> {
    const id = this.currentLoanRepaymentId++;
    const now = new Date();
    const loanRepayment: LoanRepayment = { ...repayment, id, transactionDate: now };
    this.loanRepayments.set(id, loanRepayment);
    return loanRepayment;
  }
  
  async updateLoanRepaymentReceipt(id: number, receiptUrl: string, receiptNumber: string): Promise<LoanRepayment | undefined> {
    const repayment = this.loanRepayments.get(id);
    
    if (!repayment) {
      return undefined;
    }
    
    const updatedRepayment: LoanRepayment = {
      ...repayment,
      receiptUrl,
      receiptNumber
    };
    
    this.loanRepayments.set(id, updatedRepayment);
    return updatedRepayment;
  }
  
  async listLoanRepayments(): Promise<LoanRepayment[]> {
    return Array.from(this.loanRepayments.values());
  }
  
  async listLoanRepaymentsByLoan(loanId: number): Promise<LoanRepayment[]> {
    return Array.from(this.loanRepayments.values()).filter(
      repayment => repayment.loanId === loanId
    );
  }
  
  // User Credit Profile operations
  async getUserCreditProfile(userId: number): Promise<UserCreditProfile | undefined> {
    return Array.from(this.userCreditProfiles.values()).find(
      profile => profile.userId === userId
    );
  }
  
  async createUserCreditProfile(profile: InsertUserCreditProfile): Promise<UserCreditProfile> {
    const id = this.currentUserCreditProfileId++;
    const now = new Date();
    const userCreditProfile: UserCreditProfile = { 
      ...profile, 
      id, 
      lastUpdated: now,
      creditScore: profile.creditScore || null,
      creditRating: profile.creditRating || null,
      creditLimit: profile.creditLimit || null,
      defaultRiskScore: profile.defaultRiskScore || null,
      externalCreditReportId: profile.externalCreditReportId || null
    };
    this.userCreditProfiles.set(id, userCreditProfile);
    return userCreditProfile;
  }
  
  async updateUserCreditProfile(userId: number, profileData: Partial<InsertUserCreditProfile>): Promise<UserCreditProfile | undefined> {
    const profile = await this.getUserCreditProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile: UserCreditProfile = { ...profile, ...profileData };
    this.userCreditProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.facebookId === facebookId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // User Settings operations
  private userSettings = new Map<number, any>();
  
  async getUserSettings(userId: number): Promise<any> {
    const settings = this.userSettings.get(userId);
    if (settings) {
      return settings;
    }
    
    // Return default settings if none exist
    const defaultSettings = {
      notifications: {
        email: true,
        sms: true,
        push: true,
        depositUpdates: true,
        receiptGeneration: true,
        loanAlerts: true,
        priceAlerts: false
      },
      preferences: {
        language: 'en-in',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        dashboardLayout: 'default'
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        loginNotifications: true
      }
    };
    
    this.userSettings.set(userId, defaultSettings);
    return defaultSettings;
  }
  
  async updateUserSettings(userId: number, settings: any): Promise<any> {
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    this.userSettings.set(userId, updatedSettings);
    return updatedSettings;
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser: User = { ...user, password: newPassword };
      this.users.set(userId, updatedUser);
    }
  }

  // OTP operations - In-memory implementation
  private otpStore = new Map<string, { otp: string; purpose: string; expiresAt: Date; attempts: number }>();

  async storeOTP(phone: string, otp: string, purpose: string, expiryMinutes: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const key = `${phone}_${purpose}`;
    this.otpStore.set(key, { otp, purpose, expiresAt, attempts: 0 });
  }

  async verifyOTP(phone: string, otp: string, purpose: string): Promise<boolean> {
    const key = `${phone}_${purpose}`;
    const stored = this.otpStore.get(key);
    
    if (!stored) return false;
    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(key);
      return false;
    }
    if (stored.attempts >= 3) return false;
    if (stored.otp !== otp) {
      stored.attempts++;
      return false;
    }

    this.otpStore.delete(key); // Remove after successful verification
    return true;
  }

  async cleanupExpiredOTPs(): Promise<void> {
    const now = new Date();
    for (const [key, value] of this.otpStore.entries()) {
      if (value.expiresAt < now) {
        this.otpStore.delete(key);
      }
    }
  }
  
  // Warehouse operations
  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }
  
  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.currentWarehouseId++;
    const now = new Date();
    const warehouse: Warehouse = { ...insertWarehouse, id, createdAt: now };
    this.warehouses.set(id, warehouse);
    return warehouse;
  }
  
  async listWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }
  
  async listWarehousesByLocation(latitude: number, longitude: number, radius: number): Promise<Warehouse[]> {
    // Simple distance calculation (this would be more sophisticated in a real app)
    return Array.from(this.warehouses.values()).filter(warehouse => {
      const distance = Math.sqrt(
        Math.pow(Number(warehouse.latitude) - latitude, 2) + 
        Math.pow(Number(warehouse.longitude) - longitude, 2)
      );
      // Convert to approximate kilometers (very rough estimation)
      const distanceKm = distance * 111;
      return distanceKm <= radius;
    });
  }
  
  async updateWarehouse(id: number, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const warehouse = await this.getWarehouse(id);
    if (!warehouse) return undefined;
    
    const updatedWarehouse: Warehouse = { ...warehouse, ...warehouseData };
    this.warehouses.set(id, updatedWarehouse);
    return updatedWarehouse;
  }

  async getWarehousesByState(state: string): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(
      warehouse => warehouse.state.toLowerCase() === state.toLowerCase()
    );
  }

  async getWarehousesByDistrict(district: string): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(
      warehouse => warehouse.district?.toLowerCase() === district.toLowerCase()
    );
  }

  async getWarehousesByCommodity(commodity: string): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(warehouse => {
      const primaryCommodities = warehouse.primaryCommodities as string[] || [];
      return primaryCommodities.some(c => 
        c.toLowerCase().includes(commodity.toLowerCase())
      );
    });
  }

  async seedMandiWarehouses(): Promise<number> {
    const { panIndiaMandiWarehouses } = await import('./data/mandi-warehouse-data');
    
    let seededCount = 0;
    for (const mandiData of panIndiaMandiWarehouses) {
      const warehouseName = `${mandiData.mandiName} TradeWiser Warehouse`;
      const address = `Agricultural Market Complex, ${mandiData.mandiName}, ${mandiData.district}`;
      
      const insertWarehouse: InsertWarehouse = {
        name: warehouseName,
        mandiName: mandiData.mandiName,
        address: address,
        city: mandiData.mandiName,
        district: mandiData.district,
        state: mandiData.state,
        pincode: mandiData.pincode || "000000",
        latitude: mandiData.latitude?.toString() || "0",
        longitude: mandiData.longitude?.toString() || "0",
        capacity: mandiData.capacity.toString(),
        availableSpace: (mandiData.capacity * 0.8).toString(), // 80% available initially
        channelType: "green",
        warehouseType: mandiData.warehouseType,
        regulationStatus: mandiData.regulationStatus,
        nearestRailwayStation: mandiData.nearestRailwayStation,
        railwayDistance: mandiData.railwayDistance.toString(),
        hasGodownFacilities: mandiData.hasGodownFacilities,
        hasColdStorage: mandiData.hasColdStorage,
        hasGradingFacility: false, // Default to false for now
        phoneNumber: mandiData.phoneNumber,
        primaryCommodities: mandiData.primaryCommodities,
        specializations: [],
        facilities: [],
        ownerId: 1, // Default to test user
        isActive: true,
        verificationStatus: "verified"
      };
      
      await this.createWarehouse(insertWarehouse);
      seededCount++;
    }
    
    return seededCount;
  }
  
  // Commodity operations
  async getCommodity(id: number): Promise<Commodity | undefined> {
    return this.commodities.get(id);
  }
  
  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const id = this.currentCommodityId++;
    const now = new Date();
    const commodity: Commodity = { 
      ...insertCommodity, 
      id, 
      depositDate: now, 
      lastUpdated: now 
    };
    this.commodities.set(id, commodity);
    return commodity;
  }
  
  async listCommodities(): Promise<Commodity[]> {
    return Array.from(this.commodities.values());
  }
  
  async listCommoditiesByOwner(ownerId: number): Promise<Commodity[]> {
    return Array.from(this.commodities.values()).filter(
      commodity => commodity.ownerId === ownerId
    );
  }
  
  async updateCommodity(id: number, commodityData: Partial<InsertCommodity>): Promise<Commodity | undefined> {
    const commodity = await this.getCommodity(id);
    if (!commodity) return undefined;
    
    const now = new Date();
    const updatedCommodity: Commodity = { 
      ...commodity, 
      ...commodityData, 
      lastUpdated: now 
    };
    this.commodities.set(id, updatedCommodity);
    return updatedCommodity;
  }
  
  // Warehouse Receipt operations
  async getWarehouseReceipt(id: number): Promise<WarehouseReceipt | undefined> {
    return this.warehouseReceipts.get(id);
  }
  
  async getWarehouseReceiptByNumber(receiptNumber: string): Promise<WarehouseReceipt | undefined> {
    return Array.from(this.warehouseReceipts.values()).find(
      receipt => receipt.receiptNumber === receiptNumber
    );
  }
  
  async getWarehouseReceiptByExternalId(externalId: string, source: string): Promise<WarehouseReceipt | undefined> {
    return Array.from(this.warehouseReceipts.values()).find(
      receipt => receipt.externalId === externalId && receipt.externalSource === source
    );
  }
  
  async createWarehouseReceipt(insertReceipt: InsertWarehouseReceipt): Promise<WarehouseReceipt> {
    const id = this.currentReceiptId++;
    const now = new Date();
    
    // FIXED: Ensure valuation defaults to Rs 50/kg if not provided (1 MT = 1000 kg)
    const quantity = parseFloat(insertReceipt.quantity?.toString() || '0');
    const defaultValuation = (quantity * 1000 * 50).toString();
    
    const receipt: WarehouseReceipt = { 
      ...insertReceipt, 
      id, 
      issuedDate: now,
      status: insertReceipt.status || 'active',
      ownerId: insertReceipt.ownerId || null,
      measurementUnit: insertReceipt.measurementUnit || null,
      valuation: insertReceipt.valuation || defaultValuation  // FIXED: Proper valuation handling
    };
    this.warehouseReceipts.set(id, receipt);
    return receipt;
  }
  
  async listWarehouseReceipts(): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values());
  }
  
  async listWarehouseReceiptsByOwner(ownerId: number): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values()).filter(
      receipt => receipt.ownerId === ownerId
    );
  }
  
  async listWarehouseReceiptsByCommodity(commodityId: number): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values()).filter(
      receipt => receipt.commodityId === commodityId
    );
  }
  
  async listWarehouseReceiptsByExternalSource(source: string): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values()).filter(
      receipt => receipt.externalSource === source
    );
  }
  
  // User receipts (for loan collateral)
  async listUserReceipts(userId: number): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values()).filter(
      receipt => receipt.ownerId === userId
    );
  }
  
  // Get receipts by IDs 
  async getReceiptsByIds(receiptIds: number[]): Promise<WarehouseReceipt[]> {
    return Array.from(this.warehouseReceipts.values()).filter(
      receipt => receiptIds.includes(receipt.id)
    );
  }
  
  async updateWarehouseReceipt(id: number, receiptData: Partial<InsertWarehouseReceipt>): Promise<WarehouseReceipt | undefined> {
    const receipt = await this.getWarehouseReceipt(id);
    if (!receipt) return undefined;
    
    const updatedReceipt: WarehouseReceipt = { ...receipt, ...receiptData };
    this.warehouseReceipts.set(id, updatedReceipt);
    return updatedReceipt;
  }
  
  // Loan operations
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }
  
  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.currentLoanId++;
    const now = new Date();
    const loan: Loan = { 
      ...insertLoan, 
      id, 
      startDate: now,
      status: insertLoan.status || 'approved', // Ensure status is set
      userId: insertLoan.userId || null,
      lendingPartnerId: insertLoan.lendingPartnerId || null
    };
    this.loans.set(id, loan);
    return loan;
  }
  
  async listLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }
  
  async listLoansByUser(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      loan => loan.userId === userId
    );
  }
  
  async updateLoan(id: number, loanData: Partial<InsertLoan>): Promise<Loan | undefined> {
    const loan = await this.getLoan(id);
    if (!loan) return undefined;
    
    const updatedLoan: Loan = { ...loan, ...loanData };
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }
  
  // Receipt transfer operations (blockchain)
  private receiptTransfers: Map<number, ReceiptTransfer> = new Map();
  private currentTransferId: number = 1;
  
  async createReceiptTransfer(insertTransfer: InsertReceiptTransfer): Promise<ReceiptTransfer> {
    const id = this.currentTransferId++;
    const now = new Date();
    
    const transfer: ReceiptTransfer = {
      ...insertTransfer,
      id,
      transferDate: now
    };
    
    this.receiptTransfers.set(id, transfer);
    return transfer;
  }
  
  async listReceiptTransfersByReceipt(receiptId: number): Promise<ReceiptTransfer[]> {
    return Array.from(this.receiptTransfers.values()).filter(
      transfer => transfer.receiptId === receiptId
    );
  }
  
  async getReceiptTransferByHash(transactionHash: string): Promise<ReceiptTransfer | undefined> {
    return Array.from(this.receiptTransfers.values()).find(
      transfer => transfer.transactionHash === transactionHash
    );
  }
  
  // Process operations
  async getProcess(id: number): Promise<Process | undefined> {
    return this.processes.get(id);
  }
  
  async createProcess(insertProcess: InsertProcess): Promise<Process> {
    const id = this.currentProcessId++;
    const now = new Date();
    const process: Process = { 
      ...insertProcess, 
      id, 
      startTime: now,
      completedTime: null,
      status: insertProcess.status || 'pending'
    };
    this.processes.set(id, process);
    return process;
  }
  
  async listProcesses(): Promise<Process[]> {
    return Array.from(this.processes.values());
  }
  
  async listProcessesByUser(userId: number): Promise<Process[]> {
    return Array.from(this.processes.values()).filter(
      process => process.userId === userId
    );
  }
  
  async listProcessesByCommodity(commodityId: number): Promise<Process[]> {
    return Array.from(this.processes.values()).filter(
      process => process.commodityId === commodityId
    );
  }
  
  async updateProcess(id: number, processData: Partial<InsertProcess>): Promise<Process | undefined> {
    const process = await this.getProcess(id);
    if (!process) return undefined;
    
    const updatedProcess: Process = { ...process, ...processData };
    // If process status is changed to completed, update completion time
    if (processData.status === 'completed' && process.status !== 'completed') {
      updatedProcess.completedTime = new Date();
    }
    
    this.processes.set(id, updatedProcess);
    return updatedProcess;
  }

  // Commodity Sack operations for granular tracking
  async getCommoditySack(id: number): Promise<CommoditySack | undefined> {
    return this.commoditySacks.get(id);
  }
  
  async getCommoditySackBySackId(sackId: string): Promise<CommoditySack | undefined> {
    return Array.from(this.commoditySacks.values()).find(
      sack => sack.sackId === sackId
    );
  }
  
  async createCommoditySack(insertSack: InsertCommoditySack): Promise<CommoditySack> {
    const id = this.currentSackId++;
    const now = new Date();
    const sack: CommoditySack = {
      ...insertSack,
      id,
      createdAt: now,
      lastUpdated: now,
      status: insertSack.status || 'active',
      ownerId: insertSack.ownerId || null,
      isOwnerHidden: insertSack.isOwnerHidden || false
    };
    this.commoditySacks.set(id, sack);
    return sack;
  }
  
  async createManyCommoditySacks(sacks: InsertCommoditySack[]): Promise<CommoditySack[]> {
    const createdSacks: CommoditySack[] = [];
    for (const sack of sacks) {
      const createdSack = await this.createCommoditySack(sack);
      createdSacks.push(createdSack);
    }
    return createdSacks;
  }
  
  async listCommoditySacks(): Promise<CommoditySack[]> {
    return Array.from(this.commoditySacks.values());
  }
  
  async listCommoditySacksByReceipt(receiptId: number): Promise<CommoditySack[]> {
    return Array.from(this.commoditySacks.values()).filter(
      sack => sack.receiptId === receiptId
    );
  }
  
  async listCommoditySacksByOwner(ownerId: number, includeHidden: boolean = false): Promise<CommoditySack[]> {
    return Array.from(this.commoditySacks.values()).filter(
      sack => sack.ownerId === ownerId && (includeHidden || !sack.isOwnerHidden)
    );
  }
  
  async listCommoditySacksByWarehouse(warehouseId: number): Promise<CommoditySack[]> {
    return Array.from(this.commoditySacks.values()).filter(
      sack => sack.warehouseId === warehouseId
    );
  }
  
  async updateCommoditySack(id: number, sackData: Partial<InsertCommoditySack>): Promise<CommoditySack | undefined> {
    const sack = await this.getCommoditySack(id);
    if (!sack) return undefined;
    
    const now = new Date();
    const updatedSack: CommoditySack = {
      ...sack,
      ...sackData,
      lastUpdated: now
    };
    this.commoditySacks.set(id, updatedSack);
    return updatedSack;
  }
  
  // Sack Movement operations
  async createSackMovement(movement: InsertSackMovement): Promise<SackMovement> {
    const id = this.currentSackMovementId++;
    const now = new Date();
    const sackMovement: SackMovement = {
      ...movement,
      id,
      movementDate: now
    };
    this.sackMovements.set(id, sackMovement);
    return sackMovement;
  }
  
  async getSackMovementHistory(sackId: number): Promise<SackMovement[]> {
    return Array.from(this.sackMovements.values())
      .filter(movement => movement.sackId === sackId)
      .sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime()); // Sort by date descending
  }
  
  async listRecentSackMovements(limit: number = 10): Promise<SackMovement[]> {
    return Array.from(this.sackMovements.values())
      .sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime()) // Sort by date descending
      .slice(0, limit);
  }
  
  // Sack Quality Assessment operations
  async createSackQualityAssessment(assessment: InsertSackQualityAssessment): Promise<SackQualityAssessment> {
    const id = this.currentSackQualityAssessmentId++;
    const now = new Date();
    const sackQualityAssessment: SackQualityAssessment = {
      ...assessment,
      id,
      inspectionDate: now
    };
    this.sackQualityAssessments.set(id, sackQualityAssessment);
    return sackQualityAssessment;
  }
  
  async getSackQualityAssessmentHistory(sackId: number): Promise<SackQualityAssessment[]> {
    return Array.from(this.sackQualityAssessments.values())
      .filter(assessment => assessment.sackId === sackId)
      .sort((a, b) => b.inspectionDate.getTime() - a.inspectionDate.getTime()); // Sort by date descending
  }
}

export const storage = new MemStorage();