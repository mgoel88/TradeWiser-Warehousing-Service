/**
 * Test Data Generator
 * 
 * This script populates the database with test data for development and testing purposes.
 */
import { storage } from './storage';
import { 
  CollateralStatus, 
  LoanStatus, 
  CreditRating,
  LendingPartnerType
} from '@shared/schema';
import { bankPaymentService } from './services/BankPaymentService';
import { receiptService } from './services/ReceiptService';

/**
 * Generates test data for the application
 */
export async function generateTestData() {
  console.log('Generating test data...');
  
  try {
    // Create test warehouses across different regions of India
    
    // North India (Delhi NCR)
    const warehouse1 = await storage.createWarehouse({
      name: 'Central Warehouse Delhi',
      address: 'Industrial Area Phase I',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110020',
      latitude: 28.6139,
      longitude: 77.2090,
      capacity: '10000',
      availableSpace: '8500',
      contactEmail: 'info@centralwarehouse.com',
      contactPhone: '+919876543210',
      certifications: ['ISO 9001', 'FSSAI'],
      services: ['storage', 'cleaning', 'grading'],
      storageRates: '5.5',
      operationalStatus: 'active'
    });
    
    // South India (Bangalore)
    const warehouse2 = await storage.createWarehouse({
      name: 'Agri Storage Facility',
      address: 'Rural Hub Zone',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      capacity: '8000',
      availableSpace: '3000',
      contactEmail: 'contact@agristorage.com',
      contactPhone: '+918765432101',
      certifications: ['NABARD Certified'],
      services: ['storage', 'fumigation', 'transport'],
      storageRates: '4.75',
      operationalStatus: 'active'
    });

    // West India (Mumbai)
    const warehouse3 = await storage.createWarehouse({
      name: 'Mumbai Port Storage',
      address: 'Mumbai Port Trust Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      latitude: 18.9387,
      longitude: 72.8353,
      capacity: '15000',
      availableSpace: '5000',
      contactEmail: 'operations@mumbaiportstorage.com',
      contactPhone: '+917890123456',
      certifications: ['ISO 9001', 'ISO 22000'],
      services: ['storage', 'loading', 'packaging', 'export'],
      storageRates: '6.8',
      operationalStatus: 'active'
    });
    
    // East India (Kolkata)
    const warehouse4 = await storage.createWarehouse({
      name: 'Eastern Agricultural Hub',
      address: 'Sector V, Salt Lake',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
      latitude: 22.5726,
      longitude: 88.3639,
      capacity: '12000',
      availableSpace: '7500',
      contactEmail: 'admin@easternhub.in',
      contactPhone: '+916789012345',
      certifications: ['NABARD Certified', 'Organic Storage Certified'],
      services: ['storage', 'cold storage', 'quality testing'],
      storageRates: '5.2',
      operationalStatus: 'active'
    });
    
    // Central India (Nagpur)
    const warehouse5 = await storage.createWarehouse({
      name: 'Central India Storage Solutions',
      address: 'MIDC Hingna',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440016',
      latitude: 21.1458,
      longitude: 79.0882,
      capacity: '9000',
      availableSpace: '4500',
      contactEmail: 'support@cistorage.com',
      contactPhone: '+915678901234',
      certifications: ['ISO 9001'],
      services: ['storage', 'fumigation', 'quality grading'],
      storageRates: '4.9',
      operationalStatus: 'active'
    });
    
    // Punjab (Major agricultural state)
    const warehouse6 = await storage.createWarehouse({
      name: 'Punjab Grain Depot',
      address: 'Grain Market Road',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      latitude: 30.9010,
      longitude: 75.8573,
      capacity: '18000',
      availableSpace: '2000',
      contactEmail: 'info@punjabgrain.com',
      contactPhone: '+914567890123',
      certifications: ['FCI Approved', 'ISO 9001'],
      services: ['storage', 'cleaning', 'drying', 'grading'],
      storageRates: '4.5',
      operationalStatus: 'active'
    });
    
    // Gujarat (Near your location - simulating warehouses around user)
    const warehouse7 = await storage.createWarehouse({
      name: 'Ahmedabad Agri Warehouse',
      address: 'Sarkhej-Gandhinagar Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380054',
      latitude: 23.0225,
      longitude: 72.5714,
      capacity: '12000',
      availableSpace: '6000',
      contactEmail: 'operations@agriwh.com',
      contactPhone: '+913456789012',
      certifications: ['ISO 9001', 'FSSAI'],
      services: ['storage', 'packaging', 'transport'],
      storageRates: '5.0',
      operationalStatus: 'active'
    });
    
    // Very nearby warehouse (within 10km of simulated location)
    const warehouse8 = await storage.createWarehouse({
      name: 'Local Farm Storage',
      address: 'Village Road, Sanand',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380058',
      latitude: 23.0400, // Very close to simulated user location
      longitude: 72.5800, // Very close to simulated user location
      capacity: '3000',
      availableSpace: '2000',
      contactEmail: 'localfarm@example.com',
      contactPhone: '+912345098765',
      certifications: ['Organic Certified'],
      services: ['storage', 'local distribution'],
      storageRates: '4.2',
      operationalStatus: 'active'
    });
    
    // Another nearby warehouse (within 25km of simulated location)
    const warehouse9 = await storage.createWarehouse({
      name: 'District Agricultural Storage',
      address: 'Industrial Estate, Gandhinagar',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382010',
      latitude: 23.2200, // Within reasonable distance of simulated user
      longitude: 72.6500, // Within reasonable distance of simulated user
      capacity: '7500',
      availableSpace: '4200',
      contactEmail: 'das@example.com',
      contactPhone: '+912765098432',
      certifications: ['ISO 9001', 'Government Approved'],
      services: ['storage', 'mandi connections', 'quality testing'],
      storageRates: '4.8',
      operationalStatus: 'active'
    });

    // Create commodities
    const wheat = await storage.createCommodity({
      name: 'Premium Wheat',
      category: 'cereals',
      variety: 'Sharbati',
      quantityAvailable: '1500',
      measurementUnit: 'kg',
      gradeOrQuality: 'A',
      harvestDate: new Date('2025-01-15'),
      currentLocation: 'Delhi Central Warehouse',
      warehouseId: warehouse1.id,
      ownerId: 1, // Test user ID
      pricePerUnit: '28.50',
      status: 'available',
      origin: 'Madhya Pradesh',
      organicCertified: true,
      pesticidesUsed: ['None - Organic'],
      moistureContent: '10.5',
      foreignMatterPercent: '0.8',
      imageUrls: []
    });

    const rice = await storage.createCommodity({
      name: 'Basmati Rice',
      category: 'cereals',
      variety: 'Premium Basmati',
      quantityAvailable: '2000',
      measurementUnit: 'kg',
      gradeOrQuality: 'A+',
      harvestDate: new Date('2025-02-10'),
      currentLocation: 'Agri Storage Facility',
      warehouseId: warehouse2.id,
      ownerId: 1, // Test user ID
      pricePerUnit: '75.00',
      status: 'available',
      origin: 'Punjab',
      organicCertified: false,
      pesticidesUsed: ['Standard Treatment'],
      moistureContent: '12.0',
      foreignMatterPercent: '0.5',
      imageUrls: []
    });

    // Create warehouse receipts
    const wheatReceipt = await storage.createWarehouseReceipt({
      receiptNumber: 'WRF-202504-001',
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'active',
      ownerId: 1, // Test user ID
      warehouseId: warehouse1.id,
      commodityId: wheat.id,
      quantity: '1000',
      measurementUnit: 'kg',
      qualityGrade: 'A',
      storageLocation: 'Block A, Shelf 5',
      insuranceStatus: 'insured',
      estimatedValue: '28500', // 1000 kg * 28.50
      externalSource: 'internal',
      verified: true,
      smartContractId: 'SC-WH-001-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      blockchainStatus: 'confirmed',
      attachmentUrls: []
    });

    const riceReceipt = await storage.createWarehouseReceipt({
      receiptNumber: 'WRF-202504-002',
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'active',
      ownerId: 1, // Test user ID
      warehouseId: warehouse2.id,
      commodityId: rice.id,
      quantity: '1500',
      measurementUnit: 'kg',
      qualityGrade: 'A+',
      storageLocation: 'Section C, Bin 12',
      insuranceStatus: 'insured',
      estimatedValue: '112500', // 1500 kg * 75.00
      externalSource: 'internal',
      verified: true,
      smartContractId: 'SC-WH-002-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      blockchainStatus: 'confirmed',
      attachmentUrls: []
    });

    // Create commodity sacks for each receipt
    const wheatSacks = [];
    for (let i = 1; i <= 20; i++) { // 20 sacks of 50 kg each = 1000 kg total
      wheatSacks.push({
        sackId: `SACK-WHEAT-${i}-${Date.now()}`,
        ownerId: 1,
        receiptId: wheatReceipt.id,
        warehouseId: warehouse1.id,
        commodityId: wheat.id,
        weight: '50',
        measurementUnit: 'kg',
        status: 'active',
        location: `Block A, Shelf 5, Position ${i}`,
        gradeAssigned: 'A',
        qualityParameters: {
          moistureContent: '10.5',
          foreignMatterPercent: '0.8',
          brokenGrainPercent: '1.2'
        },
        smartContractId: `SC-SACK-WH-${i}-${Date.now()}`,
        transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
        blockchainStatus: 'confirmed'
      });
    }
    await storage.createManyCommoditySacks(wheatSacks);

    const riceSacks = [];
    for (let i = 1; i <= 30; i++) { // 30 sacks of 50 kg each = 1500 kg total
      riceSacks.push({
        sackId: `SACK-RICE-${i}-${Date.now()}`,
        ownerId: 1,
        receiptId: riceReceipt.id,
        warehouseId: warehouse2.id,
        commodityId: rice.id,
        weight: '50',
        measurementUnit: 'kg',
        status: 'active',
        location: `Section C, Bin 12, Level ${Math.ceil(i/10)}`,
        gradeAssigned: 'A+',
        qualityParameters: {
          moistureContent: '12.0',
          foreignMatterPercent: '0.5',
          brokenGrainPercent: '0.8'
        },
        smartContractId: `SC-SACK-RICE-${i}-${Date.now()}`,
        transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
        blockchainStatus: 'confirmed'
      });
    }
    await storage.createManyCommoditySacks(riceSacks);

    // Create lending partners
    const hdfc = await storage.createLendingPartner({
      name: 'HDFC Bank',
      type: LendingPartnerType.BANK,
      interestRateMin: '8.75',
      interestRateMax: '12.50',
      maxLoanAmount: '1000000',
      minLoanAmount: '10000',
      maxTenureDays: 365,
      minTenureDays: 30,
      loanToValueRatio: '80',
      processingFeePercent: '1.5',
      contactEmail: 'agrilending@hdfcbank.com',
      contactPhone: '+911234567890',
      active: true,
      logoUrl: 'https://assets.stickpng.com/images/627ccbb4e45d031b97f6c392.png'
    });

    const sbi = await storage.createLendingPartner({
      name: 'State Bank of India',
      type: LendingPartnerType.BANK,
      interestRateMin: '8.25',
      interestRateMax: '12.00',
      maxLoanAmount: '1500000',
      minLoanAmount: '25000',
      maxTenureDays: 365 * 2,
      minTenureDays: 90,
      loanToValueRatio: '75',
      processingFeePercent: '1.25',
      contactEmail: 'agri@sbi.co.in',
      contactPhone: '+912345678901',
      active: true,
      logoUrl: 'https://logowik.com/content/uploads/images/state-bank-of-india-sbi3434.jpg'
    });

    // Create user credit profile
    const creditProfile = await storage.createUserCreditProfile({
      userId: 1,
      creditScore: 720,
      creditRating: CreditRating.A,
      creditHistory: {
        totalLoans: 5,
        repaidOnTime: 4,
        lateRepayments: 1,
        defaults: 0
      },
      externalCreditReportId: "EXT-CR-" + Date.now(),
      riskAssessment: {
        overallRisk: "Low",
        incomeStability: "High",
        commodityPriceRisk: "Medium"
      },
      creditLimit: '500000',
      defaultRiskScore: '15'
    });

    // Create loan applications
    const loanApp1 = await storage.createLoanApplication({
      userId: 1,
      lendingPartnerId: hdfc.id,
      requestedAmount: '22800', // 80% of wheat value
      requestedTenureDays: 90,
      purpose: 'Working capital for next planting season',
      status: LoanStatus.APPROVED,
      creditScore: creditProfile.creditScore,
      documents: {
        idProof: true,
        addressProof: true,
        bankStatements: true
      },
      approvalDate: new Date(),
      approvedAmount: '22800',
      approvedTenureDays: 90,
      approvedInterestRate: '9.5'
    });

    const loanApp2 = await storage.createLoanApplication({
      userId: 1,
      lendingPartnerId: sbi.id,
      requestedAmount: '90000', // 80% of rice value
      requestedTenureDays: 180,
      purpose: 'Farm equipment purchase',
      status: LoanStatus.APPROVED,
      creditScore: creditProfile.creditScore,
      documents: {
        idProof: true,
        addressProof: true,
        bankStatements: true,
        landDocuments: true
      },
      approvalDate: new Date(),
      approvedAmount: '90000',
      approvedTenureDays: 180,
      approvedInterestRate: '8.75'
    });

    // Create collateral pledges
    const pledge1 = await storage.createCollateralPledge({
      receiptId: wheatReceipt.id,
      userId: 1,
      lendingPartnerId: hdfc.id,
      status: CollateralStatus.PLEDGED,
      valuationAmount: '28500',
      valuationDate: new Date(),
      pledgePercentage: '80',
      loanId: null, // Will be updated when loan is created
      smartContractId: 'SC-PLEDGE-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      loanAmount: '22800'
    });

    const pledge2 = await storage.createCollateralPledge({
      receiptId: riceReceipt.id,
      userId: 1,
      lendingPartnerId: sbi.id,
      status: CollateralStatus.PLEDGED,
      valuationAmount: '112500',
      valuationDate: new Date(),
      pledgePercentage: '80',
      loanId: null, // Will be updated when loan is created
      smartContractId: 'SC-PLEDGE-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      loanAmount: '90000'
    });

    // Create loans
    const loanStartDate = new Date();
    const wheat_loan = await storage.createLoan({
      userId: 1,
      lendingPartnerId: hdfc.id,
      lendingPartnerName: hdfc.name,
      amount: '22800',
      interestRate: '9.5',
      tenureDays: 90,
      startDate: loanStartDate,
      endDate: new Date(loanStartDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      status: LoanStatus.ACTIVE,
      loanApplicationId: loanApp1.id,
      collateralValue: '28500',
      outstandingPrincipal: '22800',
      outstandingInterest: '542.50', // Simple interest calculation for example
      nextPaymentDue: new Date(loanStartDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      paymentFrequency: 'monthly',
      loanType: 'warehouse_receipt_financing',
      smartContractId: 'SC-LOAN-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      disbursementDate: new Date(loanStartDate.getTime() - 2 * 24 * 60 * 60 * 1000), // Disbursed 2 days ago
      availableCredit: '0' // Fully disbursed
    });

    // Update collateral pledge with loan ID
    await storage.updateCollateralPledge(pledge1.id, { loanId: wheat_loan.id });

    // Create another loan (rice loan)
    const rice_loan = await storage.createLoan({
      userId: 1,
      lendingPartnerId: sbi.id,
      lendingPartnerName: sbi.name,
      amount: '90000',
      interestRate: '8.75',
      tenureDays: 180,
      startDate: loanStartDate,
      endDate: new Date(loanStartDate.getTime() + 180 * 24 * 60 * 60 * 1000),
      status: LoanStatus.ACTIVE,
      loanApplicationId: loanApp2.id,
      collateralValue: '112500',
      outstandingPrincipal: '90000',
      outstandingInterest: '1968.75', // Simple interest calculation for example
      nextPaymentDue: new Date(loanStartDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      paymentFrequency: 'monthly',
      loanType: 'warehouse_receipt_financing',
      smartContractId: 'SC-LOAN-' + Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substring(2, 40),
      disbursementDate: new Date(loanStartDate.getTime() - 3 * 24 * 60 * 60 * 1000), // Disbursed 3 days ago
      availableCredit: '0' // Fully disbursed
    });

    // Update collateral pledge with loan ID
    await storage.updateCollateralPledge(pledge2.id, { loanId: rice_loan.id });

    // Create a loan repayment for first loan
    const repayment1 = await storage.createLoanRepayment({
      userId: 1,
      loanId: wheat_loan.id,
      amount: '5000',
      principalAmount: '4600',
      interestAmount: '400',
      paymentMethod: 'NETBANKING',
      status: 'COMPLETED',
      referenceNumber: 'PAY-' + Date.now(),
      receiptNumber: 'RCPT-' + Date.now()
    });

    // Create repayment receipt
    const payment1 = {
      id: 1,
      userId: 1,
      amount: '5000',
      status: 'COMPLETED',
      transactionId: 'TXN-' + Date.now(),
      referenceNumber: repayment1.referenceNumber,
      timestamp: new Date(),
      paymentMethod: 'NETBANKING',
      bankCode: 'HDFC',
      accountNumber: 'XXXX1234',
      createdAt: new Date()
    };

    const receipt1 = await receiptService.generateReceipt(payment1, repayment1, {
      loanDetails: {
        interestRate: wheat_loan.interestRate,
        startDate: wheat_loan.startDate.toLocaleDateString(),
        lendingPartnerName: wheat_loan.lendingPartnerName
      },
      userDetails: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890'
      }
    });

    // Update loan repayment with receipt info
    await storage.updateLoanRepaymentReceipt(repayment1.id, receipt1.url, receipt1.receiptNumber);

    // Update outstanding amounts on the loan
    await storage.updateLoan(wheat_loan.id, {
      outstandingPrincipal: (parseFloat(wheat_loan.outstandingPrincipal) - parseFloat(repayment1.principalAmount)).toString(),
      outstandingInterest: (parseFloat(wheat_loan.outstandingInterest) - parseFloat(repayment1.interestAmount)).toString()
    });

    console.log('Test data generated successfully!');
    return {
      success: true,
      user: { id: 1, username: 'testuser' },
      warehouses: [warehouse1, warehouse2, warehouse3, warehouse4, warehouse5, warehouse6, warehouse7, warehouse8, warehouse9],
      commodities: [wheat, rice],
      receipts: [wheatReceipt, riceReceipt],
      loans: [wheat_loan, rice_loan],
      repayments: [repayment1],
      lendingPartners: [hdfc, sbi]
    };
  } catch (error) {
    console.error('Error generating test data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}