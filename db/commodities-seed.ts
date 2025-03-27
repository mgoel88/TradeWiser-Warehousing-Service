
import { db } from '../server/db';
import { commodityCategories, defaultQualityParameters } from '../shared/schema';

const commodityCategoriesData = [
  // Cereals
  {
    name: 'Wheat',
    category: 'cereals',
    qualityParameters: defaultQualityParameters.cereals
  },
  {
    name: 'Rice',
    category: 'cereals',
    qualityParameters: defaultQualityParameters.cereals
  },
  {
    name: 'Maize',
    category: 'cereals',
    qualityParameters: defaultQualityParameters.cereals
  },
  // Pulses
  {
    name: 'Green Gram',
    category: 'pulses',
    qualityParameters: defaultQualityParameters.pulses
  },
  {
    name: 'Black Gram',
    category: 'pulses',
    qualityParameters: defaultQualityParameters.pulses
  },
  {
    name: 'Red Gram',
    category: 'pulses',
    qualityParameters: defaultQualityParameters.pulses
  },
  // Oilseeds
  {
    name: 'Soybean',
    category: 'oilseeds',
    qualityParameters: defaultQualityParameters.oilseeds
  },
  {
    name: 'Groundnut',
    category: 'oilseeds',
    qualityParameters: defaultQualityParameters.oilseeds
  },
  {
    name: 'Mustard',
    category: 'oilseeds',
    qualityParameters: defaultQualityParameters.oilseeds
  },
  // Spices
  {
    name: 'Turmeric',
    category: 'spices',
    qualityParameters: defaultQualityParameters.spices
  },
  {
    name: 'Black Pepper',
    category: 'spices',
    qualityParameters: defaultQualityParameters.spices
  },
  {
    name: 'Cardamom',
    category: 'spices',
    qualityParameters: defaultQualityParameters.spices
  }
];

async function seedCommodityCategories() {
  console.log('Seeding commodity categories...');
  try {
    const existingCategories = await db.select().from(commodityCategories);
    
    if (existingCategories.length === 0) {
      for (const category of commodityCategoriesData) {
        await db.insert(commodityCategories).values(category);
      }
      console.log('Successfully seeded commodity categories');
    } else {
      console.log('Commodity categories already exist, skipping seed');
    }
  } catch (error) {
    console.error('Failed to seed commodity categories:', error);
  }
}

seedCommodityCategories();
