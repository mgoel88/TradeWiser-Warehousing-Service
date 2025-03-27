import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';

// Enum for payment status
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Enum for payment methods
export enum PaymentMethod {
  UPI = 'upi',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer'
}

// Payment interface
export interface Payment {
  id: string;
  userId: number;
  amount: string;
  description: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  referenceId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database for payments
const payments = new Map<string, Payment>();

/**
 * PaymentService provides methods for processing payments
 * This is a dummy implementation that can be replaced with actual banking APIs later
 */
export class PaymentService {
  /**
   * Get available payment methods
   */
  getPaymentMethods() {
    return [
      { 
        id: PaymentMethod.UPI, 
        name: 'UPI', 
        description: 'Pay using UPI apps like GPay, PhonePe, Paytm, etc.',
        icon: 'upi-icon' 
      },
      { 
        id: PaymentMethod.NETBANKING, 
        name: 'Net Banking', 
        description: 'Pay using internet banking',
        icon: 'netbanking-icon' 
      },
      { 
        id: PaymentMethod.WALLET, 
        name: 'Wallet', 
        description: 'Pay using digital wallets',
        icon: 'wallet-icon' 
      },
      { 
        id: PaymentMethod.CARD, 
        name: 'Credit/Debit Card', 
        description: 'Pay using credit or debit card',
        icon: 'card-icon' 
      },
      { 
        id: PaymentMethod.BANK_TRANSFER, 
        name: 'Bank Transfer', 
        description: 'Direct bank transfer',
        icon: 'bank-icon' 
      }
    ];
  }

  /**
   * Create a new payment
   */
  async createPayment(
    userId: number,
    amount: string,
    description: string,
    paymentMethod: PaymentMethod = PaymentMethod.UPI,
    referenceId?: string,
    metadata?: any
  ): Promise<Payment> {
    // Generate unique payment ID
    const paymentId = uuidv4();
    
    // In a real implementation, this would make API calls to payment gateway
    const payment: Payment = {
      id: paymentId,
      userId,
      amount,
      description,
      status: PaymentStatus.PENDING,
      paymentMethod,
      referenceId,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store payment in mock database
    payments.set(paymentId, payment);

    // In a production system, this would make an actual API call
    // and handle the response accordingly

    // For demo purposes, randomly succeed or fail the payment
    // In a real implementation, this would depend on the bank API response
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        this.updatePaymentStatus(paymentId, PaymentStatus.COMPLETED);
      } else {
        this.updatePaymentStatus(paymentId, PaymentStatus.FAILED);
      }
    }, 3000); // Simulate 3 second processing time

    return payment;
  }

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): Payment | undefined {
    return payments.get(paymentId);
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(paymentId: string, status: PaymentStatus): Payment | undefined {
    const payment = payments.get(paymentId);
    if (!payment) return undefined;

    payment.status = status;
    payment.updatedAt = new Date();
    payments.set(paymentId, payment);
    
    return payment;
  }

  /**
   * Process loan repayment
   */
  async processLoanRepayment(
    userId: number,
    loanId: number,
    amount: string,
    paymentMethod: PaymentMethod = PaymentMethod.UPI
  ): Promise<{ payment: Payment, success: boolean }> {
    // Get loan details
    const loan = await storage.getLoan(loanId);
    if (!loan) {
      throw new Error("Loan not found");
    }

    // Create payment
    const payment = await this.createPayment(
      userId,
      amount,
      `Loan repayment for Loan #${loanId}`,
      paymentMethod,
      `loan_${loanId}`,
      { loanId }
    );

    // In a real implementation, this would wait for payment confirmation
    // For demo purposes, assume payment is successful immediately
    const updatedPayment = this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
    
    // Update loan status
    const outstandingAmount = parseFloat(loan.outstandingAmount || loan.amount);
    const repaymentAmount = parseFloat(amount);
    
    if (repaymentAmount >= outstandingAmount) {
      // Full repayment
      await storage.updateLoan(loanId, {
        status: 'repaid',
        outstandingAmount: '0'
      });
    } else {
      // Partial repayment
      const newOutstandingAmount = (outstandingAmount - repaymentAmount).toString();
      await storage.updateLoan(loanId, {
        outstandingAmount: newOutstandingAmount
      });
    }

    return { 
      payment: updatedPayment!, 
      success: updatedPayment!.status === PaymentStatus.COMPLETED 
    };
  }

  /**
   * Pay warehouse storage fees
   */
  async payWarehouseFees(
    userId: number,
    warehouseId: number,
    amount: string,
    paymentMethod: PaymentMethod = PaymentMethod.UPI
  ): Promise<{ payment: Payment, success: boolean }> {
    // Get warehouse details
    const warehouse = await storage.getWarehouse(warehouseId);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    // Create payment
    const payment = await this.createPayment(
      userId,
      amount,
      `Storage fees for ${warehouse.name}`,
      paymentMethod,
      `warehouse_${warehouseId}`,
      { warehouseId }
    );

    // For demo purposes, assume payment is successful immediately
    const updatedPayment = this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
    
    return { 
      payment: updatedPayment!, 
      success: updatedPayment!.status === PaymentStatus.COMPLETED 
    };
  }

  /**
   * Process commodity ownership transfer payment
   */
  async processTransferPayment(
    userId: number,
    commodityId: number,
    amount: string,
    paymentMethod: PaymentMethod = PaymentMethod.UPI
  ): Promise<{ payment: Payment, success: boolean }> {
    // Get commodity details
    const commodity = await storage.getCommodity(commodityId);
    if (!commodity) {
      throw new Error("Commodity not found");
    }

    // Create payment
    const payment = await this.createPayment(
      userId,
      amount,
      `Transfer payment for ${commodity.name}`,
      paymentMethod,
      `commodity_${commodityId}`,
      { commodityId }
    );

    // For demo purposes, assume payment is successful immediately
    const updatedPayment = this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
    
    return { 
      payment: updatedPayment!, 
      success: updatedPayment!.status === PaymentStatus.COMPLETED 
    };
  }

  /**
   * Get payment history for a user
   */
  getUserPayments(userId: number): Payment[] {
    return Array.from(payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Verify a payment
   */
  verifyPayment(paymentId: string): { 
    verified: boolean, 
    status: PaymentStatus,
    details?: any
  } {
    const payment = payments.get(paymentId);
    if (!payment) {
      return {
        verified: false,
        status: PaymentStatus.FAILED,
        details: { error: "Payment not found" }
      };
    }

    return {
      verified: payment.status === PaymentStatus.COMPLETED,
      status: payment.status,
      details: {
        amount: payment.amount,
        method: payment.paymentMethod,
        description: payment.description,
        timestamp: payment.updatedAt
      }
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();