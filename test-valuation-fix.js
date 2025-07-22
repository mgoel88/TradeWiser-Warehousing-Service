// Test script to verify valuation fix
const baseUrl = 'http://localhost:5000/api';

async function testValuationFix() {
  console.log('🧪 Testing Valuation Fix - Rs 50/kg Standard Rate\n');

  // Step 1: Login
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password123' })
  });

  if (!loginResponse.ok) {
    console.log('❌ Authentication failed');
    return;
  }

  const setCookie = loginResponse.headers.get('set-cookie');
  const sessionCookie = setCookie ? setCookie.split(';')[0] : '';

  // Step 2: Test receipt creation with different quantities
  const testCases = [
    { quantity: '10', expected: 500, commodity: 'Wheat (गेहूं)' },
    { quantity: '50', expected: 2500, commodity: 'Rice (चावल)' },
    { quantity: '100', expected: 5000, commodity: 'Sorghum (ज्वार)' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📦 Testing ${testCase.commodity} - ${testCase.quantity} MT`);
      
      const receiptData = {
        commodityId: 1,
        warehouseId: 1,
        quantity: testCase.quantity,
        status: 'active',
        commodityName: testCase.commodity
      };

      const response = await fetch(`${baseUrl}/receipts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(receiptData)
      });

      if (response.ok) {
        const receipt = await response.json();
        const actualValue = parseInt(receipt.valuation || 0);
        
        console.log(`   💰 Expected: Rs ${testCase.expected}, Actual: Rs ${actualValue}`);
        
        if (actualValue === testCase.expected) {
          console.log(`   ✅ PASS - Correct valuation at Rs 50/kg\n`);
        } else {
          console.log(`   ❌ FAIL - Valuation mismatch\n`);
        }
      } else {
        console.log(`   ❌ FAIL - Receipt creation failed: ${response.statusText}\n`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }

  // Step 3: Check existing receipts
  console.log('📋 Checking existing receipts for valuation...');
  try {
    const receiptsResponse = await fetch(`${baseUrl}/receipts`, {
      headers: { 'Cookie': sessionCookie }
    });

    if (receiptsResponse.ok) {
      const receipts = await receiptsResponse.json();
      console.log(`Found ${receipts.length} existing receipts:`);
      
      receipts.forEach((receipt, index) => {
        const value = parseInt(receipt.valuation || 0);
        const quantity = parseFloat(receipt.quantity || 0);
        const expectedValue = quantity * 50;
        
        console.log(`${index + 1}. ${receipt.receiptNumber}: ${quantity} MT = Rs ${value}`);
        console.log(`   Expected: Rs ${expectedValue}, ${value === expectedValue ? '✅' : '❌'}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error checking receipts: ${error.message}`);
  }

  console.log('\n🎯 Valuation test completed!');
}

testValuationFix().catch(console.error);