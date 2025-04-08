/**
 * Bank Payment Service
 * 
 * This service simulates interactions with banking APIs for payments and transfers.
 * In a production environment, this would connect to real banking APIs.
 */

// Enumerations for bank payment types
export enum BankType {
  SBI = 'sbi',
  HDFC = 'hdfc',
  ICICI = 'icici',
  AXIS = 'axis',
  PNB = 'pnb',
  BOB = 'bob',
  KOTAK = 'kotak',
  RBI = 'rbi'
}

export enum BankPaymentMethod {
  NEFT = 'neft',
  RTGS = 'rtgs',
  IMPS = 'imps',
  UPI = 'upi',
  NETBANKING = 'netbanking'
}

export enum BankPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Interfaces
export interface SupportedBank {
  id: BankType;
  name: string;
  supportedMethods: {
    id: BankPaymentMethod;
    name: string;
    minAmount: number;
    maxAmount: number;
  }[];
}

export interface BankPaymentRequest {
  amount: string;
  currency?: string;
  description: string;
  paymentMethod: BankPaymentMethod;
  bankType: BankType;
  metadata?: Record<string, any>;
  customerInfo: {
    name: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    email?: string;
    phone?: string;
  };
  receiverInfo: {
    name: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

export interface BankPayment {
  transactionId: string;
  referenceNumber: string;
  bankTransactionId?: string;
  amount: string;
  currency: string;
  description: string;
  status: BankPaymentStatus;
  paymentMethod: BankPaymentMethod;
  bankType: BankType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  customerInfo: {
    name: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    email?: string;
    phone?: string;
  };
  receiverInfo: {
    name: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

export interface BankVerificationResult {
  isVerified: boolean;
  accountExists: boolean;
  accountName?: string;
  bankName?: string;
  branch?: string;
  message?: string;
}

class BankPaymentService {
  private payments: Map<string, BankPayment> = new Map();
  private supportedBanks: SupportedBank[] = [];
  private readonly TRANSACTION_SUCCESS_RATE = 0.8; // 80% success rate for simulated transactions
  
  constructor() {
    this.initializeSupportedBanks();
  }
  
  /**
   * Initialize supported banks and payment methods data
   */
  private initializeSupportedBanks() {
    this.supportedBanks = [
      {
        id: BankType.SBI,
        name: 'State Bank of India',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 500000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 }
        ]
      },
      {
        id: BankType.HDFC,
        name: 'HDFC Bank',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 500000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 },
          { id: BankPaymentMethod.NETBANKING, name: 'Net Banking', minAmount: 1, maxAmount: 1000000 }
        ]
      },
      {
        id: BankType.ICICI,
        name: 'ICICI Bank',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 500000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 }
        ]
      },
      {
        id: BankType.AXIS,
        name: 'Axis Bank',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 500000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 }
        ]
      },
      {
        id: BankType.PNB,
        name: 'Punjab National Bank',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 200000 }
        ]
      },
      {
        id: BankType.BOB,
        name: 'Bank of Baroda',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 300000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 }
        ]
      },
      {
        id: BankType.KOTAK,
        name: 'Kotak Mahindra Bank',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 1000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 5000000 },
          { id: BankPaymentMethod.IMPS, name: 'IMPS Transfer', minAmount: 1, maxAmount: 400000 },
          { id: BankPaymentMethod.UPI, name: 'UPI Payment', minAmount: 1, maxAmount: 100000 }
        ]
      },
      {
        id: BankType.RBI,
        name: 'Reserve Bank of India',
        supportedMethods: [
          { id: BankPaymentMethod.NEFT, name: 'NEFT Transfer', minAmount: 1, maxAmount: 10000000 },
          { id: BankPaymentMethod.RTGS, name: 'RTGS Transfer', minAmount: 200000, maxAmount: 50000000 }
        ]
      }
    ];
  }
  
  /**
   * Get a list of supported banks and payment methods
   */
  getSupportedBanks(): SupportedBank[] {
    return this.supportedBanks;
  }
  
  /**
   * Create a new bank payment
   * @param paymentRequest Payment request details
   */
  async createPayment(paymentRequest: BankPaymentRequest): Promise<BankPayment> {
    // Validate payment method against bank
    const bank = this.supportedBanks.find(b => b.id === paymentRequest.bankType);
    if (!bank) {
      throw new Error(`Bank ${paymentRequest.bankType} is not supported`);
    }
    
    const supportedMethod = bank.supportedMethods.find(m => m.id === paymentRequest.paymentMethod);
    if (!supportedMethod) {
      throw new Error(`Payment method ${paymentRequest.paymentMethod} is not supported by ${bank.name}`);
    }
    
    // Validate amount
    const amount = parseFloat(paymentRequest.amount);
    if (isNaN(amount)) {
      throw new Error('Invalid amount');
    }
    
    if (amount < supportedMethod.minAmount || amount > supportedMethod.maxAmount) {
      throw new Error(`Amount out of range. Must be between ${supportedMethod.minAmount} and ${supportedMethod.maxAmount}`);
    }
    
    // Create transaction ID
    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();
    
    // Create payment record
    const payment: BankPayment = {
      transactionId,
      referenceNumber,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || 'INR',
      description: paymentRequest.description,
      status: BankPaymentStatus.PENDING,
      paymentMethod: paymentRequest.paymentMethod,
      bankType: paymentRequest.bankType,
      metadata: paymentRequest.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerInfo: paymentRequest.customerInfo,
      receiverInfo: paymentRequest.receiverInfo
    };
    
    // Store payment
    this.payments.set(transactionId, payment);
    
    // Process payment (simulated)
    await this.processPayment(transactionId);
    
    // Return updated payment
    const processedPayment = this.payments.get(transactionId);
    if (!processedPayment) {
      throw new Error('Failed to process payment');
    }
    
    return processedPayment;
  }
  
  /**
   * Process a payment (simulate bank API interaction)
   * @param transactionId Transaction ID to process
   */
  private async processPayment(transactionId: string): Promise<void> {
    const payment = this.payments.get(transactionId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    // Update status to processing
    payment.status = BankPaymentStatus.PROCESSING;
    payment.updatedAt = new Date();
    this.payments.set(transactionId, payment);
    
    // Simulate processing delay (1-3 seconds)
    const processingTime = Math.floor(Math.random() * 2000) + 1000;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success/failure based on success rate
        const isSuccess = Math.random() < this.TRANSACTION_SUCCESS_RATE;
        
        if (isSuccess) {
          payment.status = BankPaymentStatus.COMPLETED;
          payment.completedAt = new Date();
          payment.bankTransactionId = this.generateBankTransactionId(payment.bankType);
        } else {
          payment.status = BankPaymentStatus.FAILED;
        }
        
        payment.updatedAt = new Date();
        this.payments.set(transactionId, payment);
        
        resolve();
      }, processingTime);
    });
  }
  
  /**
   * Get payment details by transaction ID
   * @param transactionId Transaction ID
   */
  getPayment(transactionId: string): BankPayment | undefined {
    return this.payments.get(transactionId);
  }
  
  /**
   * Verify bank account details (simulated)
   * @param accountNumber Account number
   * @param ifscCode IFSC code
   */
  async verifyBankAccount(accountNumber: string, ifscCode: string): Promise<BankVerificationResult> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract bank code from IFSC
    const bankCode = ifscCode.substring(0, 4).toUpperCase();
    const bankMap: Record<string, string> = {
      'SBIN': 'State Bank of India',
      'HDFC': 'HDFC Bank',
      'ICIC': 'ICICI Bank',
      'UTIB': 'Axis Bank',
      'PUNB': 'Punjab National Bank',
      'BARB': 'Bank of Baroda',
      'KKBK': 'Kotak Mahindra Bank'
    };
    
    // Validate IFSC code format (first 4 chars are bank code, 5th is 0, last 6 are branch code)
    const isValidIFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode);
    
    // Simulate validation (80% success rate for valid format)
    const isSuccess = isValidIFSC && Math.random() < 0.8;
    
    if (!isValidIFSC) {
      return {
        isVerified: false,
        accountExists: false,
        message: 'Invalid IFSC code format'
      };
    }
    
    if (!bankMap[bankCode]) {
      return {
        isVerified: false,
        accountExists: false,
        message: 'Unknown bank code'
      };
    }
    
    if (!isSuccess) {
      return {
        isVerified: false,
        accountExists: true,
        bankName: bankMap[bankCode],
        message: 'Account verification failed'
      };
    }
    
    // Generate random branch name for simulation
    const branchNames = ['Main Branch', 'City Center', 'Andheri', 'Connaught Place', 'Salt Lake', 'MG Road', 'Satellite'];
    const randomBranch = branchNames[Math.floor(Math.random() * branchNames.length)];
    
    return {
      isVerified: true,
      accountExists: true,
      accountName: `Verified Account Holder (${accountNumber.slice(-4)})`,
      bankName: bankMap[bankCode],
      branch: randomBranch
    };
  }
  
  /**
   * Verify UPI ID (simulated)
   * @param upiId UPI ID to verify
   */
  async verifyUpiId(upiId: string): Promise<BankVerificationResult> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Validate UPI ID format (username@provider)
    const isValidUpi = /^[a-zA-Z0-9.]{3,}@[a-zA-Z]{3,}$/i.test(upiId);
    
    // Simulate validation (80% success rate for valid format)
    const isSuccess = isValidUpi && Math.random() < 0.8;
    
    if (!isValidUpi) {
      return {
        isVerified: false,
        accountExists: false,
        message: 'Invalid UPI ID format'
      };
    }
    
    if (!isSuccess) {
      return {
        isVerified: false,
        accountExists: true,
        message: 'UPI verification failed'
      };
    }
    
    // Extract provider for bank name
    const provider = upiId.split('@')[1].toLowerCase();
    const providerMap: Record<string, string> = {
      'sbi': 'State Bank of India',
      'hdfc': 'HDFC Bank',
      'icici': 'ICICI Bank',
      'axis': 'Axis Bank',
      'pnb': 'Punjab National Bank',
      'bob': 'Bank of Baroda',
      'kotak': 'Kotak Mahindra Bank',
      'paytm': 'Paytm Payments Bank',
      'ybl': 'Yes Bank',
      'okicici': 'ICICI Bank',
      'oksbi': 'State Bank of India'
    };
    
    const bankName = providerMap[provider] || 'UPI Enabled Bank';
    
    return {
      isVerified: true,
      accountExists: true,
      accountName: `Verified UPI User (${upiId.split('@')[0]})`,
      bankName
    };
  }
  
  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TW${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Generate a reference number for user display
   */
  private generateReferenceNumber(): string {
    return `REF${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
  }
  
  /**
   * Generate a simulated bank transaction ID
   */
  private generateBankTransactionId(bankType: BankType): string {
    const bankPrefixes: Record<BankType, string> = {
      [BankType.SBI]: 'SBIN',
      [BankType.HDFC]: 'HDFC',
      [BankType.ICICI]: 'ICIC',
      [BankType.AXIS]: 'AXIS',
      [BankType.PNB]: 'PUNB',
      [BankType.BOB]: 'BARB',
      [BankType.KOTAK]: 'KKBK',
      [BankType.RBI]: 'RBIS'
    };
    
    const prefix = bankPrefixes[bankType] || 'BANK';
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }
}

// Create a singleton instance
export const bankPaymentService = new BankPaymentService();