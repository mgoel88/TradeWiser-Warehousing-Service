import { db } from '../server/db';
import { users, warehouses, InsertUser, InsertWarehouse } from '../shared/schema';

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Check if we already have users in the database
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('Seeding users...');
      
      // Create demo users
      const demoUser: InsertUser = {
        username: "rajiv",
        password: "securepassword", // In a real app, this would be hashed
        fullName: "Rajiv Sharma",
        email: "rajiv@example.com",
        phone: "+91 9876543210",
        role: "farmer",
        kycVerified: true,
        kycDocuments: {},
        businessDetails: {}
      };
      
      const [user] = await db.insert(users).values(demoUser).returning();
      console.log(`Created demo user: ${user.fullName}`);
      
      // Sample warehouses in various locations across India
      const warehouseData: InsertWarehouse[] = [
        // Delhi and NCR region
        {
          name: "Delhi Agri Storage Hub",
          address: "123 Warehouse St, Azadpur",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110033",
          latitude: "28.7158",
          longitude: "77.1681",
          capacity: "5000",
          availableSpace: "1500",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["wheat", "rice", "pulses"] },
          facilities: { cleaning: true, sorting: true, packaging: true }
        },
        {
          name: "Ghaziabad Storage Solutions",
          address: "456 Storage Ave, Sahibabad",
          city: "Ghaziabad",
          state: "Uttar Pradesh",
          pincode: "201005",
          latitude: "28.6668",
          longitude: "77.3412",
          capacity: "3500",
          availableSpace: "800",
          channelType: "orange",
          ownerId: user.id,
          specializations: { crops: ["wheat", "rice"] },
          facilities: { cleaning: true, sorting: true, packaging: false }
        },
        {
          name: "Gurugram Modern Storage",
          address: "789 Modern Rd, Sector 34",
          city: "Gurugram",
          state: "Haryana",
          pincode: "122001",
          latitude: "28.4436",
          longitude: "77.0241",
          capacity: "7000",
          availableSpace: "2200",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["wheat", "rice", "pulses", "oilseeds"] },
          facilities: { cleaning: true, sorting: true, packaging: true, refrigeration: true }
        },
        
        // Mumbai and Maharashtra region
        {
          name: "Mumbai Port Warehouse",
          address: "10 Port Area, Mazgaon",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400010",
          latitude: "18.9633",
          longitude: "72.8411",
          capacity: "8000",
          availableSpace: "3500",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["rice", "spices", "fruits"] },
          facilities: { refrigeration: true, packaging: true, quality_testing: true }
        },
        {
          name: "Pune Agricultural Depot",
          address: "25 APMC Market, Hadapsar",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411028",
          latitude: "18.5089",
          longitude: "73.9260",
          capacity: "4500",
          availableSpace: "2100",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["sugarcane", "vegetables", "grains"] },
          facilities: { cleaning: true, sorting: true, cold_storage: true }
        },
        
        // Punjab region
        {
          name: "Ludhiana Grain Storage",
          address: "78 Grain Market Road",
          city: "Ludhiana",
          state: "Punjab",
          pincode: "141001",
          latitude: "30.9010",
          longitude: "75.8573",
          capacity: "9000",
          availableSpace: "2000",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["wheat", "rice", "maize"] },
          facilities: { cleaning: true, drying: true, quality_testing: true }
        },
        {
          name: "Amritsar Food Logistics",
          address: "45 GT Road",
          city: "Amritsar",
          state: "Punjab",
          pincode: "143001",
          latitude: "31.6340",
          longitude: "74.8723",
          capacity: "6500",
          availableSpace: "1200",
          channelType: "orange",
          ownerId: user.id,
          specializations: { crops: ["wheat", "rice"] },
          facilities: { cleaning: true, packaging: true, refrigeration: false }
        },
        
        // Southern India
        {
          name: "Chennai Port Storage",
          address: "7 Harbor Road",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
          latitude: "13.0827",
          longitude: "80.2707",
          capacity: "7500",
          availableSpace: "3200",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["rice", "spices", "cotton"] },
          facilities: { cleaning: true, sorting: true, fumigation: true }
        },
        {
          name: "Bangalore Fresh Produce Hub",
          address: "120 Electronics City",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560100",
          latitude: "12.9716",
          longitude: "77.5946",
          capacity: "5500",
          availableSpace: "1800",
          channelType: "green",
          ownerId: user.id,
          specializations: { crops: ["vegetables", "fruits", "coffee"] },
          facilities: { refrigeration: true, packaging: true, quality_testing: true }
        },
        {
          name: "Kochi Spice Storage",
          address: "34 Spice Market Road",
          city: "Kochi",
          state: "Kerala",
          pincode: "682001",
          latitude: "9.9312",
          longitude: "76.2673",
          capacity: "3200",
          availableSpace: "900",
          channelType: "orange",
          ownerId: user.id,
          specializations: { crops: ["pepper", "cardamom", "tea"] },
          facilities: { drying: true, fumigation: true, packaging: true }
        },
      ];
      
      console.log('Seeding warehouses...');
      for (const warehouse of warehouseData) {
        await db.insert(warehouses).values(warehouse);
      }
      
      console.log(`Successfully seeded ${warehouseData.length} warehouses`);
    } else {
      console.log('Database already has users, skipping seed process');
    }
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Failed to seed the database:', error);
  }
}

// Run the seed
seedDatabase();