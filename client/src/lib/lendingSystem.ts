/**
 * TradeWiser Lending System
 * 
 * This module provides functionality for warehouse receipt financing, connecting
 * to external lending APIs through a secure middleware, and managing the
 * credit assessment, underwriting, and loan disbursement processes.
 */

import { apiRequest } from "./queryClient";
import { ReceiptCollateral } from "./paymentGateway";

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

export interface LendingPartner {
  id: number;
  name: string;
  type: LendingPartnerType;
  interestRateRange: {
    min: number;
    max: number;
  };
  maxLoanAmount: number;
  minLoanAmount: number;
  maxTenureDays: number;
  creditRatingCriteria: CreditRating[];
  logoUrl?: string;
  description?: string;
}

export interface LoanOffer {
  partnerId: number;
  partnerName: string;
  interestRate: number;
  maxLoanAmount: number;
  maxTenureDays: number;
  processingFeePercentage: number;
  collateralRequired: number;
  termsAndConditionsUrl: string;
  estimatedProcessingTime: string;
}

export interface LoanApplication {
  userId: number;
  receiptIds: number[];
  lendingPartnerId: number;
  requestedAmount: number;
  requestedTenureDays: number;
  purpose: string;
  receiptCollaterals: ReceiptCollateral[];
  creditScore?: number;
  status: LoanStatus;
}

export interface BlockchainTransaction {
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  action: string;
  details: any;
}

export interface CollateralLockResult {
  success: boolean;
  transactionHash?: string;
  message?: string;
  receiptIds: number[];
  status: CollateralStatus;
}

export interface UnderwritingResult {
  approved: boolean;
  creditScore: number;
  creditRating: CreditRating;
  maxLoanAmount: number;
  recommendedInterestRate: number;
  riskAssessment: {
    commodityPriceRisk: number;
    creditRisk: number;
    operationalRisk: number;
    overallRisk: number;
  };
  reason?: string;
}

/**
 * Get available lending partners based on user profile and collateral value
 * @param userId User ID
 * @param collateralValue Total value of collateral
 * @returns List of lending partners
 */
export async function getLendingPartners(
  userId: number,
  collateralValue: number
): Promise<LendingPartner[]> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/partners?userId=${userId}&collateralValue=${collateralValue}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lending partners: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch lending partners:", error);
    return [];
  }
}

/**
 * Get loan offers from lending partners based on user's collateral
 * @param userId User ID
 * @param receiptIds Array of receipt IDs to use as collateral
 * @returns List of loan offers
 */
export async function getLoanOffers(
  userId: number,
  receiptIds: number[]
): Promise<LoanOffer[]> {
  try {
    const response = await apiRequest(
      "POST",
      `/api/lending/offers`,
      { userId, receiptIds }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loan offers: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch loan offers:", error);
    return [];
  }
}

/**
 * Submit a loan application
 * @param application Loan application details
 * @returns Application result with status
 */
export async function submitLoanApplication(
  application: LoanApplication
): Promise<{
  applicationId: number;
  status: LoanStatus;
  message: string;
  estimatedApprovalTime: string;
}> {
  try {
    const response = await apiRequest(
      "POST",
      `/api/lending/apply`,
      application
    );
    
    if (!response.ok) {
      throw new Error(`Failed to submit loan application: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to submit loan application:", error);
    throw error;
  }
}

/**
 * Lock collateral receipts for a loan
 * @param userId User ID
 * @param receiptIds Receipt IDs to lock as collateral
 * @param loanId Loan ID
 * @returns Collateral lock result with blockchain transaction details
 */
export async function lockCollateral(
  userId: number,
  receiptIds: number[],
  loanId: number
): Promise<CollateralLockResult> {
  try {
    const response = await apiRequest(
      "POST",
      `/api/lending/lock-collateral`,
      { userId, receiptIds, loanId }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to lock collateral: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to lock collateral:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error locking collateral",
      receiptIds,
      status: CollateralStatus.AVAILABLE
    };
  }
}

/**
 * Get loan details by ID
 * @param loanId Loan ID
 * @returns Loan details
 */
export async function getLoanDetails(
  loanId: number
): Promise<{
  loan: {
    id: number;
    userId: number;
    lendingPartnerId: number;
    lendingPartnerName: string;
    amount: number;
    outstandingAmount: number;
    interestRate: number;
    startDate: string;
    endDate: string;
    status: LoanStatus;
    collateralReceiptIds: number[];
    repaymentSchedule: Array<{
      dueDate: string;
      amount: number;
      status: 'paid' | 'upcoming' | 'overdue';
    }>;
  };
  collateral: ReceiptCollateral[];
  transactions: BlockchainTransaction[];
}> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/loans/${loanId}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loan details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch loan details:", error);
    throw error;
  }
}

/**
 * Run credit assessment and underwriting for a user and collateral combination
 * This simulates an API call to the middleware that connects to the lending partners
 * @param userId User ID
 * @param receiptIds Receipt IDs to use as collateral
 * @returns Underwriting result
 */
export async function runUnderwriting(
  userId: number,
  receiptIds: number[]
): Promise<UnderwritingResult> {
  try {
    const response = await apiRequest(
      "POST",
      `/api/lending/underwrite`,
      { userId, receiptIds }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to run underwriting: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to run underwriting:", error);
    throw error;
  }
}

/**
 * Fetch user's credit information and borrowing history
 * @param userId User ID
 * @returns Credit info and borrowing history
 */
export async function getCreditInfo(
  userId: number
): Promise<{
  creditScore: number;
  creditRating: CreditRating;
  borrowingHistory: Array<{
    loanId: number;
    lendingPartnerName: string;
    amount: number;
    startDate: string;
    endDate: string;
    status: LoanStatus;
    daysLate?: number;
  }>;
  recommendedLoanAmount: number;
}> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/credit-info/${userId}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credit info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch credit info:", error);
    throw error;
  }
}

/**
 * Get blockchain transaction history for a loan
 * @param loanId Loan ID
 * @returns Blockchain transaction history
 */
export async function getLoanBlockchainHistory(
  loanId: number
): Promise<BlockchainTransaction[]> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/blockchain-history/${loanId}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blockchain history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch blockchain history:", error);
    return [];
  }
}

/**
 * Get all active loans for a user
 * @param userId User ID
 * @returns List of active loans
 */
export async function getUserActiveLoans(
  userId: number
): Promise<Array<{
  id: number;
  lendingPartnerName: string;
  amount: number;
  outstandingAmount: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
}>> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/user/${userId}/active-loans`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch active loans: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch active loans:", error);
    return [];
  }
}

/**
 * Get available collateral for a user
 * @param userId User ID
 * @returns List of available collateral receipts
 */
export async function getAvailableCollateral(
  userId: number
): Promise<ReceiptCollateral[]> {
  try {
    const response = await apiRequest(
      "GET",
      `/api/lending/user/${userId}/available-collateral`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available collateral: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch available collateral:", error);
    return [];
  }
}