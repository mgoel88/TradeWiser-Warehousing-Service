import { storage } from "../storage";
import type { InsertProcess, WarehouseReceipt } from "@shared/schema";

/**
 * Service for handling commodity withdrawal operations
 */
export class WithdrawalService {
  /**
   * Initiates a withdrawal process for a commodity
   * @param receiptId The ID of the receipt to withdraw from
   * @param userId The ID of the user initiating the withdrawal
   * @param quantity The quantity to withdraw (if not provided, full withdrawal)
   */
  async initiateWithdrawal(receiptId: number, userId: number, quantity?: string) {
    try {
      // Get the receipt to verify ownership and available quantity
      const receipt = await storage.getWarehouseReceipt(receiptId);
      
      if (!receipt) {
        throw new Error("Receipt not found");
      }
      
      if (receipt.ownerId !== userId) {
        throw new Error("Not authorized to withdraw this receipt");
      }
      
      if (receipt.status !== "active") {
        throw new Error(`Cannot withdraw receipt in '${receipt.status}' status`);
      }
      
      // Determine if this is a full or partial withdrawal
      const isFullWithdrawal = !quantity || quantity === receipt.quantity;
      
      // Get the original commodity details
      const commodity = await storage.getCommodity(receipt.commodityId!);
      const warehouse = await storage.getWarehouse(receipt.warehouseId!);
      
      if (!commodity || !warehouse) {
        throw new Error("Associated commodity or warehouse not found");
      }
      
      // Create a withdrawal process
      const processData: Partial<InsertProcess> = {
        processType: "withdrawal",
        userId,
        commodityId: receipt.commodityId || undefined,
        warehouseId: receipt.warehouseId || undefined,
        status: "pending",
        currentStage: "verification",
        estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        stageProgress: {
          verification: "pending",
          preparation: "pending",
          document_check: "pending",
          physical_release: "pending",
          quantity_confirmation: "pending",
          receipt_update: "pending"
        }
      };
      
      // Create the process
      const process = await storage.createProcess(processData);
      
      // Get the liens field as a properly typed object
      const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
        ? (receipt.liens as any) 
        : {};
      
      // Update receipt status to 'processing' during withdrawal
      await storage.updateWarehouseReceipt(receiptId, {
        status: "processing", 
        liens: {
          ...liens,
          withdrawalProcessId: process.id,
          withdrawalQuantity: quantity || receipt.quantity,
          withdrawalDate: new Date().toISOString(),
          isPartial: !isFullWithdrawal
        }
      });
      
      return { 
        process,
        receipt,
        isFullWithdrawal
      };
    } catch (error) {
      console.error("WithdrawalService: Error initiating withdrawal", error);
      throw error;
    }
  }
  
  /**
   * Completes a withdrawal process and updates relevant receipts
   * @param processId The ID of the withdrawal process
   */
  async completeWithdrawal(processId: number) {
    try {
      // Get the process
      const process = await storage.getProcess(processId);
      
      if (!process) {
        throw new Error("Process not found");
      }
      
      if (process.processType !== "withdrawal" || process.status === "completed") {
        throw new Error("Invalid process for withdrawal completion");
      }
      
      // Find the receipt associated with this withdrawal process
      const receipts = await storage.listWarehouseReceipts();
      const receipt = receipts.find(r => {
        if (r.liens && typeof r.liens === 'object') {
          const liens = r.liens as Record<string, any>;
          return liens.withdrawalProcessId === processId;
        }
        return false;
      });
      
      if (!receipt) {
        throw new Error("Associated receipt not found");
      }
      
      // Get the liens field as a properly typed object
      const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
        ? (receipt.liens as any) 
        : {};
      
      const withdrawalQuantity = liens.withdrawalQuantity || receipt.quantity;
      const isPartial = liens.isPartial === true;
      
      if (isPartial) {
        // For partial withdrawals, create a new receipt with the remaining quantity
        const remainingQuantity = String(parseFloat(receipt.quantity) - parseFloat(withdrawalQuantity));
        
        // Update the original receipt status to show withdrawn
        await storage.updateWarehouseReceipt(receipt.id, {
          status: "withdrawn",
          liens: {
            ...liens,
            withdrawalCompleted: true,
            withdrawalCompletionDate: new Date().toISOString()
          }
        });
        
        // Import receipt service dynamically to avoid circular dependencies
        const { receiptService } = await import("./ReceiptService");
        
        // Create a new receipt for the remaining quantity
        const newReceiptData = {
          receiptNumber: `${receipt.receiptNumber}-REMAINING`,
          commodityId: receipt.commodityId,
          warehouseId: receipt.warehouseId,
          quantity: remainingQuantity,
          valuation: receipt.valuation ? 
            String(parseFloat(receipt.valuation) * (parseFloat(remainingQuantity) / parseFloat(receipt.quantity))) : 
            undefined,
          // Copy over relevant liens data except for withdrawal info
          liens: {
            ...liens,
            originalReceiptId: receipt.id,
            isPartialRemaining: true,
            withdrawalProcessId: undefined,
            withdrawalQuantity: undefined,
            withdrawalDate: undefined,
            isPartial: undefined
          }
        };
        
        // Create the new receipt
        const newReceipt = await receiptService.createReceipt(newReceiptData, receipt.ownerId!);
        
        // Update the process to completed
        await storage.updateProcess(processId, {
          status: "completed",
          completedAt: new Date(),
          currentStage: "receipt_update",
          stageProgress: {
            ...JSON.parse(JSON.stringify(process.stageProgress || {})),
            verification: "completed",
            preparation: "completed",
            document_check: "completed",
            physical_release: "completed",
            quantity_confirmation: "completed",
            receipt_update: "completed"
          }
        });
        
        return {
          originalReceipt: receipt,
          newReceipt,
          withdrawalQuantity,
          processId
        };
      } else {
        // For full withdrawals, just update the receipt status
        await storage.updateWarehouseReceipt(receipt.id, {
          status: "withdrawn",
          liens: {
            ...liens,
            withdrawalCompleted: true,
            withdrawalCompletionDate: new Date().toISOString()
          }
        });
        
        // Update the process to completed
        await storage.updateProcess(processId, {
          status: "completed",
          completedAt: new Date(),
          currentStage: "receipt_update",
          stageProgress: {
            ...JSON.parse(JSON.stringify(process.stageProgress || {})),
            verification: "completed",
            preparation: "completed",
            document_check: "completed",
            physical_release: "completed", 
            quantity_confirmation: "completed",
            receipt_update: "completed"
          }
        });
        
        return {
          receipt,
          withdrawalQuantity,
          processId
        };
      }
    } catch (error) {
      console.error("WithdrawalService: Error completing withdrawal", error);
      throw error;
    }
  }
  
  /**
   * Updates a withdrawal process stage
   * @param processId The ID of the withdrawal process
   * @param stage The stage to update
   * @param status The status of the stage (pending, in_progress, completed)
   */
  async updateWithdrawalStage(processId: number, stage: string, status: string, message?: string) {
    try {
      // Get the process
      const process = await storage.getProcess(processId);
      
      if (!process) {
        throw new Error("Process not found");
      }
      
      if (process.processType !== "withdrawal") {
        throw new Error("Process is not a withdrawal");
      }
      
      // Get current stage progress
      const stageProgress = JSON.parse(JSON.stringify(process.stageProgress || {}));
      
      // Update the stage progress
      stageProgress[stage] = status;
      
      // Calculate overall progress percentage
      const stages = Object.keys(stageProgress);
      const completedStages = stages.filter(s => stageProgress[s] === "completed").length;
      const progress = Math.floor((completedStages / stages.length) * 100);
      
      // Determine if process is complete
      const isCompleted = progress === 100;
      
      // Update the process
      const updatedProcess = await storage.updateProcess(processId, {
        currentStage: stage,
        status: isCompleted ? "completed" : "in_progress",
        completedAt: isCompleted ? new Date() : undefined,
        stageProgress
      });
      
      // If all stages are complete, automatically complete the withdrawal
      if (isCompleted) {
        return this.completeWithdrawal(processId);
      }
      
      return {
        process: updatedProcess,
        progress,
        message: message || `Stage ${stage} set to ${status}`
      };
    } catch (error) {
      console.error("WithdrawalService: Error updating withdrawal stage", error);
      throw error;
    }
  }
}

export const withdrawalService = new WithdrawalService();