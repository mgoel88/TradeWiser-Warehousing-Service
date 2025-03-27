import { storage } from "../storage";
import type { InsertWarehouseReceipt } from "@shared/schema";

/**
 * Service for warehouse receipt operations
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
    return `0x${timestamp.toString(16)}${randomStr}`;
  }

  /**
   * Creates a new warehouse receipt from client data
   */
  async createReceipt(data: any, userId: number) {
    try {
      console.log("ReceiptService: Creating receipt with data", JSON.stringify(data, null, 2));
      
      // Calculate expiry date (6 months from now)
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      // Parse metadata if it's a string
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.warn("Failed to parse metadata JSON:", e);
        }
      }
      
      // Parse quality parameters if it's a string
      let qualityParameters = data.qualityParameters;
      if (typeof qualityParameters === 'string') {
        try {
          qualityParameters = JSON.parse(qualityParameters);
        } catch (e) {
          console.warn("Failed to parse qualityParameters JSON:", e);
        }
      }
      
      // Prepare the receipt data with proper types
      const receiptData: Partial<InsertWarehouseReceipt> = {
        // Required fields with defaults if not provided
        receiptNumber: data.receiptNumber || this.generateReceiptNumber(),
        depositorKycId: data.depositorKycId || `KYC${userId}${Date.now().toString(16).slice(-6)}`,
        warehouseLicenseNo: data.warehouseLicenseNo || `WL-${data.warehouseId}-${new Date().getFullYear()}`,
        
        // Convert numeric values to strings as required
        quantity: String(data.quantity),
        
        // Foreign keys
        commodityId: data.commodityId,
        warehouseId: data.warehouseId,
        ownerId: userId,
        
        // Status is a typed enum
        status: "active",
        
        // Optional fields
        blockchainHash: data.blockchainHash || this.generateBlockchainHash(),
        expiryDate,
        valuation: data.valuation ? String(data.valuation) : undefined,
        
        // Additional data fields
        commodityName: data.commodityName,
        qualityGrade: data.qualityGrade,
        warehouseName: data.warehouseName,
        warehouseAddress: data.warehouseAddress,
        
        // JSON fields
        qualityParameters,
        metadata
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