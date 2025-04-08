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
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Warehouse operations
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  listWarehouses(): Promise<Warehouse[]>;
  listWarehousesByLocation(latitude: number, longitude: number, radius: number): Promise<Warehouse[]>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  
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
  
  // Receipt transfer operations (blockchain)
  createReceiptTransfer(transfer: InsertReceiptTransfer): Promise<ReceiptTransfer>;
  listReceiptTransfersByReceipt(receiptId: number): Promise<ReceiptTransfer[]>;
  getReceiptTransferByHash(transactionHash: string): Promise<ReceiptTransfer | undefined>;
  
  // Loan operations
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  listLoans(): Promise<Loan[]>;
  listLoansByUser(userId: number): Promise<Loan[]>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  
  // Process operations
  getProcess(id: number): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  listProcesses(): Promise<Process[]>;
  listProcessesByUser(userId: number): Promise<Process[]>;
  listProcessesByCommodity(commodityId: number): Promise<Process[]>;
  updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined>;
  
  // Commodity Sack operations for granular tracking
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
  getSackMovementByTransactionHash(transactionHash: string): Promise<SackMovement | undefined>;
  
  // Sack Quality Assessment operations
  createSackQualityAssessment(assessment: InsertSackQualityAssessment): Promise<SackQualityAssessment>;
  listSackQualityAssessments(sackId: number): Promise<SackQualityAssessment[]>;
  getLatestSackQualityAssessment(sackId: number): Promise<SackQualityAssessment | undefined>;
  
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
  listLoanRepayments(): Promise<LoanRepayment[]>;
  listLoanRepaymentsByLoan(loanId: number): Promise<LoanRepayment[]>;
  
  // User Credit Profile operations
  getUserCreditProfile(userId: number): Promise<UserCreditProfile | undefined>;
  createUserCreditProfile(profile: InsertUserCreditProfile): Promise<UserCreditProfile>;
  updateUserCreditProfile(userId: number, profileData: Partial<InsertUserCreditProfile>): Promise<UserCreditProfile | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  // Existing entity maps
  private users: Map<number, User>;
  private warehouses: Map<number, Warehouse>;
  private commodities: Map<number, Commodity>;
  private warehouseReceipts: Map<number, WarehouseReceipt>;
  private loans: Map<number, Loan>;
  private processes: Map<number, Process>;
  
  // Lending-related maps
  private lendingPartners: Map<number, LendingPartner>;
  private loanApplications: Map<number, LoanApplication>;
  private collateralPledges: Map<number, CollateralPledge>;
  private loanRepayments: Map<number, LoanRepayment>;
  private userCreditProfiles: Map<number, UserCreditProfile>;
  
  // Sack-level tracking maps
  private commoditySacks: Map<number, CommoditySack>;
  private sackMovements: Map<number, SackMovement>;
  private sackQualityAssessments: Map<number, SackQualityAssessment>;
  
  // ID counters for existing entities
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
  private currentQualityAssessmentId: number;
  
  constructor() {
    // Initialize existing entity maps
    this.users = new Map();
    this.warehouses = new Map();
    this.commodities = new Map();
    this.warehouseReceipts = new Map();
    this.loans = new Map();
    this.processes = new Map();
    
    // Initialize lending-related entity maps
    this.lendingPartners = new Map();
    this.loanApplications = new Map();
    this.collateralPledges = new Map();
    this.loanRepayments = new Map();
    this.userCreditProfiles = new Map();
    
    // Initialize sack-level tracking maps
    this.commoditySacks = new Map();
    this.sackMovements = new Map();
    this.sackQualityAssessments = new Map();
    
    // Set starting IDs for existing entities
    this.currentUserId = 1;
    this.currentWarehouseId = 1;
    this.currentCommodityId = 1;
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
    this.currentQualityAssessmentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Sample user
    const user: InsertUser = {
      username: "rajiv",
      password: "securepassword", // In a real app, this would be hashed
      fullName: "Rajiv Sharma",
      email: "rajiv@example.com",
      phone: "+91 9876543210",
      role: "farmer",
      kycVerified: true,
      kycDocuments: {},
      businessDetails: {}
    };
    this.createUser(user);
    
    // Sample warehouses
    const warehouses: InsertWarehouse[] = [
      {
        name: "Sharma Agriculture Warehouse",
        address: "123 Warehouse St",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        latitude: 28.6139,
        longitude: 77.2090,
        capacity: 5000,
        availableSpace: 1500,
        channelType: "green",
        ownerId: 1,
        specializations: { crops: ["wheat", "rice", "pulses"] },
        facilities: { cleaning: true, sorting: true, packaging: true }
      },
      {
        name: "Punjab Grain Storage",
        address: "456 Storage Ave",
        city: "Delhi",
        state: "Delhi",
        pincode: "110002",
        latitude: 28.6519,
        longitude: 77.2315,
        capacity: 3500,
        availableSpace: 800,
        channelType: "orange",
        ownerId: 1,
        specializations: { crops: ["wheat", "rice"] },
        facilities: { cleaning: true, sorting: true, packaging: false }
      },
      {
        name: "Modern Agri Storage",
        address: "789 Modern Rd",
        city: "Ghaziabad",
        state: "Uttar Pradesh",
        pincode: "201014",
        latitude: 28.6711,
        longitude: 77.4121,
        capacity: 7000,
        availableSpace: 2200,
        channelType: "green",
        ownerId: 1,
        specializations: { crops: ["wheat", "rice", "pulses", "oilseeds"] },
        facilities: { cleaning: true, sorting: true, packaging: true, refrigeration: true }
      }
    ];
    
    warehouses.forEach(warehouse => this.createWarehouse(warehouse));
    
    // Sample commodities
    const commodities: InsertCommodity[] = [
      {
        name: "Wheat",
        type: "Grain",
        quantity: 750,
        measurementUnit: "MT",
        qualityParameters: { moisture: "11.2%", foreignMatter: "0.5%" },
        gradeAssigned: "A",
        warehouseId: 1,
        ownerId: 1,
        status: "active",
        channelType: "green",
        valuation: 1575000
      },
      {
        name: "Rice",
        type: "Grain",
        quantity: 320,
        measurementUnit: "MT",
        qualityParameters: { moisture: "8.5%", foreignMatter: "0.3%" },
        gradeAssigned: "A",
        warehouseId: 2,
        ownerId: 1,
        status: "active",
        channelType: "orange",
        valuation: 2400000
      },
      {
        name: "Pulses",
        type: "Legume",
        quantity: 125,
        measurementUnit: "MT",
        qualityParameters: { moisture: "9.1%", foreignMatter: "0.7%" },
        gradeAssigned: "B",
        warehouseId: 3,
        ownerId: 1,
        status: "processing",
        channelType: "green",
        valuation: 937500
      }
    ];
    
    commodities.forEach(commodity => this.createCommodity(commodity));
    
    // Sample warehouse receipts
    const receipts: InsertWarehouseReceipt[] = [
      {
        receiptNumber: "eWR-28735",
        commodityId: 1,
        ownerId: 1,
        warehouseId: 1,
        quantity: 750,
        status: "active",
        blockchainHash: "0x123abc",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        valuation: 1575000,
        liens: {}
      },
      {
        receiptNumber: "eWR-29102",
        commodityId: 2,
        ownerId: 1,
        warehouseId: 2,
        quantity: 320,
        status: "active",
        blockchainHash: "0x456def",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        valuation: 2400000,
        liens: {}
      },
      {
        receiptNumber: "eWR-29544",
        commodityId: 3,
        ownerId: 1,
        warehouseId: 3,
        quantity: 125,
        status: "processing",
        blockchainHash: "0x789ghi",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        valuation: 937500,
        liens: {}
      }
    ];
    
    receipts.forEach(receipt => this.createWarehouseReceipt(receipt));
    
    // Sample loans
    const loans: InsertLoan[] = [
      {
        userId: 1,
        amount: 1500000, // 60% of wheat receipt valuation
        interestRate: 9.5,
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: "active",
        collateralReceiptIds: [1],
        outstandingAmount: 1500000,
        repaymentSchedule: {
          type: "monthly",
          installments: 6,
          nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      },
      {
        userId: 1,
        amount: 800000,
        interestRate: 10.5,
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        status: "active",
        collateralReceiptIds: [2],
        outstandingAmount: 600000, // Partially repaid
        repaymentSchedule: {
          type: "bullet",
          maturityDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
        }
      }
    ];
    
    loans.forEach(loan => this.createLoan(loan));
    
    this.createLoan(loan);
    
    // Sample process
    const process: InsertProcess = {
      commodityId: 3,
      warehouseId: 3,
      userId: 1,
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
    
    this.createProcess(process);
    
    // Sample lending partners
    const lendingPartners: InsertLendingPartner[] = [
      {
        name: "State Bank of Agriculture",
        type: "bank",
        interestRateMin: "7.5",
        interestRateMax: "11.0",
        minLoanAmount: "500000",
        maxLoanAmount: "10000000",
        maxTenureDays: 365,
        creditRatingCriteria: ["AAA", "AA", "A", "BBB"],
        logoUrl: "/assets/lending/sba-logo.png",
        description: "Leading agricultural bank with specialized commodity financing solutions",
        active: true,
        eligibilityCriteria: JSON.stringify({
          kycRequired: true,
          minAnnualIncome: 1000000
        }),
        collateralRequirements: JSON.stringify({
          ltv: 0.7, // Loan-to-value ratio
          receiptAge: 30, // Maximum receipt age in days
          qualityGrades: ["A", "B"]
        })
      },
      {
        name: "Rural Microfinance",
        type: "microfinance",
        interestRateMin: "9.0",
        interestRateMax: "14.0",
        minLoanAmount: "100000",
        maxLoanAmount: "2000000",
        maxTenureDays: 180,
        creditRatingCriteria: ["A", "BBB", "BB", "B"],
        logoUrl: "/assets/lending/rural-mf-logo.png",
        description: "Microfinance institution focused on small farmers and rural entrepreneurs",
        active: true,
        eligibilityCriteria: JSON.stringify({
          kycRequired: true,
          minAnnualIncome: 500000
        }),
        collateralRequirements: JSON.stringify({
          ltv: 0.65,
          receiptAge: 45,
          qualityGrades: ["A", "B", "C"]
        })
      },
      {
        name: "Agri Credit NBFC",
        type: "nbfc",
        interestRateMin: "8.5",
        interestRateMax: "12.5",
        minLoanAmount: "200000",
        maxLoanAmount: "5000000",
        maxTenureDays: 270,
        creditRatingCriteria: ["AA", "A", "BBB", "BB"],
        logoUrl: "/assets/lending/agri-credit-logo.png",
        description: "Specialized NBFC for agricultural value chain financing",
        active: true,
        eligibilityCriteria: JSON.stringify({
          kycRequired: true,
          minAnnualIncome: 750000
        }),
        collateralRequirements: JSON.stringify({
          ltv: 0.75,
          receiptAge: 30,
          qualityGrades: ["A", "B"]
        })
      }
    ];
    
    lendingPartners.forEach(partner => this.createLendingPartner(partner));
    
    // Sample user credit profile
    const userCreditProfile: InsertUserCreditProfile = {
      userId: 1,
      creditScore: 720,
      creditRating: "A",
      defaultRiskScore: "25",
      creditLimit: "1500000",
      externalCreditReportId: "CRED-9872-A",
      creditHistory: JSON.stringify({
        totalLoans: 5,
        currentLoans: 2,
        completedLoans: 3,
        defaultedLoans: 0
      }),
      riskAssessment: JSON.stringify({
        overallRisk: "medium",
        delinquencyRisk: "low",
        marketRisk: "medium",
        operationalRisk: "low"
      })
    };
    
    this.createUserCreditProfile(userCreditProfile);
    
    // Sample loan application
    const loanApplication: InsertLoanApplication = {
      userId: 1,
      lendingPartnerId: 1,
      receiptIdsJson: JSON.stringify([1]),
      requestedAmount: "1000000",
      requestedTenureDays: 180,
      status: "approved",
      purpose: "Working capital for next cropping season",
      applicationDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      approvalDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      rejectionReason: null,
      interestRate: "9.5",
      processingFee: "10000",
      termsAccepted: true
    };
    
    this.createLoanApplication(loanApplication);
    
    // Sample collateral pledge
    const collateralPledge: InsertCollateralPledge = {
      receiptId: 1,
      loanId: 1,
      pledgeDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      status: "pledged",
      valuationAmount: "1575000",
      transactionHash: "0x67890abcdef",
      smartContractId: "SC-123456",
      applicationId: 1,
      releaseDate: null,
      releaseTransactionHash: null,
      blockchainData: { network: "ethereum", contract: "WarehouseReceipt", method: "pledge" }
    };
    
    this.createCollateralPledge(collateralPledge);
  }
  
  // Lending Partner operations
  async getLendingPartner(id: number): Promise<LendingPartner | undefined> {
    return this.lendingPartners.get(id);
  }
  
  async createLendingPartner(partner: InsertLendingPartner): Promise<LendingPartner> {
    const id = this.currentLendingPartnerId++;
    const now = new Date();
    const lendingPartner: LendingPartner = { ...partner, id, createdAt: now };
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
    // Convert receiptIds to JSON if it's present
    const applicationData = { ...application };
    if (applicationData.receiptIds) {
      applicationData.receiptIdsJson = JSON.stringify(applicationData.receiptIds);
      delete applicationData.receiptIds; // Remove the non-schema property
    }
    
    const loanApplication: LoanApplication = { 
      ...applicationData, 
      id,
      applicationDate: applicationData.applicationDate || new Date() 
    };
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
    // Create a copy to not modify the input directly
    const pledgeData = { ...pledge };
    
    // Ensure required properties are set
    if (!pledgeData.pledgeDate) {
      pledgeData.pledgeDate = new Date();
    }
    
    const collateralPledge: CollateralPledge = { 
      ...pledgeData, 
      id, 
      status: pledgeData.status || 'pledged',
      loanId: pledgeData.loanId || null,
      applicationId: pledgeData.applicationId || null
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
    const loanRepayment: LoanRepayment = { ...repayment, id, repaymentDate: now };
    this.loanRepayments.set(id, loanRepayment);
    return loanRepayment;
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
    const receipt: WarehouseReceipt = { 
      ...insertReceipt, 
      id, 
      issuedDate: now,
      status: insertReceipt.status || 'active',
      ownerId: insertReceipt.ownerId || null,
      measurementUnit: insertReceipt.measurementUnit || null 
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
      .sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime())
      .slice(0, limit);
  }
  
  async getSackMovementByTransactionHash(transactionHash: string): Promise<SackMovement | undefined> {
    return Array.from(this.sackMovements.values()).find(
      movement => movement.transactionHash === transactionHash
    );
  }
  
  // Sack Quality Assessment operations
  async createSackQualityAssessment(assessment: InsertSackQualityAssessment): Promise<SackQualityAssessment> {
    const id = this.currentQualityAssessmentId++;
    const now = new Date();
    const qualityAssessment: SackQualityAssessment = {
      ...assessment,
      id,
      inspectionDate: now
    };
    this.sackQualityAssessments.set(id, qualityAssessment);
    return qualityAssessment;
  }
  
  async listSackQualityAssessments(sackId: number): Promise<SackQualityAssessment[]> {
    return Array.from(this.sackQualityAssessments.values())
      .filter(assessment => assessment.sackId === sackId)
      .sort((a, b) => b.inspectionDate.getTime() - a.inspectionDate.getTime()); // Sort by date descending
  }
  
  async getLatestSackQualityAssessment(sackId: number): Promise<SackQualityAssessment | undefined> {
    const assessments = await this.listSackQualityAssessments(sackId);
    return assessments.length > 0 ? assessments[0] : undefined;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  // Warehouse operations
  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db.insert(warehouses).values(insertWarehouse).returning();
    return warehouse;
  }

  async listWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async listWarehousesByLocation(latitude: number, longitude: number, radius: number): Promise<Warehouse[]> {
    // For now, get all warehouses and filter in-memory
    // In a real app, you'd use a spatial query or PostGIS
    const allWarehouses = await this.listWarehouses();
    return allWarehouses.filter(warehouse => {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(warehouse.latitude),
        parseFloat(warehouse.longitude)
      );
      return distance <= radius;
    });

    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      return distance;
    }

    function deg2rad(deg: number): number {
      return deg * (Math.PI / 180);
    }
  }

  async updateWarehouse(id: number, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(warehouseData)
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse || undefined;
  }
  
  // Commodity operations
  async getCommodity(id: number): Promise<Commodity | undefined> {
    const [commodity] = await db.select().from(commodities).where(eq(commodities.id, id));
    return commodity || undefined;
  }

  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const now = new Date();
    const commodityWithDates = {
      ...insertCommodity,
      depositDate: now,
      lastUpdated: now
    };
    const [commodity] = await db.insert(commodities).values(commodityWithDates).returning();
    return commodity;
  }

  async listCommodities(): Promise<Commodity[]> {
    return await db.select().from(commodities);
  }

  async listCommoditiesByOwner(ownerId: number): Promise<Commodity[]> {
    return await db.select().from(commodities).where(eq(commodities.ownerId, ownerId));
  }

  async updateCommodity(id: number, commodityData: Partial<InsertCommodity>): Promise<Commodity | undefined> {
    const dataToUpdate = { ...commodityData, lastUpdated: new Date() };
    const [updatedCommodity] = await db
      .update(commodities)
      .set(dataToUpdate)
      .where(eq(commodities.id, id))
      .returning();
    return updatedCommodity || undefined;
  }
  
  // Warehouse Receipt operations
  async getWarehouseReceipt(id: number): Promise<WarehouseReceipt | undefined> {
    const [receipt] = await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.id, id));
    return receipt || undefined;
  }

  async getWarehouseReceiptByNumber(receiptNumber: string): Promise<WarehouseReceipt | undefined> {
    const [receipt] = await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.receiptNumber, receiptNumber));
    return receipt || undefined;
  }
  
  async getWarehouseReceiptByExternalId(externalId: string, source: string): Promise<WarehouseReceipt | undefined> {
    const [receipt] = await db.select().from(warehouseReceipts)
      .where(and(
        eq(warehouseReceipts.externalId, externalId),
        eq(warehouseReceipts.externalSource, source)
      ));
    return receipt || undefined;
  }

  async createWarehouseReceipt(insertReceipt: InsertWarehouseReceipt): Promise<WarehouseReceipt> {
    const now = new Date();
    const receiptWithDate = {
      ...insertReceipt,
      issuedDate: now
    };
    const [receipt] = await db.insert(warehouseReceipts).values(receiptWithDate).returning();
    return receipt;
  }

  async listWarehouseReceipts(): Promise<WarehouseReceipt[]> {
    try {
      return await db.select().from(warehouseReceipts);
    } catch (error) {
      console.error("Error listing warehouse receipts:", error);
      return [];
    }
  }

  async listWarehouseReceiptsByOwner(ownerId: number): Promise<WarehouseReceipt[]> {
    return await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.ownerId, ownerId));
  }
  
  async listWarehouseReceiptsByCommodity(commodityId: number): Promise<WarehouseReceipt[]> {
    return await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.commodityId, commodityId));
  }
  
  async listWarehouseReceiptsByExternalSource(source: string): Promise<WarehouseReceipt[]> {
    return await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.externalSource, source));
  }
  
  // User receipts (for loan collateral)
  async listUserReceipts(userId: number): Promise<WarehouseReceipt[]> {
    return await db.select().from(warehouseReceipts).where(eq(warehouseReceipts.ownerId, userId));
  }
  
  // Get receipts by IDs
  async getReceiptsByIds(receiptIds: number[]): Promise<WarehouseReceipt[]> {
    if (!receiptIds.length) return [];
    return await db.select().from(warehouseReceipts).where(
      receiptIds.length === 1 
        ? eq(warehouseReceipts.id, receiptIds[0])
        : warehouseReceipts.id.in(receiptIds)
    );
  }

  async updateWarehouseReceipt(id: number, receiptData: Partial<InsertWarehouseReceipt>): Promise<WarehouseReceipt | undefined> {
    const [updatedReceipt] = await db
      .update(warehouseReceipts)
      .set(receiptData)
      .where(eq(warehouseReceipts.id, id))
      .returning();
    return updatedReceipt || undefined;
  }
  
  // Loan operations
  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan || undefined;
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const now = new Date();
    const loanWithDate = {
      ...insertLoan,
      startDate: now
    };
    const [loan] = await db.insert(loans).values(loanWithDate).returning();
    return loan;
  }

  async listLoans(): Promise<Loan[]> {
    return await db.select().from(loans);
  }

  async listLoansByUser(userId: number): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.userId, userId));
  }

  async updateLoan(id: number, loanData: Partial<InsertLoan>): Promise<Loan | undefined> {
    const [updatedLoan] = await db
      .update(loans)
      .set(loanData)
      .where(eq(loans.id, id))
      .returning();
    return updatedLoan || undefined;
  }
  
  // Receipt transfer operations (blockchain)
  // For simplicity, we'll implement in-memory versions of these
  // In a real app, this would be implemented with proper DB tables
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
    const [process] = await db.select().from(processes).where(eq(processes.id, id));
    return process || undefined;
  }

  async createProcess(insertProcess: InsertProcess): Promise<Process> {
    const now = new Date();
    const processWithDates = {
      ...insertProcess,
      startTime: now,
      completedTime: null
    };
    const [process] = await db.insert(processes).values(processWithDates).returning();
    return process;
  }

  async listProcesses(): Promise<Process[]> {
    return await db.select().from(processes);
  }

  async listProcessesByUser(userId: number): Promise<Process[]> {
    return await db.select().from(processes).where(eq(processes.userId, userId));
  }

  async listProcessesByCommodity(commodityId: number): Promise<Process[]> {
    return await db.select().from(processes).where(eq(processes.commodityId, commodityId));
  }

  async updateProcess(id: number, processData: Partial<InsertProcess>): Promise<Process | undefined> {
    let dataToUpdate = processData;
    
    // If updating status to completed, add completed time
    if (processData.status === 'completed') {
      dataToUpdate = { ...processData, completedTime: new Date() };
    }
    
    const [updatedProcess] = await db
      .update(processes)
      .set(dataToUpdate)
      .where(eq(processes.id, id))
      .returning();
    return updatedProcess || undefined;
  }

  // Commodity Sack operations for granular tracking
  async getCommoditySack(id: number): Promise<CommoditySack | undefined> {
    const [sack] = await db.select().from(commoditySacks).where(eq(commoditySacks.id, id));
    return sack || undefined;
  }
  
  async getCommoditySackBySackId(sackId: string): Promise<CommoditySack | undefined> {
    const [sack] = await db.select().from(commoditySacks).where(eq(commoditySacks.sackId, sackId));
    return sack || undefined;
  }
  
  async createCommoditySack(insertSack: InsertCommoditySack): Promise<CommoditySack> {
    const now = new Date();
    const sackWithDates = {
      ...insertSack,
      createdAt: now,
      lastUpdated: now
    };
    const [sack] = await db.insert(commoditySacks).values(sackWithDates).returning();
    return sack;
  }
  
  async createManyCommoditySacks(sacks: InsertCommoditySack[]): Promise<CommoditySack[]> {
    const now = new Date();
    const sacksWithDates = sacks.map(sack => ({
      ...sack,
      createdAt: now,
      lastUpdated: now
    }));
    return await db.insert(commoditySacks).values(sacksWithDates).returning();
  }
  
  async listCommoditySacks(): Promise<CommoditySack[]> {
    return await db.select().from(commoditySacks);
  }
  
  async listCommoditySacksByReceipt(receiptId: number): Promise<CommoditySack[]> {
    return await db.select().from(commoditySacks).where(eq(commoditySacks.receiptId, receiptId));
  }
  
  async listCommoditySacksByOwner(ownerId: number, includeHidden: boolean = false): Promise<CommoditySack[]> {
    if (includeHidden) {
      return await db.select().from(commoditySacks).where(eq(commoditySacks.ownerId, ownerId));
    } else {
      return await db.select().from(commoditySacks).where(
        and(
          eq(commoditySacks.ownerId, ownerId),
          eq(commoditySacks.isOwnerHidden, false)
        )
      );
    }
  }
  
  async listCommoditySacksByWarehouse(warehouseId: number): Promise<CommoditySack[]> {
    return await db.select().from(commoditySacks).where(eq(commoditySacks.warehouseId, warehouseId));
  }
  
  async updateCommoditySack(id: number, sackData: Partial<InsertCommoditySack>): Promise<CommoditySack | undefined> {
    const dataToUpdate = { ...sackData, lastUpdated: new Date() };
    const [updatedSack] = await db
      .update(commoditySacks)
      .set(dataToUpdate)
      .where(eq(commoditySacks.id, id))
      .returning();
    return updatedSack || undefined;
  }
  
  // Sack Movement operations
  async createSackMovement(movement: InsertSackMovement): Promise<SackMovement> {
    const now = new Date();
    const movementWithDate = {
      ...movement,
      movementDate: now
    };
    const [sackMovement] = await db.insert(sackMovements).values(movementWithDate).returning();
    return sackMovement;
  }
  
  async getSackMovementHistory(sackId: number): Promise<SackMovement[]> {
    return await db
      .select()
      .from(sackMovements)
      .where(eq(sackMovements.sackId, sackId))
      .orderBy(desc(sackMovements.movementDate));
  }
  
  async listRecentSackMovements(limit: number = 10): Promise<SackMovement[]> {
    return await db
      .select()
      .from(sackMovements)
      .orderBy(desc(sackMovements.movementDate))
      .limit(limit);
  }
  
  async getSackMovementByTransactionHash(transactionHash: string): Promise<SackMovement | undefined> {
    const [movement] = await db
      .select()
      .from(sackMovements)
      .where(eq(sackMovements.transactionHash, transactionHash));
    return movement || undefined;
  }
  
  // Sack Quality Assessment operations
  async createSackQualityAssessment(assessment: InsertSackQualityAssessment): Promise<SackQualityAssessment> {
    const now = new Date();
    const assessmentWithDate = {
      ...assessment,
      inspectionDate: now
    };
    const [qualityAssessment] = await db.insert(sackQualityAssessments).values(assessmentWithDate).returning();
    return qualityAssessment;
  }
  
  async listSackQualityAssessments(sackId: number): Promise<SackQualityAssessment[]> {
    return await db
      .select()
      .from(sackQualityAssessments)
      .where(eq(sackQualityAssessments.sackId, sackId))
      .orderBy(desc(sackQualityAssessments.inspectionDate));
  }
  
  async getLatestSackQualityAssessment(sackId: number): Promise<SackQualityAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(sackQualityAssessments)
      .where(eq(sackQualityAssessments.sackId, sackId))
      .orderBy(desc(sackQualityAssessments.inspectionDate))
      .limit(1);
    return assessment || undefined;
  }
}

// Use the database storage implementation
// Changed from MemStorage to DatabaseStorage for permanent storage
export const storage = new DatabaseStorage();
