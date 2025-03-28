import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// Setup cookie jar for maintaining session
const cookieJar = new CookieJar();
const client = wrapper(axios.create({ 
  jar: cookieJar,
  withCredentials: true 
}));

// Local server URL
const SERVER_URL = 'http://localhost:5000';

// Test user for authenticating
const TEST_USER = {
  username: 'testuser2',  // Using a different username to avoid existing user
  password: 'password123',
  email: 'test2@example.com',
  fullName: 'Test User 2',
  role: 'farmer'
};

// Register a test user
async function registerTestUser() {
  try {
    const response = await client.post(`${SERVER_URL}/api/auth/register`, TEST_USER);
    console.log('Register response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error registering test user:', error.message);
    throw error;
  }
}

// Login with the test user
async function loginTestUser() {
  try {
    const response = await client.post(`${SERVER_URL}/api/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error logging in test user:', error.message);
    throw error;
  }
}

// Check the current session
async function checkSession() {
  try {
    const response = await client.get(`${SERVER_URL}/api/auth/session`);
    console.log('Session check response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking session:', error.message);
    throw error;
  }
}

// Create a test warehouse
async function createTestWarehouse() {
  try {
    const response = await client.post(`${SERVER_URL}/api/warehouses`, {
      name: `Test Warehouse ${Date.now()}`,
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      latitude: '12.345678',
      longitude: '12.345678',
      capacity: '1000',
      availableSpace: '1000',
      channelType: 'green'
    });
    console.log('Create warehouse response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating test warehouse:', error.message);
    throw error;
  }
}

// Get all sacks
async function getAllSacks() {
  try {
    const response = await client.get(`${SERVER_URL}/api/commodity-sacks`);
    console.log('Get all sacks response count:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('Error getting all sacks:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
}

// Get a sack by ID
async function getSackById(sackId) {
  try {
    const response = await client.get(`${SERVER_URL}/api/commodity-sacks/${sackId}`);
    console.log('Get sack response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting sack:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
}

// Create a test commodity sack
async function createTestCommoditySack(warehouseId) {
  try {
    const response = await client.post(`${SERVER_URL}/api/commodity-sacks`, {
      sackId: `TEST-SACK-${Date.now()}`,
      warehouseId: warehouseId,
      commodityId: 1,
      weight: "50.00",
      qualityParameters: {
        moisture: 12.5,
        foreignMatter: 1.2,
        brokenGrains: 3.0
      },
      locationInWarehouse: 'Row A, Shelf 1',
      metadata: {
        notes: 'Test sack created via API'
      }
    });
    console.log('Create commodity sack response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating test commodity sack:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    // Try to register a new user
    let user;
    try {
      user = await registerTestUser();
      if (user.message && user.message.includes('exists')) {
        console.log('User already exists, trying to login...');
        user = await loginTestUser();
      }
    } catch (error) {
      console.log('Registration failed, trying to login...');
      user = await loginTestUser();
    }

    if (!user || (user.message && user.message.includes('error'))) {
      console.error('Could not authenticate user');
      return;
    }

    // Check if we're properly logged in
    const session = await checkSession();
    if (session.message && session.message.includes('Not authenticated')) {
      console.error('Session is not valid');
      return;
    }
    
    console.log('Successfully authenticated as:', session.username);

    // Create warehouse
    const warehouse = await createTestWarehouse();
    
    if (!warehouse || !warehouse.id) {
      console.error('Could not create warehouse');
      return;
    }

    // Create commodity sack
    const sack = await createTestCommoditySack(warehouse.id);
    
    if (!sack || !sack.id) {
      console.error('Could not create commodity sack');
      return;
    }
    
    console.log('Successfully created commodity sack with ID:', sack.id);
    
    // Retrieve the sack we just created
    const retrievedSack = await getSackById(sack.id);
    if (retrievedSack && retrievedSack.id === sack.id) {
      console.log('Successfully retrieved the commodity sack by ID');
    } else {
      console.error('Failed to retrieve the commodity sack by ID');
    }
    
    // Retrieve all sacks
    const allSacks = await getAllSacks();
    if (allSacks && allSacks.length > 0) {
      console.log(`Successfully retrieved all commodity sacks (${allSacks.length} total)`);
    } else {
      console.error('Failed to retrieve all commodity sacks');
    }
    
    console.log('Test complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();