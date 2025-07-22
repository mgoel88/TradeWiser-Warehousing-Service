#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Sample deposit data for 10 different commodities
const deposits = [
  {
    type: "deposit", 
    commodityType: "cereals", 
    commodityName: "Basmati Rice Premium", 
    quantity: 250, 
    warehouseId: 1,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-25",
    scheduledTime: "10:00",
    pickupAddress: "Sector 18, Noida, UP",
    estimatedValue: 625000
  },
  {
    type: "deposit", 
    commodityType: "pulses", 
    commodityName: "Arhar Dal Grade A", 
    quantity: 150, 
    warehouseId: 2,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-25",
    scheduledTime: "14:00",
    pickupAddress: "Andheri East, Mumbai, MH",
    estimatedValue: 675000
  },
  {
    type: "deposit", 
    commodityType: "oilseeds", 
    commodityName: "Groundnut Bold", 
    quantity: 300, 
    warehouseId: 3,
    deliveryMethod: "self_delivery",
    scheduledDate: "2025-07-24",
    scheduledTime: "09:00",
    pickupAddress: "Salt Lake, Kolkata, WB",
    estimatedValue: 960000
  },
  {
    type: "deposit", 
    commodityType: "spices", 
    commodityName: "Turmeric Powder Premium", 
    quantity: 50, 
    warehouseId: 1,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-26",
    scheduledTime: "11:30",
    pickupAddress: "Connaught Place, Delhi",
    estimatedValue: 425000
  },
  {
    type: "deposit", 
    commodityType: "vegetables", 
    commodityName: "Red Onions Grade 1", 
    quantity: 500, 
    warehouseId: 2,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-23",
    scheduledTime: "08:00",
    pickupAddress: "Bandra West, Mumbai, MH",
    estimatedValue: 900000
  },
  {
    type: "deposit", 
    commodityType: "cereals", 
    commodityName: "Wheat Sharbati", 
    quantity: 400, 
    warehouseId: 3,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-27",
    scheduledTime: "15:30",
    pickupAddress: "Park Street, Kolkata, WB",
    estimatedValue: 1000000
  },
  {
    type: "deposit", 
    commodityType: "pulses", 
    commodityName: "Moong Dal Premium", 
    quantity: 200, 
    warehouseId: 1,
    deliveryMethod: "self_delivery",
    scheduledDate: "2025-07-28",
    scheduledTime: "12:00",
    pickupAddress: "Karol Bagh, Delhi",
    estimatedValue: 900000
  },
  {
    type: "deposit", 
    commodityType: "oilseeds", 
    commodityName: "Mustard Seeds Black", 
    quantity: 180, 
    warehouseId: 2,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-29",
    scheduledTime: "16:00",
    pickupAddress: "Powai, Mumbai, MH",
    estimatedValue: 576000
  },
  {
    type: "deposit", 
    commodityType: "spices", 
    commodityName: "Black Pepper Malabar", 
    quantity: 25, 
    warehouseId: 3,
    deliveryMethod: "managed_pickup",
    scheduledDate: "2025-07-30",
    scheduledTime: "10:30",
    pickupAddress: "Ballygunge, Kolkata, WB",
    estimatedValue: 212500
  },
  {
    type: "deposit", 
    commodityType: "vegetables", 
    commodityName: "Potatoes Grade A", 
    quantity: 600, 
    warehouseId: 1,
    deliveryMethod: "self_delivery",
    scheduledDate: "2025-07-31",
    scheduledTime: "07:30",
    pickupAddress: "Lajpat Nagar, Delhi",
    estimatedValue: 1080000
  }
];

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'testuser',
      password: 'password123'
    })
  });

  const cookies = response.headers.get('set-cookie');
  const sessionMatch = cookies?.match(/connect\.sid=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : null;
}

async function createDeposit(sessionId, depositData) {
  const response = await fetch(`${BASE_URL}/api/processes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `connect.sid=${sessionId}`
    },
    body: JSON.stringify(depositData)
  });
  return response.json();
}

async function completeAssessment(sessionId, processId) {
  const response = await fetch(`${BASE_URL}/api/bypass/complete-assessment/${processId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `connect.sid=${sessionId}`
    }
  });
  return response.json();
}

async function generateEWR(sessionId, processId) {
  const response = await fetch(`${BASE_URL}/api/bypass/generate-ewr/${processId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `connect.sid=${sessionId}`
    }
  });
  return response.json();
}

async function main() {
  try {
    console.log('🔑 Logging in...');
    const sessionId = await login();
    if (!sessionId) {
      throw new Error('Failed to obtain session ID');
    }
    console.log('✅ Login successful');

    console.log('\n📦 Creating 10 deposit processes...');
    const processes = [];
    
    for (let i = 0; i < deposits.length; i++) {
      const deposit = deposits[i];
      console.log(`Creating deposit ${i + 1}: ${deposit.commodityName}`);
      const process = await createDeposit(sessionId, deposit);
      processes.push(process);
      console.log(`✅ Process ${process.id} created for ${deposit.commodityName}`);
    }

    console.log('\n🧪 Running quality assessments and pricing calculations...');
    const assessments = [];
    
    for (let i = 0; i < processes.length; i++) {
      const process = processes[i];
      console.log(`Running assessment for process ${process.id}...`);
      const assessment = await completeAssessment(sessionId, process.id);
      assessments.push(assessment);
      console.log(`✅ Assessment completed for process ${process.id}`);
    }

    console.log('\n📜 Generating Electronic Warehouse Receipts (eWRs)...');
    const ewrs = [];
    
    for (let i = 0; i < processes.length; i++) {
      const process = processes[i];
      console.log(`Generating eWR for process ${process.id}...`);
      const ewr = await generateEWR(sessionId, process.id);
      ewrs.push(ewr);
      console.log(`✅ eWR ${ewr.receipt?.receiptNumber} generated for process ${process.id}`);
    }

    console.log('\n📊 Summary Report:');
    console.log(`Total Deposits Created: ${processes.length}`);
    console.log(`Total Assessments Completed: ${assessments.length}`);
    console.log(`Total eWRs Generated: ${ewrs.length}`);
    
    console.log('\n📋 Generated eWR Details:');
    ewrs.forEach((ewr, index) => {
      if (ewr.receipt) {
        console.log(`${index + 1}. ${ewr.receipt.receiptNumber} - ₹${parseInt(ewr.receipt.marketValue || 0).toLocaleString()}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();