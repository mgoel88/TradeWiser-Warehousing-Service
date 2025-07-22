// Final validation of the corrected valuation system
const baseUrl = 'http://localhost:5000/api';

async function validateCorrectValuation() {
  console.log('🔧 FINAL VALIDATION: Correct Valuation System (1 MT = 1000 kg)\n');
  console.log('Expected rates:');
  console.log('• 1 MT = Rs 50,000 (1000 kg × Rs 50/kg)');
  console.log('• 10 MT = Rs 500,000 (10,000 kg × Rs 50/kg)');
  console.log('• 250 MT = Rs 12,500,000 (250,000 kg × Rs 50/kg)');
  console.log('');

  // Login
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

  // Test cases with correct expected values
  const testCases = [
    { quantity: '1', expected: 50000, description: '1 MT → Rs 50,000' },
    { quantity: '10', expected: 500000, description: '10 MT → Rs 500,000' },
    { quantity: '250', expected: 12500000, description: '250 MT → Rs 12,500,000' },
  ];
  
  let allCorrect = true;
  
  for (const testCase of testCases) {
    console.log(`\n📦 Testing ${testCase.description}`);
    
    const receiptData = {
      commodityId: 1,
      warehouseId: 1,
      quantity: testCase.quantity,
      status: 'active',
      commodityName: 'Validation Test'
    };
    
    try {
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
        
        if (actualValue === testCase.expected) {
          console.log(`   ✅ CORRECT: Rs ${actualValue.toLocaleString()}`);
        } else {
          console.log(`   ❌ WRONG: Rs ${actualValue.toLocaleString()} (Expected: Rs ${testCase.expected.toLocaleString()})`);
          allCorrect = false;
        }
      } else {
        console.log(`   ❌ API ERROR: ${response.statusText}`);
        allCorrect = false;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      allCorrect = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allCorrect) {
    console.log('🎉 VALIDATION PASSED: All valuations correct!');
    console.log('✅ Mathematical conversion working: 1 MT = 1000 kg × Rs 50/kg');
    console.log('✅ System ready for production with correct pricing');
  } else {
    console.log('❌ VALIDATION FAILED: Some valuations still incorrect');
    console.log('⚠️  Critical business bug - pricing calculations wrong');
  }
  console.log('='.repeat(60));
}

validateCorrectValuation().catch(console.error);