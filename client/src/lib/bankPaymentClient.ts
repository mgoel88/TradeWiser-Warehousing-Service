import { apiRequest } from "@/lib/queryClient";

// Bank type enumeration
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

// Payment method enumeration
export enum BankPaymentMethod {
  NEFT = 'neft',
  RTGS = 'rtgs',
  IMPS = 'imps',
  UPI = 'upi',
  NETBANKING = 'netbanking'
}

// Payment status enumeration
export enum BankPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Bank details for display
export interface Bank {
  id: BankType;
  name: string;
  supportedMethods: {
    id: BankPaymentMethod;
    name: string;
    minAmount: number;
    maxAmount: number;
  }[];
}

// Request for creating a payment
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

// Response from payment API
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

// Bank account verification result
export interface BankVerificationResult {
  isVerified: boolean;
  accountExists: boolean;
  accountName?: string;
  bankName?: string;
  branch?: string;
  message?: string;
}

// Bank payment client class
class BankPaymentClient {
  /**
   * Get a list of supported banks and payment methods
   */
  async getSupportedBanks(): Promise<Bank[]> {
    const response = await apiRequest('GET', '/api/bank/supported-banks');
    const data = await response.json();
    return data;
  }
  
  /**
   * Create a bank payment
   * @param paymentRequest Payment request details
   */
  async createPayment(paymentRequest: BankPaymentRequest): Promise<BankPayment> {
    const response = await apiRequest('POST', '/api/bank/payment', paymentRequest);
    const data = await response.json();
    return data;
  }
  
  /**
   * Get payment details by transaction ID
   * @param transactionId Transaction ID
   */
  async getPayment(transactionId: string): Promise<BankPayment> {
    const response = await apiRequest('GET', `/api/bank/payment/${transactionId}`);
    const data = await response.json();
    return data;
  }
  
  /**
   * Verify bank account details
   * @param accountNumber Account number
   * @param ifscCode IFSC code
   */
  async verifyBankAccount(accountNumber: string, ifscCode: string): Promise<BankVerificationResult> {
    const response = await apiRequest('POST', '/api/bank/verify-account', {
      accountNumber,
      ifscCode
    });
    const data = await response.json();
    return data;
  }
  
  /**
   * Verify UPI ID
   * @param upiId UPI ID to verify
   */
  async verifyUpiId(upiId: string): Promise<BankVerificationResult> {
    const response = await apiRequest('POST', '/api/bank/verify-upi', {
      upiId
    });
    const data = await response.json();
    return data;
  }
  
  /**
   * Create a loan repayment
   * @param loanId Loan ID
   * @param amount Amount to repay
   * @param transactionId Bank payment transaction ID
   */
  async createLoanRepayment(loanId: number, amount: string, transactionId: string): Promise<any> {
    const response = await apiRequest('POST', '/api/bank/loan-repayment', {
      loanId,
      amount,
      transactionId
    });
    const data = await response.json();
    return data;
  }
}

export const bankPaymentClient = new BankPaymentClient();