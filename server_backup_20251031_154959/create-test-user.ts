/**
 * Create a test user for development and testing
 */
import { storage } from './storage';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername('testuser');
    
    if (existingUser) {
      console.log('Test user already exists, skipping creation');
      return;
    }
    
    // Create test user
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      email: 'testuser@example.com',
      fullName: 'Test User',
      phone: '+919876543210',
      role: 'user',
      address: 'Test Address, New Delhi',
      kycVerified: true
    });
    
    console.log('Test user created successfully:', user.id);
  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}

// Execute the function
createTestUser().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});