// Debug script to trace exactly where valuation is being lost
const baseUrl = 'http://localhost:5000/api';

async function debugValuation() {
  console.log('🔍 DEBUGGING VALUATION ISSUE\n');

  // Step 1: Login and get session
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
  
  // Step 2: Create a simple receipt with explicit valuation
  console.log('📦 Creating receipt with explicit valuation...');
  
  const explicitReceiptData = {
    commodityId: 1,
    warehouseId: 1,
    quantity: '25',
    valuation: '1250', // Explicitly set 25 MT * Rs 50/kg = Rs 1250
    status: 'active',
    commodityName: 'Test Wheat'
  };
  
  console.log('Sending data:', JSON.stringify(explicitReceiptData, null, 2));
  
  const createResponse = await fetch(`${baseUrl}/receipts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify(explicitReceiptData)
  });
  
  if (createResponse.ok) {
    const createdReceipt = await createResponse.json();
    console.log('\n✅ Created receipt response:');
    console.log(`   ID: ${createdReceipt.id}`);
    console.log(`   Receipt Number: ${createdReceipt.receiptNumber}`);
    console.log(`   Quantity: ${createdReceipt.quantity}`);
    console.log(`   Valuation: ${createdReceipt.valuation} (Expected: 1250)`);
    console.log(`   Status: ${createdReceipt.status}`);
    
    // Step 3: Fetch the same receipt back
    console.log('\n🔄 Fetching receipt back...');
    const fetchResponse = await fetch(`${baseUrl}/receipts`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (fetchResponse.ok) {
      const receipts = await fetchResponse.json();
      const ourReceipt = receipts.find(r => r.id === createdReceipt.id);
      
      console.log('📋 Fetched receipt:');
      console.log(`   ID: ${ourReceipt?.id}`);
      console.log(`   Receipt Number: ${ourReceipt?.receiptNumber}`);
      console.log(`   Quantity: ${ourReceipt?.quantity}`);
      console.log(`   Valuation: ${ourReceipt?.valuation} (Expected: 1250)`);
      console.log(`   Raw valuation type: ${typeof ourReceipt?.valuation}`);
      
      // Step 4: Check all fields 
      console.log('\n🧪 All fields in fetched receipt:');
      Object.keys(ourReceipt || {}).forEach(key => {
        console.log(`   ${key}: ${ourReceipt[key]} (${typeof ourReceipt[key]})`);
      });
      
    }
    
  } else {
    console.log('❌ Receipt creation failed:', createResponse.statusText);
    console.log('Response:', await createResponse.text());
  }
}

debugValuation().catch(console.error);