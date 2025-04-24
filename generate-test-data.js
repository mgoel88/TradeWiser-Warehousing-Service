/**
 * Script to generate test data for TradeWiser platform
 * Run using: node generate-test-data.js
 * @type {module}
 */

import fetch from 'node-fetch';

async function generateTestData() {
  try {
    console.log('Generating test data for TradeWiser platform...');
    
    const response = await fetch('http://localhost:5000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test data generated successfully!');
      console.log('Summary:');
      console.log(`- User: ${result.user.username} (ID: ${result.user.id})`);
      console.log(`- Warehouses: ${result.warehouses.length}`);
      console.log(`- Commodities: ${result.commodities.length}`);
      console.log(`- Warehouse Receipts: ${result.receipts.length}`);
      console.log(`- Loans: ${result.loans.length}`);
      console.log(`- Lending Partners: ${result.lendingPartners.length}`);
      console.log(`- Loan Repayments: ${result.repayments.length}`);
      
      // Print out warehouse locations for reference
      console.log('\nWarehouse Locations:');
      result.warehouses.forEach((warehouse, index) => {
        console.log(`${index + 1}. ${warehouse.name} - ${warehouse.city}, ${warehouse.state}`);
      });
      
      console.log('\nTest the platform at: http://localhost:5000/');
    } else {
      console.error('❌ Failed to generate test data:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateTestData();