// Test script for enhanced mandi-based warehouse system
const baseUrl = 'http://localhost:5000/api';

async function testWarehouseSystem() {
  console.log('🚀 Testing Enhanced Mandi-Based Warehouse System\n');

  // Test 1: Get all warehouses
  console.log('📊 Testing warehouse count and variety...');
  const allWarehouses = await fetch(`${baseUrl}/warehouses`).then(r => r.json());
  console.log(`✅ Total warehouses: ${allWarehouses.length}`);
  
  // Count mandi vs regular warehouses
  const mandiWarehouses = allWarehouses.filter(w => w.name.includes('TradeWiser'));
  const regularWarehouses = allWarehouses.filter(w => !w.name.includes('TradeWiser'));
  console.log(`   📍 Mandi-based warehouses: ${mandiWarehouses.length}`);
  console.log(`   🏢 Regular warehouses: ${regularWarehouses.length}\n`);

  // Test 2: Test commodity-based filtering
  console.log('🌾 Testing commodity-based warehouse filtering...');
  const wheatWarehouses = await fetch(`${baseUrl}/warehouses/by-commodity/Wheat`).then(r => r.json());
  console.log(`✅ Warehouses storing Wheat: ${wheatWarehouses.length}`);
  if (wheatWarehouses.length > 0) {
    console.log(`   Example: ${wheatWarehouses[0].name} in ${wheatWarehouses[0].city}, ${wheatWarehouses[0].state}`);
  }

  const riceWarehouses = await fetch(`${baseUrl}/warehouses/by-commodity/Rice`).then(r => r.json());
  console.log(`✅ Warehouses storing Rice: ${riceWarehouses.length}\n`);

  // Test 3: Test state-based filtering
  console.log('🗺️  Testing state-based warehouse filtering...');
  const states = [...new Set(allWarehouses.map(w => w.state))];
  console.log(`States with warehouses: ${states.join(', ')}`);
  
  for (const state of states.slice(0, 3)) { // Test first 3 states
    try {
      const stateWarehouses = await fetch(`${baseUrl}/warehouses/by-state/${encodeURIComponent(state)}`).then(r => r.json());
      if (Array.isArray(stateWarehouses)) {
        console.log(`✅ ${state}: ${stateWarehouses.length} warehouses`);
      } else {
        console.log(`❌ ${state}: Error - ${stateWarehouses.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${state}: Network error`);
    }
  }

  // Test 4: Show warehouse diversity
  console.log('\n🏭 Warehouse Infrastructure Analysis:');
  const withGodown = allWarehouses.filter(w => w.hasGodownFacilities).length;
  const withColdStorage = allWarehouses.filter(w => w.hasColdStorage).length;
  const withRailway = allWarehouses.filter(w => w.nearestRailwayStation).length;
  
  console.log(`   🏪 Warehouses with godown facilities: ${withGodown}/${allWarehouses.length}`);
  console.log(`   ❄️  Warehouses with cold storage: ${withColdStorage}/${allWarehouses.length}`);
  console.log(`   🚂 Warehouses with railway connectivity: ${withRailway}/${allWarehouses.length}`);

  // Test 5: Show mandi warehouse examples
  console.log('\n📍 Sample Mandi-Based Warehouses:');
  mandiWarehouses.slice(0, 5).forEach((warehouse, i) => {
    console.log(`${i + 1}. ${warehouse.name}`);
    console.log(`   📍 Location: ${warehouse.city}, ${warehouse.district}, ${warehouse.state}`);
    console.log(`   🏭 Type: ${warehouse.warehouseType} (${warehouse.regulationStatus})`);
    console.log(`   📦 Capacity: ${warehouse.capacity} MT (${Math.round((parseFloat(warehouse.capacity) - parseFloat(warehouse.availableSpace)) / parseFloat(warehouse.capacity) * 100)}% utilized)`);
    if (warehouse.nearestRailwayStation) {
      console.log(`   🚂 Railway: ${warehouse.nearestRailwayStation} (${warehouse.railwayDistance}km)`);
    }
    console.log(`   🌾 Primary commodities: ${warehouse.primaryCommodities?.join(', ') || 'Not specified'}`);
    console.log('');
  });

  console.log('✅ Enhanced warehouse system testing complete!');
}

testWarehouseSystem().catch(console.error);