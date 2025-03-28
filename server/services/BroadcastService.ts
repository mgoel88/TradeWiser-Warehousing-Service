/**
 * BroadcastService.ts
 * 
 * Service for broadcasting real-time updates about various entities to WebSocket clients.
 * This centralizes the broadcasting logic and provides a consistent interface for all
 * services that need to send updates to clients.
 */

// Define type for the global broadcast functions
type BroadcastEntityFn = (userId: number, entityType: string, entityId: number, data: any) => void;
type BroadcastProcessFn = (userId: number, processId: number, data: any) => void;

/**
 * Service for broadcasting entity updates to WebSocket clients
 */
class BroadcastService {
  /**
   * Broadcast an update about a receipt to all subscribed clients
   * 
   * @param userId - The user ID who should receive the update
   * @param receiptId - The ID of the receipt being updated
   * @param data - The data to include in the update
   */
  broadcastReceiptUpdate(userId: number, receiptId: number, data: any) {
    const broadcastFn = (global as any).broadcastEntityUpdate as BroadcastEntityFn | undefined;
    if (typeof broadcastFn === 'function') {
      broadcastFn(userId, 'receipt', receiptId, data);
    }
  }
  
  /**
   * Broadcast an update about a loan to all subscribed clients
   * 
   * @param userId - The user ID who should receive the update
   * @param loanId - The ID of the loan being updated
   * @param data - The data to include in the update
   */
  broadcastLoanUpdate(userId: number, loanId: number, data: any) {
    const broadcastFn = (global as any).broadcastEntityUpdate as BroadcastEntityFn | undefined;
    if (typeof broadcastFn === 'function') {
      broadcastFn(userId, 'loan', loanId, data);
    }
  }
  
  /**
   * Broadcast an update about a commodity to all subscribed clients
   * 
   * @param userId - The user ID who should receive the update
   * @param commodityId - The ID of the commodity being updated
   * @param data - The data to include in the update
   */
  broadcastCommodityUpdate(userId: number, commodityId: number, data: any) {
    const broadcastFn = (global as any).broadcastEntityUpdate as BroadcastEntityFn | undefined;
    if (typeof broadcastFn === 'function') {
      broadcastFn(userId, 'commodity', commodityId, data);
    }
  }
  
  /**
   * Broadcast an update about a warehouse to all subscribed clients
   * 
   * @param userId - The user ID who should receive the update
   * @param warehouseId - The ID of the warehouse being updated
   * @param data - The data to include in the update
   */
  broadcastWarehouseUpdate(userId: number, warehouseId: number, data: any) {
    const broadcastFn = (global as any).broadcastEntityUpdate as BroadcastEntityFn | undefined;
    if (typeof broadcastFn === 'function') {
      broadcastFn(userId, 'warehouse', warehouseId, data);
    }
  }
  
  /**
   * Broadcast an update about a process to all subscribed clients (for backward compatibility)
   * 
   * @param userId - The user ID who should receive the update
   * @param processId - The ID of the process being updated
   * @param data - The data to include in the update
   */
  broadcastProcessUpdate(userId: number, processId: number, data: any) {
    const broadcastFn = (global as any).broadcastProcessUpdate as BroadcastProcessFn | undefined;
    if (typeof broadcastFn === 'function') {
      broadcastFn(userId, processId, data);
    }
  }
}

// Create a singleton instance
const broadcastService = new BroadcastService();

export default broadcastService;