/**
 * Script to populate test data including electronic warehouse receipts (eWRs)
 */
import { storage } from './storage';
import { 
  InsertUser, InsertWarehouse, InsertCommodity, 
  InsertWarehouseReceipt, InsertProcess, 
  InsertCommoditySack, InsertSackQualityAssessment,
  InsertSackMovement, CollateralStatus
} from '@shared/schema';
import { hashPassword } from './auth';

async function seedTestData() {
  console.log("Starting to seed test data...");

  try {
    // Create test user if it doesn't exist
    let testUser = await storage.getUserByUsername('testuser');
    if (!testUser) {
      console.log("Creating test user...");
      const userData: InsertUser = {
        username: 'testuser',
        password: hashPassword('password123'),
        fullName: 'Test User',
        email: 'testuser@example.com',
        phone: '9876543210',
        role: 'farmer',
        kycVerified: true,
        businessDetails: {
          name: 'Test Farm',
          address: 'Test Address, Delhi',
          registrationNumber: 'TEST123'
        }
      };
      testUser = await storage.createUser(userData);
      console.log("Test user created:", testUser.username);
    } else {
      console.log("Test user already exists:", testUser.username);
    }

    // Create warehouses
    const warehouseData = [
      {
        name: 'Delhi Central Warehouse',
        address: 'Industrial Area, Phase 1',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: '28.6139',
        longitude: '77.2090',
        capacity: '10000',
        availableSpace: '7500',
        channelType: 'green',
        specializations: ['grain', 'pulses'],
        facilities: ['temperature_control', 'pest_control', 'security']
      },
      {
        name: 'Mumbai Port Warehouse',
        address: 'Dock Area, Mumbai Port',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        latitude: '18.9442',
        longitude: '72.8310',
        capacity: '15000',
        availableSpace: '8000',
        channelType: 'green',
        specializations: ['grain', 'oilseeds'],
        facilities: ['loading_dock', 'security', 'pest_control']
      },
      {
        name: 'Kolkata East Warehouse',
        address: 'Eastern Metropolitan Bypass',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700107',
        latitude: '22.5726',
        longitude: '88.3639',
        capacity: '8000',
        availableSpace: '4000',
        channelType: 'green',
        specializations: ['rice', 'jute'],
        facilities: ['humidity_control', 'pest_control']
      }
    ];

    const warehouses = [];
    for (const data of warehouseData) {
      // Check if warehouse already exists
      const existingWarehouses = await storage.listWarehouses();
      const exists = existingWarehouses.some(w => w.name === data.name);

      if (!exists) {
        const warehouseInsertData: InsertWarehouse = {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
          capacity: data.capacity,
          availableSpace: data.availableSpace,
          channelType: data.channelType as 'green' | 'orange' | 'red',
          ownerId: testUser.id,
          specializations: data.specializations,
          facilities: data.facilities
        };
        const warehouse = await storage.createWarehouse(warehouseInsertData);
        warehouses.push(warehouse);
        console.log(`Created warehouse: ${warehouse.name}`);
      } else {
        console.log(`Warehouse already exists: ${data.name}`);
        // Add the existing warehouse to our array
        const existingWarehouse = existingWarehouses.find(w => w.name === data.name);
        if (existingWarehouse) warehouses.push(existingWarehouse);
      }
    }

    // Get all warehouses (including previously created ones) if our array is empty
    if (warehouses.length === 0) {
      const allWarehouses = await storage.listWarehouses();
      warehouses.push(...allWarehouses);
    }

    // Create commodity data for test user
    const commodityData = [
      {
        name: 'Premium Wheat',
        type: 'Grain',
        channelType: 'green',
        quantity: '1000',
        measurementUnit: 'kg',
        qualityParameters: {
          moisture: '12.5%',
          proteinContent: '11.2%',
          testWeight: '82 kg/hl',
          fallingNumber: '350 s'
        },
        gradeAssigned: 'Grade A',
        warehouseId: warehouses[0]?.id,
        valuation: '210000'
      },
      {
        name: 'Basmati Rice',
        type: 'Grain',
        channelType: 'green',
        quantity: '2000',
        measurementUnit: 'kg',
        qualityParameters: {
          moisture: '13.0%',
          brokenGrains: '2.5%',
          foreignMatter: '0.5%'
        },
        gradeAssigned: 'Premium',
        warehouseId: warehouses[warehouses.length > 2 ? 2 : 0]?.id,
        valuation: '500000'
      },
      {
        name: 'Yellow Soybean',
        type: 'Oilseed',
        channelType: 'green',
        quantity: '1500',
        measurementUnit: 'kg',
        qualityParameters: {
          moisture: '11.5%',
          foreignMatter: '1.0%',
          oilContent: '20.5%'
        },
        gradeAssigned: 'Grade B',
        warehouseId: warehouses[warehouses.length > 1 ? 1 : 0]?.id,
        valuation: '320000'
      }
    ];

    const commodities = [];
    for (const data of commodityData) {
      // Skip if warehouse ID is missing
      if (!data.warehouseId) {
        console.log(`Skipping commodity ${data.name} due to missing warehouse ID`);
        continue;
      }
      
      // Check if commodity already exists for the user
      const existingCommodities = await storage.listCommodities(testUser.id);
      const exists = existingCommodities.some(c => c.name === data.name && c.type === data.type);

      if (!exists) {
        const commodityInsertData: InsertCommodity = {
          name: data.name,
          type: data.type,
          channelType: data.channelType as 'green' | 'orange' | 'red',
          quantity: data.quantity,
          measurementUnit: data.measurementUnit,
          qualityParameters: data.qualityParameters,
          gradeAssigned: data.gradeAssigned,
          warehouseId: data.warehouseId,
          ownerId: testUser.id,
          status: 'active',
          valuation: data.valuation
        };
        const commodity = await storage.createCommodity(commodityInsertData);
        commodities.push(commodity);
        console.log(`Created commodity: ${commodity.name}`);
      } else {
        console.log(`Commodity already exists: ${data.name}`);
        // Add the existing commodity to our array
        const existingCommodity = existingCommodities.find(c => c.name === data.name && c.type === data.type);
        if (existingCommodity) commodities.push(existingCommodity);
      }
    }

    // Get all commodities if our array is empty
    if (commodities.length === 0) {
      const allCommodities = await storage.listCommodities(testUser.id);
      commodities.push(...allCommodities);
    }
    
    // Create electronic warehouse receipts (eWRs)
    if (commodities.length > 0 && warehouses.length > 0) {
      console.log("Creating electronic warehouse receipts (eWRs)...");
      
      // Get the commodities and warehouses to use
      const receiptData = [
        {
          commodityId: commodities[0]?.id,
          warehouseId: warehouses[0]?.id,
          quantity: commodities[0]?.quantity || '1000',
          receiptNumber: 'EWR-WHEAT-2023-001',
          warehouseName: warehouses[0]?.name || 'Delhi Central Warehouse',
          commodityName: commodities[0]?.name || 'Premium Wheat',
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        {
          commodityId: commodities.length > 1 ? commodities[1]?.id : commodities[0]?.id,
          warehouseId: warehouses.length > 2 ? warehouses[2]?.id : warehouses[0]?.id,
          quantity: commodities.length > 1 ? commodities[1]?.quantity || '2000' : commodities[0]?.quantity || '1000',
          receiptNumber: 'EWR-RICE-2023-002',
          warehouseName: warehouses.length > 2 ? warehouses[2]?.name || 'Kolkata East Warehouse' : warehouses[0]?.name,
          commodityName: commodities.length > 1 ? commodities[1]?.name || 'Basmati Rice' : commodities[0]?.name,
          expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
        },
        {
          commodityId: commodities.length > 2 ? commodities[2]?.id : commodities[0]?.id,
          warehouseId: warehouses.length > 1 ? warehouses[1]?.id : warehouses[0]?.id,
          quantity: commodities.length > 2 ? commodities[2]?.quantity || '1500' : commodities[0]?.quantity || '1000',
          receiptNumber: 'EWR-SOY-2023-003',
          warehouseName: warehouses.length > 1 ? warehouses[1]?.name || 'Mumbai Port Warehouse' : warehouses[0]?.name,
          commodityName: commodities.length > 2 ? commodities[2]?.name || 'Yellow Soybean' : commodities[0]?.name,
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        }
      ];

      const receipts = [];
      for (const data of receiptData) {
        // Skip if missing required IDs
        if (!data.commodityId || !data.warehouseId) {
          console.log(`Skipping receipt ${data.receiptNumber} due to missing commodity or warehouse ID`);
          continue;
        }
        
        // Check if receipt already exists
        const existingReceipts = await storage.listWarehouseReceipts(testUser.id);
        const exists = existingReceipts.some(r => r.receiptNumber === data.receiptNumber);

        if (!exists) {
          // Find the matching commodity to get its valuation and measurement unit
          const commodity = commodities.find(c => c.id === data.commodityId);
          
          const receiptInsertData: InsertWarehouseReceipt = {
            ownerId: testUser.id,
            receiptNumber: data.receiptNumber,
            commodityId: data.commodityId,
            warehouseId: data.warehouseId,
            quantity: data.quantity,
            measurementUnit: commodity?.measurementUnit || 'kg',
            warehouseName: data.warehouseName,
            commodityName: data.commodityName,
            status: 'active',
            expiryDate: data.expiryDate,
            valuation: commodity?.valuation || '0',
            blockchainHash: generateRandomHash(),
            metadata: {
              createdBy: 'system',
              verificationStatus: 'verified'
            }
          };
          
          const receipt = await storage.createWarehouseReceipt(receiptInsertData);
          receipts.push(receipt);
          console.log(`Created eWR: ${receipt.receiptNumber}`);
        } else {
          console.log(`Receipt already exists: ${data.receiptNumber}`);
          // Add existing receipt to our array
          const existingReceipt = existingReceipts.find(r => r.receiptNumber === data.receiptNumber);
          if (existingReceipt) receipts.push(existingReceipt);
        }
      }

      // Create commodity sacks (for individual tracking)
      console.log("Creating individual commodity sacks with blockchain tracking...");
      
      for (const commodity of commodities) {
        // Check if sacks already exist for this commodity
        const existingSacks = await storage.listCommoditySacks({ commodityId: commodity.id });
        
        if (existingSacks.length === 0) {
          const numSacks = Math.floor(parseInt(commodity.quantity) / 50); // Each sack is 50kg
          const maxSacks = Math.min(numSacks, 10); // Limit to 10 sacks per commodity to prevent too many DB entries
          
          console.log(`Creating ${maxSacks} sacks for ${commodity.name}...`);
          
          for (let i = 0; i < maxSacks; i++) {
            const sackId = `${commodity.name.substring(0, 3).toUpperCase()}-${commodity.id}-${i + 1}`;
            
            const sackData: InsertCommoditySack = {
              sackId: sackId,
              commodityId: commodity.id,
              warehouseId: commodity.warehouseId,
              ownerId: testUser.id,
              isOwnerHidden: false,
              weight: '50',
              weightUnit: 'kg',
              status: 'active',
              qualityParameters: commodity.qualityParameters,
              measurementUnit: 'kg',
              gradeAssigned: commodity.gradeAssigned,
              blockchainHash: generateRandomHash(),
              barcodeData: `SAK:${sackId}:${commodity.id}:${testUser.id}`
            };
            
            try {
              const sack = await storage.createCommoditySack(sackData);
              console.log(`Created sack: ${sack.sackId}`);
              
              // Create quality assessment for each sack
              const assessmentData: InsertSackQualityAssessment = {
                sackId: sack.id,
                qualityParameters: sack.qualityParameters || {},
                gradeAssigned: sack.gradeAssigned || null,
                blockchainHash: generateRandomHash(),
                inspectorId: null,
                notes: 'Initial quality assessment at deposit',
                attachmentUrls: []
              };
              
              await storage.createSackQualityAssessment(assessmentData);
              
              // Create movement record (deposit)
              const movementData: InsertSackMovement = {
                sackId: sack.id,
                fromLocationId: null,
                toLocationId: commodity.warehouseId,
                fromOwnerId: null,
                toOwnerId: testUser.id,
                movementType: 'deposit',
                metadata: {
                  reason: 'Initial deposit',
                  transportMethod: 'Truck'
                },
                transactionHash: generateRandomHash()
              };
              
              await storage.createSackMovement(movementData);
            } catch (error) {
              console.error(`Error creating sack ${sackId}:`, error);
            }
          }
          
          console.log(`Created sacks with quality assessments and movement records for ${commodity.name}`);
        } else {
          console.log(`Sacks already exist for commodity: ${commodity.name} (${existingSacks.length} sacks found)`);
        }
      }

      // Create completed deposit processes for each commodity
      console.log("Creating deposit processes...");
      
      for (const commodity of commodities) {
        // Check if process already exists for this commodity
        const existingProcesses = await storage.listProcesses({ commodityId: commodity.id });
        
        if (existingProcesses.length === 0) {
          const processData: InsertProcess = {
            userId: testUser.id,
            warehouseId: commodity.warehouseId,
            commodityId: commodity.id,
            processType: 'deposit',
            status: 'completed',
            currentStage: 'receipt_generation',
            stageProgress: {
              deposit_reception: 'completed',
              pre_cleaning: 'completed',
              quality_assessment: 'completed',
              receipt_generation: 'completed'
            },
            estimatedCompletionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          };
          
          try {
            const process = await storage.createProcess(processData);
            console.log(`Created completed deposit process for: ${commodity.name}`);
          } catch (error) {
            console.error(`Error creating process for ${commodity.name}:`, error);
          }
        } else {
          console.log(`Process already exists for commodity: ${commodity.name}`);
        }
      }
    } else {
      console.log("Skipping receipt creation due to missing commodities or warehouses");
    }

    console.log("All test data seeded successfully!");
    return {
      success: true,
      message: "Test data successfully populated"
    };
    
  } catch (error) {
    console.error("Error seeding test data:", error);
    return {
      success: false,
      message: "Failed to seed test data",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Helper function to generate random hash for blockchain simulation
function generateRandomHash(): string {
  const chars = 'abcdef0123456789';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

// Export the function to be called from other modules
export { seedTestData };