/**
 * Payment Gateway Integration
 * 
 * This module handles integration with various payment gateways for TradeWiser
 * financial transactions such as loan repayments, transaction fees, and premium services.
 * 
 * Supported payment methods:
 * - Unified Payments Interface (UPI)
 * - Credit/Debit Cards
 * - Net Banking
 * - Wallet (PayTM, PhonePe, etc.)
 */

import { apiRequest } from "./queryClient";

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';
export type PaymentGateway = 'razorpay' | 'paytm' | 'stripe';

export interface PaymentDetails {
  amount: number;
  currency?: string;
  description: string;
  referenceId: string;
  metadata?: Record<string, any>;
  paymentMethod?: PaymentMethod;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayReference?: string;
  paymentMethod?: PaymentMethod;
  timestamp?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  errorMessage?: string;
}

/**
 * Initialize payment gateway for the session
 * @param gateway Preferred payment gateway
 * @returns Success status and gateway information
 */
export async function initializePaymentGateway(
  gateway: PaymentGateway = 'razorpay'
): Promise<{ initialized: boolean; gateway: PaymentGateway; merchantId: string }> {
  try {
    const response = await apiRequest(
      "GET", 
      `/api/payment/initialize?gateway=${gateway}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to initialize payment gateway: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to initialize payment gateway:", error);
    throw error;
  }
}

/**
 * Create a payment request
 * @param paymentDetails Payment details and customer information
 * @returns Payment response with gateway information
 */
export async function createPayment(
  paymentDetails: PaymentDetails
): Promise<PaymentResponse> {
  try {
    const response = await apiRequest(
      "POST", 
      `/api/payment/create`, 
      paymentDetails
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        errorMessage: errorData.message || `Payment failed with status: ${response.status}`
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Payment creation error:", error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown payment error"
    };
  }
}

/**
 * Verify payment status
 * @param transactionId Transaction ID to verify
 * @returns Payment verification result
 */
export async function verifyPayment(transactionId: string): Promise<PaymentResponse> {
  try {
    const response = await apiRequest(
      "GET", 
      `/api/payment/verify/${transactionId}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        errorMessage: errorData.message || `Verification failed with status: ${response.status}`
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown verification error"
    };
  }
}

/**
 * Process loan repayment
 * @param loanId Loan ID
 * @param amount Repayment amount
 * @param paymentMethod Payment method
 * @returns Payment response
 */
export async function processLoanRepayment(
  loanId: number,
  amount: number,
  paymentMethod: PaymentMethod = 'upi'
): Promise<PaymentResponse> {
  try {
    const response = await apiRequest(
      "POST", 
      `/api/loans/${loanId}/repay`, 
      { amount, paymentMethod }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        errorMessage: errorData.message || `Loan repayment failed with status: ${response.status}`
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Loan repayment error:", error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown loan repayment error"
    };
  }
}

/**
 * Process premium service payment
 * @param serviceId Service ID
 * @param amount Payment amount
 * @param paymentMethod Payment method
 * @returns Payment response
 */
export async function processPremiumServicePayment(
  serviceId: string,
  amount: number,
  paymentMethod: PaymentMethod = 'card'
): Promise<PaymentResponse> {
  // For premium services, we use the generic payment creation endpoint
  return createPayment({
    amount,
    description: `Premium Service: ${serviceId}`,
    referenceId: serviceId,
    paymentMethod,
    metadata: {
      type: 'premium_service',
      serviceId
    }
  });
}

/**
 * Get available payment methods
 * @returns List of available payment methods
 */
export async function getAvailablePaymentMethods(): Promise<Array<{
  id: PaymentMethod;
  name: string;
  description: string;
  enabled: boolean;
}>> {
  try {
    const response = await apiRequest("GET", "/api/payment/methods");
    
    if (!response.ok) {
      throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch payment methods:", error);
    // Return default payment methods if API fails
    return [
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay using UPI (Google Pay, PhonePe, etc.)',
        enabled: true
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay using credit or debit card',
        enabled: true
      }
    ];
  }
}