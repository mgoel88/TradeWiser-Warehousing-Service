import axios from 'axios';

// --- Configuration ---
// In a real-world scenario, these would be loaded from environment variables
const QA_TOOL_BASE_URL = 'http://localhost:3000/api'; // Assuming QA Tool runs on port 3000
const WMS_BASE_URL = 'http://localhost:5001/api'; // Assuming WMS runs on port 5001
const LOGISTICS_BASE_URL = 'http://localhost:5002/api/customer'; // Assuming Logistics runs on port 5002

// Placeholder for Depository Application - as no repo was explicitly provided for this, 
// we will assume a separate Finance Management System handles the WR/Finance part.
// The user mentioned TradeWiser-Finance-Management-System, which is a good candidate.
const FINANCE_BASE_URL = 'http://localhost:5003/api'; // Assuming Finance runs on port 5003

// --- Quality Assessment (TradeWiser-QA-Tool) Integration ---
// Based on analysis of TradeWiser-QA-Tool/routes.py, the endpoint is likely /api/samples
// We will assume a dedicated endpoint for requesting a new assessment: /api/assessments/request
export async function requestQualityAssessment(depositDetails: {
  commodityName: string;
  quantity: number;
  warehouseId: number;
  processId: number;
  userId: number;
}): Promise<{ assessmentId: number; status: string }> {
  console.log(`[IntegrationService] Requesting QA for process ${depositDetails.processId}...`);
  try {
    const response = await axios.post(`${QA_TOOL_BASE_URL}/assessments/request`, depositDetails);
    
    // Assuming the QA Tool returns the ID of the newly created assessment request
    return response.data; 
  } catch (error) {
    console.error(`[IntegrationService] Error requesting QA: ${error.message}`);
    // In a real system, this would trigger a retry mechanism
    throw new Error(`Failed to request quality assessment: ${error.message}`);
  }
}

// --- Warehouse Management System (TradeWiser-WMS) Integration ---
// Based on analysis of TradeWiser-WMS/server/routes.ts, the endpoint is /api/inventory (POST)
export async function sendInwardGoodsToWMS(depositDetails: {
  commodityName: string;
  quantity: number;
  warehouseId: number;
  processId: number;
  userId: number;
}): Promise<{ inventoryId: number; status: string }> {
  console.log(`[IntegrationService] Sending inward goods request to WMS for process ${depositDetails.processId}...`);
  try {
    const wmsPayload = {
      // WMS expects a tenantId, which we don't have yet. We'll use a placeholder.
      tenantId: 1, 
      warehouseId: depositDetails.warehouseId,
      commodityName: depositDetails.commodityName,
      quantity: depositDetails.quantity,
      // Link back to the Warehousing Service's process ID
      sourceProcessId: depositDetails.processId, 
      status: 'Awaiting Receipt'
    };
    
    const response = await axios.post(`${WMS_BASE_URL}/inventory`, wmsPayload);
    
    // Assuming the WMS returns the ID of the newly created inventory item
    return { inventoryId: response.data.id, status: response.data.status };
  } catch (error) {
    console.error(`[IntegrationService] Error sending inward goods to WMS: ${error.message}`);
    throw new Error(`Failed to send inward goods to WMS: ${error.message}`);
  }
}

// --- Transporter Module (TradeWiser-Logistics-Partners) Integration ---
// Based on analysis of TradeWiser-Logistics-Partners/server/routes.ts, the endpoint is /api/customer/shipments (POST)
export async function schedulePickup(pickupDetails: {
  processId: number;
  origin: string; // Pickup address
  destination: string; // Warehouse address
  cargoType: string; // Commodity Name
  quantity: number;
  userId: number;
}): Promise<{ trackingNumber: string; status: string }> {
  console.log(`[IntegrationService] Scheduling pickup for process ${pickupDetails.processId}...`);
  try {
    const logisticsPayload = {
      userId: pickupDetails.userId,
      shipmentName: `Deposit Pickup for Process ${pickupDetails.processId}`,
      cargoType: pickupDetails.cargoType,
      origin: {
        address: pickupDetails.origin,
        city: 'N/A', // Placeholder - real data needed
        country: 'N/A'
      },
      destination: {
        address: pickupDetails.destination,
        city: 'N/A', // Placeholder - real data needed
        country: 'N/A'
      },
      transportMode: 'road', // Default mode
      quantity: pickupDetails.quantity
    };
    
    const response = await axios.post(`${LOGISTICS_BASE_URL}/shipments`, logisticsPayload);
    
    // Assuming the Logistics service returns a tracking number
    return { 
      trackingNumber: response.data.trackingNumber, 
      status: response.data.status 
    };
  } catch (error) {
    console.error(`[IntegrationService] Error scheduling pickup: ${error.message}`);
    throw new Error(`Failed to schedule pickup: ${error.message}`);
  }
}

// --- Depository/Finance (TradeWiser-Finance-Management-System) Integration ---
// We will assume a dedicated endpoint for eWR issuance: /api/ewr/issue
export async function issueElectronicWarehouseReceipt(receiptData: {
  receiptNumber: string;
  commodityName: string;
  quantity: number;
  valuation: string;
  ownerId: number;
  warehouseId: number;
  blockchainHash: string;
}): Promise<{ depositoryId: string; status: string }> {
  console.log(`[IntegrationService] Issuing eWR to Depository for receipt ${receiptData.receiptNumber}...`);
  try {
    const response = await axios.post(`${FINANCE_BASE_URL}/ewr/issue`, receiptData);
    
    // Assuming the Finance/Depository system returns a unique ID for the eWR
    return { 
      depositoryId: response.data.depositoryId, 
      status: response.data.status 
    };
  } catch (error) {
    console.error(`[IntegrationService] Error issuing eWR: ${error.message}`);
    throw new Error(`Failed to issue eWR: ${error.message}`);
  }
}
