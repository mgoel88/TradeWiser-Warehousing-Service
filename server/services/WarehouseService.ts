import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Warehouse {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  commodity_specialization: string[];
  total_capacity_mt: number;
  available_capacity_mt: number;
  quality_rating: number;
  certifications: string[];
  contact_number: string;
  manager_name: string;
}

interface WarehouseScore {
  warehouse: Warehouse;
  score: number;
  proximityScore: number;
  availabilityScore: number;
  qualityScore: number;
  distance: number;
}

class WarehouseService {
  private warehouses: Warehouse[] = [];

  constructor() {
    this.loadWarehouses();
  }

  private loadWarehouses() {
    try {
      const warehousesPath = path.join(process.cwd(), 'server/data/warehouses_india.json');
      const data = fs.readFileSync(warehousesPath, 'utf-8');
      this.warehouses = JSON.parse(data);
      console.log(`Loaded ${this.warehouses.length} warehouses from database`);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      this.warehouses = [];
    }
  }

  /**
   * Calculate distance between two geographic coordinates using Haversine formula
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate proximity score (inverse of distance, normalized)
   * Closer warehouses get higher scores
   */
  private calculateProximityScore(distance: number): number {
    // Using exponential decay: score decreases as distance increases
    // Max score of 100 for distance 0, approaches 0 for large distances
    const decayFactor = 0.01; // Adjust this to change how quickly score decreases
    return 100 * Math.exp(-decayFactor * distance);
  }

  /**
   * Calculate availability score based on available capacity and commodity match
   */
  private calculateAvailabilityScore(
    warehouse: Warehouse,
    commodity: string,
    requiredQuantity: number
  ): number {
    let score = 0;

    // Check if warehouse specializes in this commodity (50 points)
    if (warehouse.commodity_specialization.includes(commodity)) {
      score += 50;
    }

    // Check if warehouse has sufficient capacity (50 points max)
    if (warehouse.available_capacity_mt >= requiredQuantity) {
      // Full points if capacity is sufficient
      score += 50;
    } else {
      // Partial points based on how much capacity is available
      const capacityRatio = warehouse.available_capacity_mt / requiredQuantity;
      score += 50 * capacityRatio;
    }

    return score;
  }

  /**
   * Calculate quality score based on warehouse rating and certifications
   */
  private calculateQualityScore(warehouse: Warehouse): number {
    let score = 0;

    // Quality rating (0-5) contributes 60 points max
    score += (warehouse.quality_rating / 5) * 60;

    // Certifications contribute 40 points max
    const certificationScore = Math.min(warehouse.certifications.length * 10, 40);
    score += certificationScore;

    return score;
  }

  /**
   * Get warehouses ranked by suitability for a deposit request
   * @param pickupLat Pickup location latitude
   * @param pickupLon Pickup location longitude
   * @param commodity Commodity type
   * @param quantity Required quantity in MT
   * @param limit Maximum number of results to return
   * @returns Ranked list of warehouses with scores
   */
  public getRankedWarehouses(
    pickupLat: number,
    pickupLon: number,
    commodity: string,
    quantity: number,
    limit: number = 10
  ): WarehouseScore[] {
    // Weights for different factors (should sum to 1.0)
    const PROXIMITY_WEIGHT = 0.5;  // 50% weight to proximity
    const AVAILABILITY_WEIGHT = 0.3; // 30% weight to availability
    const QUALITY_WEIGHT = 0.2;     // 20% weight to quality

    const scoredWarehouses: WarehouseScore[] = this.warehouses.map(warehouse => {
      const warehouseLat = parseFloat(warehouse.latitude);
      const warehouseLon = parseFloat(warehouse.longitude);

      // Calculate distance
      const distance = this.calculateDistance(pickupLat, pickupLon, warehouseLat, warehouseLon);

      // Calculate individual scores
      const proximityScore = this.calculateProximityScore(distance);
      const availabilityScore = this.calculateAvailabilityScore(warehouse, commodity, quantity);
      const qualityScore = this.calculateQualityScore(warehouse);

      // Calculate weighted composite score
      const score = 
        (PROXIMITY_WEIGHT * proximityScore) +
        (AVAILABILITY_WEIGHT * availabilityScore) +
        (QUALITY_WEIGHT * qualityScore);

      return {
        warehouse,
        score,
        proximityScore,
        availabilityScore,
        qualityScore,
        distance
      };
    });

    // Sort by score (highest first) and return top results
    return scoredWarehouses
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get all warehouses (for admin/listing purposes)
   */
  public getAllWarehouses(): Warehouse[] {
    return this.warehouses;
  }

  /**
   * Get warehouse by ID
   */
  public getWarehouseById(id: number): Warehouse | undefined {
    return this.warehouses.find(w => w.id === id);
  }
}

// Export singleton instance
export const warehouseService = new WarehouseService();
export type { Warehouse, WarehouseScore };
