/**
 * Script to populate test data including electronic warehouse receipts (eWRs)
 */
import { storage } from './storage';
import { 
  InsertUser, InsertWarehouse, InsertCommodity, 
  InsertWarehouseReceipt, InsertProcess, 
  InsertCommoditySack, InsertSackQualityAssessment,
  InsertSackMovement 
} from '@shared/schema';
import { hashPassword } from './auth';

async function seedTestData() {
  console.log("Starting to seed test data...");

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
      },
      createdAt: new Date()
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
      facilities: ['temperature_control', 'pest_control', 'security'],
      storageRate: '150'
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
      facilities: ['loading_dock', 'security', 'pest_control'],
      storageRate: '200'
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
      facilities: ['humidity_control', 'pest_control'],
      storageRate: '130'
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
        facilities: data.facilities,
        createdAt: new Date()
      };
      const warehouse = await storage.createWarehouse(warehouseInsertData);
      warehouses.push(warehouse);
      console.log(`Created warehouse: ${warehouse.name}`);
    } else {
      console.log(`Warehouse already exists: ${data.name}`);
    }
  }

  // Get all warehouses (including previously created ones)
  const allWarehouses = await storage.listWarehouses();

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
      warehouseId: allWarehouses[0].id,
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
      warehouseId: allWarehouses[2].id,
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
      warehouseId: allWarehouses[1].id,
      valuation: '320000'
    }
  ];

  const commodities = [];
  for (const data of commodityData) {
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
        depositDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastUpdated: new Date(),
        valuation: data.valuation
      };
      const commodity = await storage.createCommodity(commodityInsertData);
      commodities.push(commodity);
      console.log(`Created commodity: ${commodity.name}`);
    } else {
      console.log(`Commodity already exists: ${data.name}`);
    }
  }

  // Get all commodities (including previously created ones)
  const allCommodities = await storage.listCommodities(testUser.id);

  // Create electronic warehouse receipts (eWRs)
  const receiptData = [
    {
      commodityId: allCommodities[0].id,
      warehouseId: allWarehouses[0].id,
      quantity: allCommodities[0].quantity,
      receiptNumber: 'EWR-WHEAT-2023-001',
      warehouseName: allWarehouses[0].name,
      commodityName: allCommodities[0].name,
      storageStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      storageEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      warehouseFee: '15000',
      insuranceDetails: { 
        provider: 'Agri Insurance Ltd', 
        policyNumber: 'INS-AGR-2023-1001', 
        coverage: 'All Risk'
      },
      qrCodeUrl: '/uploads/qrcodes/ewr-wheat-001.png'
    },
    {
      commodityId: allCommodities[1].id,
      warehouseId: allWarehouses[2].id,
      quantity: allCommodities[1].quantity,
      receiptNumber: 'EWR-RICE-2023-002',
      warehouseName: allWarehouses[2].name,
      commodityName: allCommodities[1].name,
      storageStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      storageEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      warehouseFee: '26000',
      insuranceDetails: { 
        provider: 'Rural Insurance Company', 
        policyNumber: 'INS-RICE-2023-4520', 
        coverage: 'Fire and Theft'
      },
      qrCodeUrl: '/uploads/qrcodes/ewr-rice-002.png'
    },
    {
      commodityId: allCommodities[2].id,
      warehouseId: allWarehouses[1].id,
      quantity: allCommodities[2].quantity,
      receiptNumber: 'EWR-SOY-2023-003',
      warehouseName: allWarehouses[1].name,
      commodityName: allCommodities[2].name,
      storageStartDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      storageEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      warehouseFee: '31000',
      insuranceDetails: { 
        provider: 'Farmer Protection Insurance', 
        policyNumber: 'INS-SOY-2023-7845', 
        coverage: 'Comprehensive'
      },
      qrCodeUrl: '/uploads/qrcodes/ewr-soy-003.png'
    }
  ];

  const receipts = [];
  for (const data of receiptData) {
    // Check if receipt already exists
    const existingReceipts = await storage.listWarehouseReceipts(testUser.id);
    const exists = existingReceipts.some(r => r.receiptNumber === data.receiptNumber);

    if (!exists) {
      const receiptInsertData: InsertWarehouseReceipt = {
        ownerId: testUser.id,
        receiptNumber: data.receiptNumber,
        quantity: data.quantity,
        measurementUnit: allCommodities.find(c => c.id === data.commodityId)?.measurementUnit || 'kg',
        warehouseId: data.warehouseId,
        commodityId: data.commodityId,
        warehouseName: data.warehouseName,
        commodityName: data.commodityName,
        issuedDate: new Date(),
        expiryDate: data.storageEndDate,
        status: 'active',
        physicalReceipt: false,
        storageStartDate: data.storageStartDate,
        storageEndDate: data.storageEndDate,
        warehouseFee: data.warehouseFee,
        insuranceDetails: data.insuranceDetails,
        valuation: allCommodities.find(c => c.id === data.commodityId)?.valuation || '0',
        qrCodeUrl: data.qrCodeUrl,
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
    }
  }

  // Create commodity sacks (for individual tracking)
  for (const commodity of allCommodities) {
    // Check if sacks already exist for this commodity
    const existingSacks = await storage.listCommoditySacks({ commodityId: commodity.id });
    
    if (existingSacks.length === 0) {
      const numSacks = Math.floor(parseInt(commodity.quantity) / 50); // Each sack is 50kg
      console.log(`Creating ${numSacks} sacks for ${commodity.name}...`);
      
      for (let i = 0; i < numSacks; i++) {
        const sackId = `${commodity.name.substring(0, 3).toUpperCase()}-${commodity.id}-${i + 1}`;
        const sackData: InsertCommoditySack = {
          sackId: sackId,
          commodityId: commodity.id,
          warehouseId: commodity.warehouseId || null,
          ownerId: testUser.id,
          isOwnerHidden: false,
          weight: '50',
          weightUnit: 'kg',
          depositDate: new Date(Date.now() - (7 + Math.floor(Math.random() * 14)) * 24 * 60 * 60 * 1000),
          status: 'active',
          qualityParameters: commodity.qualityParameters,
          measurementUnit: 'kg',
          gradeAssigned: commodity.gradeAssigned || null,
          harvestDate: new Date(Date.now() - (30 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
          blockchainData: {
            hash: generateRandomHash(),
            timestamp: new Date().toISOString()
          },
          createdAt: new Date(),
          lastUpdated: new Date(),
          lastInspectionDate: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
        };
        
        const sack = await storage.createCommoditySack(sackData);
        
        // Create quality assessment for each sack
        const assessmentData: InsertSackQualityAssessment = {
          sackId: sack.id,
          inspectionDate: sack.lastInspectionDate || new Date(),
          qualityParameters: sack.qualityParameters || {},
          gradeAssigned: sack.gradeAssigned,
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
          toLocationId: commodity.warehouseId || null,
          fromOwnerId: null,
          toOwnerId: testUser.id,
          movementType: 'deposit',
          movementDate: sack.depositDate || new Date(),
          metadata: {
            reason: 'Initial deposit',
            transportMethod: 'Truck'
          },
          transactionHash: generateRandomHash()
        };
        
        await storage.createSackMovement(movementData);
      }
      
      console.log(`Created ${numSacks} sacks with quality assessments and movement records`);
    } else {
      console.log(`Sacks already exist for commodity: ${commodity.name}`);
    }
  }

  // Create completed deposit processes
  for (const commodity of allCommodities) {
    // Check if process already exists for this commodity
    const existingProcesses = await storage.listProcesses({ commodityId: commodity.id });
    
    if (existingProcesses.length === 0) {
      const processData: InsertProcess = {
        userId: testUser.id,
        warehouseId: commodity.warehouseId || null,
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
        startTime: commodity.depositDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        estimatedCompletionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      };
      
      const process = await storage.createProcess(processData);
      console.log(`Created completed deposit process for: ${commodity.name}`);
    } else {
      console.log(`Process already exists for commodity: ${commodity.name}`);
    }
  }

  console.log("All test data seeded successfully!");
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

// Run the function directly if this file is executed directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('Seed completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error seeding test data:', error);
      process.exit(1);
    });
}