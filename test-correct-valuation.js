// Test the CORRECTED valuation calculation (1 MT = 1000 kg)
const baseUrl = 'http://localhost:5000/api';

async function testCorrectValuation() {
  console.log('🧮 Testing CORRECTED Valuation: Rs 50/kg with proper MT conversion\n');

  // Login
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password123' })
  });

  const setCookie = loginResponse.headers.get('set-cookie');
  const sessionCookie = setCookie ? setCookie.split(';')[0] : '';
  
  const testCases = [
    { quantity: '1', expected: 50000, name: '1 MT Test' },      // 1 MT × 1000 kg × Rs 50 = Rs 50,000
    { quantity: '10', expected: 500000, name: '10 MT Test' },   // 10 MT × 1000 kg × Rs 50 = Rs 500,000
    { quantity: '50', expected: 2500000, name: '50 MT Test' },  // 50 MT × 1000 kg × Rs 50 = Rs 2,500,000
    { quantity: '100', expected: 5000000, name: '100 MT Test' } // 100 MT × 1000 kg × Rs 50 = Rs 5,000,000
  ];
  
  for (const testCase of testCases) {
    console.log(`📦 ${testCase.name}: ${testCase.quantity} MT`);
    console.log(`   🧮 Calculation: ${testCase.quantity} MT × 1000 kg × Rs 50/kg = Rs ${testCase.expected.toLocaleString()}`);
    
    const receiptData = {
      commodityId: 1,
      warehouseId: 1,
      quantity: testCase.quantity,
      status: 'active',
      commodityName: testCase.name
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
      
      console.log(`   💰 Expected: Rs ${testCase.expected.toLocaleString()}, Actual: Rs ${actualValue.toLocaleString()}`);
      
      if (actualValue === testCase.expected) {
        console.log(`   ✅ CORRECT - Proper MT to kg conversion!\n`);
      } else {
        console.log(`   ❌ WRONG - Math error still present\n`);
      }
    } else {
      console.log(`   ❌ FAILED - Receipt creation error\n`);
    }
  }
  
  console.log('🎯 Corrected valuation test completed!');
}

testCorrectValuation().catch(console.error);