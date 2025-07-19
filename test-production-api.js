#!/usr/bin/env node

// Test script to verify production API endpoints are working
import http from 'http';

function testApiEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const isJson = res.headers['content-type']?.includes('application/json');
          console.log(`${method} ${path}: Status ${res.statusCode}, Content-Type: ${res.headers['content-type']}, Is JSON: ${isJson}`);
          if (isJson) {
            const parsed = JSON.parse(body);
            console.log(`Response: ${JSON.stringify(parsed).slice(0, 100)}...`);
            resolve({ status: res.statusCode, data: parsed, isJson });
          } else {
            console.log(`HTML Response detected (${body.length} chars), first 100 chars:`, body.slice(0, 100));
            resolve({ status: res.statusCode, data: body, isJson });
          }
        } catch (e) {
          console.log(`Parse error: ${e.message}`);
          resolve({ status: res.statusCode, data: body, isJson: false });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`Request error for ${path}:`, err.message);
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testApiEndpoints() {
  console.log('Testing Production API Endpoints...\n');
  
  try {
    // Test basic API endpoint
    await testApiEndpoint('/api/test');
    
    // Test warehouses endpoint (should return JSON)
    await testApiEndpoint('/api/warehouses');
    
    // Test login endpoint
    const loginResult = await testApiEndpoint('/api/auth/login', 'POST', {
      username: 'testuser',
      password: 'password123'
    });
    
    // Test processes endpoint (the problematic one)
    await testApiEndpoint('/api/processes', 'POST', {
      type: 'deposit',
      commodityName: 'Test Vegetables',
      commodityType: 'Vegetables',
      quantity: '10',
      warehouseId: '1',
      deliveryMethod: 'pickup',
      scheduledDate: '2025-07-15',
      scheduledTime: '15:00',
      pickupAddress: 'Test Address',
      estimatedValue: '50000'
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests
testApiEndpoints();