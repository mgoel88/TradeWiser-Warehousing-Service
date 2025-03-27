import { storage } from "../storage";
import type { InsertWarehouseReceipt } from "@shared/schema";

/**
 * Service for warehouse receipt operations - Simplified to match database schema
 */
export class ReceiptService {
  /**
   * Generates a receipt number
   */
  generateReceiptNumber(): string {
    const timestamp = Date.now().toString(16).slice(-8).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `WR${timestamp}${random}`;
  }

  /**
   * Generates a blockchain hash (mock)
   */
  generateBlockchainHash(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `${timestamp.toString(16)}${randomStr}`;
  }

  /**
   * Creates a new warehouse receipt from client data - Simplified for actual database schema
   */
  async createReceipt(data: any, userId: number) {
    try {
      console.log("ReceiptService: Creating receipt with data", JSON.stringify(data, null, 2));
      
      // Calculate expiry date (6 months from now)
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      // Generate a verification code for QR scanning
      const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Store all additional metadata in the liens field as a JSON object
      // This allows us to handle fields that don't exist in the actual database schema
      const liensData: Record<string, any> = {
        // Add verification code for QR scanning and public verification
        verificationCode,
        
        // Store process info if available
        processId: data.processId || null,
        
        // Store dates for reference
        depositDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        
        // Store commodity details that aren't in the main receipt table
        commodityName: data.commodityName || null,
        qualityGrade: data.qualityGrade || 'Standard',
        qualityParameters: data.qualityParameters || null,
        
        // Store warehouse details that aren't in the main receipt table
        warehouseName: data.warehouseName || null,
        warehouseAddress: data.warehouseAddress || null,
        
        // Transfer any metadata field if it exists
        ...(data.metadata || {})
      };
      
      // If client sent liens data, merge it with our generated data
      if (data.liens && typeof data.liens === 'object') {
        Object.assign(liensData, data.liens);
      }
      
      // Prepare the receipt data with only fields that exist in the database
      const receiptData: Partial<InsertWarehouseReceipt> = {
        // Required fields
        receiptNumber: data.receiptNumber || this.generateReceiptNumber(),
        quantity: String(data.quantity || "0"),
        
        // Foreign keys
        commodityId: data.commodityId,
        warehouseId: data.warehouseId,
        ownerId: userId,
        
        // Status is a typed enum
        status: "active",
        
        // Optional fields that exist in the database
        blockchainHash: data.blockchainHash || this.generateBlockchainHash(),
        expiryDate,
        valuation: data.valuation ? String(data.valuation) : undefined,
        
        // Store all additional metadata in the liens field
        liens: liensData
      };
      
      console.log("ReceiptService: Prepared receipt data", JSON.stringify(receiptData, null, 2));
      
      // Create the receipt in storage
      const receipt = await storage.createWarehouseReceipt(receiptData as InsertWarehouseReceipt);
      
      console.log("ReceiptService: Receipt created successfully", receipt.id);
      
      return receipt;
    } catch (error) {
      console.error("ReceiptService: Error creating receipt", error);
      throw error;
    }
  }
}

export const receiptService = new ReceiptService();