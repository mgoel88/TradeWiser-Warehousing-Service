// Test default valuation calculation (Rs 50/kg when not explicitly provided)
const baseUrl = 'http://localhost:5000/api';

async function testDefaultValuation() {
  console.log('🧪 Testing Default Rs 50/kg Valuation\n');

  // Login
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password123' })
  });

  const setCookie = loginResponse.headers.get('set-cookie');
  const sessionCookie = setCookie ? setCookie.split(';')[0] : '';
  
  const testCases = [
    { quantity: '10', expected: 500, name: 'Small Wheat Lot' },
    { quantity: '50', expected: 2500, name: 'Medium Rice Lot' }, 
    { quantity: '100', expected: 5000, name: 'Large Sorghum Lot' }
  ];
  
  for (const testCase of testCases) {
    console.log(`📦 Testing ${testCase.name}: ${testCase.quantity} MT`);
    
    // Create receipt WITHOUT explicit valuation - should default to Rs 50/kg
    const receiptData = {
      commodityId: 1,
      warehouseId: 1,
      quantity: testCase.quantity,
      status: 'active',
      commodityName: testCase.name
      // NO valuation field - should default to quantity * 50
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
        console.log(`   ✅ PASS - Default valuation working!\n`);
      } else {
        console.log(`   ❌ FAIL - Default valuation not applied\n`);
      }
    } else {
      console.log(`   ❌ FAIL - Receipt creation failed\n`);
    }
  }
  
  console.log('🎯 Default valuation test completed!');
}

testDefaultValuation().catch(console.error);