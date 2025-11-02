/**
 * LendingMiddleware Service
 * 
 * This service acts as a middleware between the TradeWiser platform and external lending partners.
 * It handles communication with various banks and NBFCs, providing unified APIs for loan offers,
 * applications, credit assessment, and disbursements.
 */

import axios from 'axios';
import { storage } from '../storage';
import { CreditRating, LendingPartner, LendingPartnerType, LoanStatus } from '../../shared/schema';

// Adapter interfaces for different lending partner APIs
interface LendingPartnerAdapter {
  getLoanOffers(userId: number, collateralData: any): Promise<any>;
  submitApplication(application: any): Promise<any>;
  checkApplicationStatus(applicationId: string): Promise<any>;
  disburseLoan(applicationId: string): Promise<any>;
  repayLoan(loanId: string, amount: number): Promise<any>;
}

// Mock adapters for demonstration (in production, these would connect to real bank APIs)
class BankAdapter implements LendingPartnerAdapter {
  private bankApiUrl: string;
  private apiKey: string;
  private partnerId: number;

  constructor(bankApiUrl: string, apiKey: string, partnerId: number) {
    this.bankApiUrl = bankApiUrl;
    this.apiKey = apiKey;
    this.partnerId = partnerId;
  }

  async getLoanOffers(userId: number, collateralData: any): Promise<any> {
    // In a real implementation, this would make an API call to the bank's system
    // For now, we'll simulate a response
    
    const partner = await storage.getLendingPartner(this.partnerId);
    if (!partner) {
      throw new Error('Lending partner not found');
    }
    
    const userCreditInfo = await storage.getUserCreditInfo(userId);
    const totalCollateralValue = collateralData.receipts.reduce(
      (sum: number, receipt: any) => sum + receipt.valuation, 0
    );
    
    // Calculate loan offer based on partner's terms and user's credit info
    const maxLoanAmount = Math.min(
      totalCollateralValue * 0.8, // 80% of collateral value
      partner.maxLoanAmount
    );
    
    // Adjust interest rate based on credit score
    let interestRate = partner.interestRateRange.min;
    if (userCreditInfo.creditScore < 700) {
      interestRate = partner.interestRateRange.min + 
        (partner.interestRateRange.max - partner.interestRateRange.min) * 
        (1 - userCreditInfo.creditScore / 700);
    }
    
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      interestRate,
      maxLoanAmount,
      maxTenureDays: partner.maxTenureDays,
      processingFeePercentage: 0.5, // Example processing fee
      collateralRequired: totalCollateralValue,
      termsAndConditionsUrl: 'https://example.com/terms',
      estimatedProcessingTime: '24 hours'
    };
  }

  async submitApplication(application: any): Promise<any> {
    // In a real implementation, this would submit the application to the bank's API
    // For now, we'll simulate a successful submission
    
    return {
      applicationId: `BANK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: LoanStatus.PENDING_APPROVAL,
      message: 'Application submitted successfully',
      estimatedApprovalTime: '24 hours'
    };
  }

  async checkApplicationStatus(applicationId: string): Promise<any> {
    // In a real implementation, this would check the status of the application with the bank
    // For now, we'll simulate a response
    
    return {
      applicationId,
      status: LoanStatus.APPROVED,
      updatedAt: new Date().toISOString()
    };
  }

  async disburseLoan(applicationId: string): Promise<any> {
    // In a real implementation, this would request disbursement from the bank
    // For now, we'll simulate a successful disbursement
    
    return {
      applicationId,
      loanId: `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'disbursed',
      disbursementDate: new Date().toISOString(),
      disbursementDetails: {
        accountNumber: 'XXXXXXXX1234',
        amount: 100000,
        transactionId: `TXN-${Date.now()}`
      }
    };
  }

  async repayLoan(loanId: string, amount: number): Promise<any> {
    // In a real implementation, this would process a loan repayment with the bank
    // For now, we'll simulate a successful repayment
    
    return {
      loanId,
      amountPaid: amount,
      status: 'success',
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      remainingBalance: 0, // Would be calculated in a real implementation
      paymentDate: new Date().toISOString()
    };
  }
}

class NBFCAdapter implements LendingPartnerAdapter {
  private nbfcApiUrl: string;
  private apiKey: string;
  private partnerId: number;

  constructor(nbfcApiUrl: string, apiKey: string, partnerId: number) {
    this.nbfcApiUrl = nbfcApiUrl;
    this.apiKey = apiKey;
    this.partnerId = partnerId;
  }

  async getLoanOffers(userId: number, collateralData: any): Promise<any> {
    // Similar to BankAdapter but with NBFC-specific logic
    const partner = await storage.getLendingPartner(this.partnerId);
    if (!partner) {
      throw new Error('Lending partner not found');
    }
    
    const userCreditInfo = await storage.getUserCreditInfo(userId);
    const totalCollateralValue = collateralData.receipts.reduce(
      (sum: number, receipt: any) => sum + receipt.valuation, 0
    );
    
    // NBFCs might offer higher loan amounts but at higher interest rates
    const maxLoanAmount = Math.min(
      totalCollateralValue * 0.7, // 70% of collateral value
      partner.maxLoanAmount
    );
    
    // NBFCs typically have higher interest rates
    let interestRate = partner.interestRateRange.min;
    if (userCreditInfo.creditScore < 650) {
      interestRate = partner.interestRateRange.min + 
        (partner.interestRateRange.max - partner.interestRateRange.min) * 
        (1 - userCreditInfo.creditScore / 650);
    }
    
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      interestRate,
      maxLoanAmount,
      maxTenureDays: partner.maxTenureDays,
      processingFeePercentage: 1.0, // Higher processing fee for NBFCs
      collateralRequired: totalCollateralValue,
      termsAndConditionsUrl: 'https://example.com/nbfc-terms',
      estimatedProcessingTime: '12 hours' // Might be faster than banks
    };
  }

  async submitApplication(application: any): Promise<any> {
    return {
      applicationId: `NBFC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: LoanStatus.PENDING_APPROVAL,
      message: 'Application submitted successfully',
      estimatedApprovalTime: '12 hours'
    };
  }

  async checkApplicationStatus(applicationId: string): Promise<any> {
    return {
      applicationId,
      status: LoanStatus.APPROVED,
      updatedAt: new Date().toISOString()
    };
  }

  async disburseLoan(applicationId: string): Promise<any> {
    return {
      applicationId,
      loanId: `NBFC-LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'disbursed',
      disbursementDate: new Date().toISOString(),
      disbursementDetails: {
        accountNumber: 'XXXXXXXX5678',
        amount: 100000,
        transactionId: `NBFC-TXN-${Date.now()}`
      }
    };
  }

  async repayLoan(loanId: string, amount: number): Promise<any> {
    return {
      loanId,
      amountPaid: amount,
      status: 'success',
      transactionId: `NBFC-TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      remainingBalance: 0,
      paymentDate: new Date().toISOString()
    };
  }
}

// Factory to create appropriate adapter for each lending partner
class LendingPartnerAdapterFactory {
  static createAdapter(partner: LendingPartner): LendingPartnerAdapter {
    // API configurations would come from a secure configuration store in production
    if (partner.type === LendingPartnerType.BANK) {
      return new BankAdapter(`https://api.${partner.name.toLowerCase()}.com`, 'mock-api-key', partner.id);
    } else if (partner.type === LendingPartnerType.NBFC) {
      return new NBFCAdapter(`https://api.${partner.name.toLowerCase()}.com`, 'mock-api-key', partner.id);
    } else {
      throw new Error(`Unsupported lending partner type: ${partner.type}`);
    }
  }
}

// Main middleware service
export class LendingMiddleware {
  private adapters: Map<number, LendingPartnerAdapter> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  private async initializeAdapters() {
    try {
      const partners = await storage.listLendingPartners();
      for (const partner of partners) {
        this.adapters.set(partner.id, LendingPartnerAdapterFactory.createAdapter(partner));
      }
    } catch (error) {
      console.error('Failed to initialize lending partner adapters:', error);
    }
  }

  private getAdapter(partnerId: number): LendingPartnerAdapter {
    const adapter = this.adapters.get(partnerId);
    if (!adapter) {
      throw new Error(`No adapter found for lending partner ID: ${partnerId}`);
    }
    return adapter;
  }

  async getInitialLoanOffers(userId: number, collateralData: any): Promise<any[]> {
    try {
      const partners = await storage.listLendingPartners();
      const offers = [];
      
      for (const partner of partners) {
        try {
          const adapter = this.getAdapter(partner.id);
          const offer = await adapter.getLoanOffers(userId, collateralData);
          offers.push(offer);
        } catch (error) {
          console.error(`Failed to get loan offer from partner ${partner.id}:`, error);
          // Continue with other partners
        }
      }
      
      return offers;
    } catch (error) {
      console.error('Failed to get initial loan offers:', error);
      throw error;
    }
  }

  async submitLoanApplication(partnerId: number, application: any): Promise<any> {
    try {
      const adapter = this.getAdapter(partnerId);
      return await adapter.submitApplication(application);
    } catch (error) {
      console.error(`Failed to submit loan application to partner ${partnerId}:`, error);
      throw error;
    }
  }

  async checkApplicationStatus(partnerId: number, applicationId: string): Promise<any> {
    try {
      const adapter = this.getAdapter(partnerId);
      return await adapter.checkApplicationStatus(applicationId);
    } catch (error) {
      console.error(`Failed to check loan application status with partner ${partnerId}:`, error);
      throw error;
    }
  }

  async disburseLoan(partnerId: number, applicationId: string): Promise<any> {
    try {
      const adapter = this.getAdapter(partnerId);
      return await adapter.disburseLoan(applicationId);
    } catch (error) {
      console.error(`Failed to disburse loan with partner ${partnerId}:`, error);
      throw error;
    }
  }

  async repayLoan(partnerId: number, loanId: string, amount: number): Promise<any> {
    try {
      const adapter = this.getAdapter(partnerId);
      return await adapter.repayLoan(loanId, amount);
    } catch (error) {
      console.error(`Failed to process loan repayment with partner ${partnerId}:`, error);
      throw error;
    }
  }

  // Underwriting service that aggregates credit assessment from multiple sources
  async performUnderwriting(userId: number, collateralData: any): Promise<any> {
    try {
      // In a real implementation, this would combine:
      // 1. Internal credit assessment (transaction history, past loans)
      // 2. External credit bureau data
      // 3. Collateral valuation
      // 4. Market risk assessment
      
      const userCreditInfo = await storage.getUserCreditInfo(userId);
      
      // Calculate aggregate credit score (0-900 scale)
      const creditScore = userCreditInfo.creditScore;
      
      // Determine credit rating
      let creditRating: CreditRating;
      if (creditScore >= 800) creditRating = CreditRating.AAA;
      else if (creditScore >= 750) creditRating = CreditRating.AA;
      else if (creditScore >= 700) creditRating = CreditRating.A;
      else if (creditScore >= 650) creditRating = CreditRating.BBB;
      else if (creditScore >= 600) creditRating = CreditRating.BB;
      else if (creditScore >= 550) creditRating = CreditRating.B;
      else if (creditScore >= 500) creditRating = CreditRating.C;
      else creditRating = CreditRating.D;
      
      // Calculate risk scores
      const totalCollateralValue = collateralData.receipts.reduce(
        (sum: number, receipt: any) => sum + receipt.valuation, 0
      );
      
      const commodityPriceRisk = 0.3; // Example risk value (0-1)
      const creditRisk = 1 - (creditScore / 900);
      const operationalRisk = 0.2; // Example risk value (0-1)
      
      // Overall risk is a weighted average
      const overallRisk = (
        (commodityPriceRisk * 0.4) + 
        (creditRisk * 0.4) + 
        (operationalRisk * 0.2)
      );
      
      // Determine if application should be approved based on risk thresholds
      const approved = overallRisk < 0.5 && creditScore >= 600;
      
      // Calculate recommended loan amount (up to 80% of collateral for good credit)
      const maxLoanPercentage = Math.max(0.5, 0.8 - (overallRisk * 0.3));
      const recommendedLoanAmount = totalCollateralValue * maxLoanPercentage;
      
      // Calculate recommended interest rate based on risk
      const baseRate = 0.08; // 8% base rate
      const riskPremium = overallRisk * 0.12; // Up to 12% risk premium
      const recommendedInterestRate = baseRate + riskPremium;
      
      return {
        approved,
        creditScore,
        creditRating,
        maxLoanAmount: recommendedLoanAmount,
        recommendedInterestRate,
        riskAssessment: {
          commodityPriceRisk,
          creditRisk,
          operationalRisk,
          overallRisk
        },
        reason: approved ? 'Application meets credit criteria' : 'Application does not meet minimum credit requirements'
      };
    } catch (error) {
      console.error('Failed to perform underwriting:', error);
      throw error;
    }
  }
}

// Singleton instance
export const lendingMiddleware = new LendingMiddleware();