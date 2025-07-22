import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, MapPin, Building2, Train } from "lucide-react";

interface Warehouse {
  id: number;
  name: string;
  mandiName?: string;
  city: string;
  district?: string;
  state: string;
  capacity: string;
  availableSpace: string;
  warehouseType?: string;
  regulationStatus?: string;
  nearestRailwayStation?: string;
  railwayDistance?: string;
  primaryCommodities?: string[];
  hasGodownFacilities?: boolean;
  hasColdStorage?: boolean;
  hasGradingFacility?: boolean;
}

interface WarehouseSelectorProps {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  onSelect: (warehouse: Warehouse) => void;
}

export function WarehouseSelector({ warehouses, selectedWarehouse, onSelect }: WarehouseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Function to calculate warehouse relevance score (enhanced)
  const calculateRelevanceScore = (warehouse: Warehouse): number => {
    let score = 0;
    
    // Capacity utilization analysis (40 points max)
    const capacity = parseFloat(warehouse.capacity);
    const available = parseFloat(warehouse.availableSpace);
    const utilizationRate = (capacity - available) / capacity;
    
    // Premium utilization rates (not too empty, not too full)
    if (utilizationRate >= 0.3 && utilizationRate <= 0.7) {
      score += 40; // Sweet spot for active warehouses
    } else if (utilizationRate >= 0.2 && utilizationRate <= 0.8) {
      score += 30; // Good utilization
    } else if (utilizationRate < 0.9) {
      score += 15; // Available but maybe underutilized
    }
    
    // Capacity scale bonus (30 points max)
    if (capacity >= 20000) score += 30; // Mega warehouses
    else if (capacity >= 15000) score += 25; // Large scale
    else if (capacity >= 10000) score += 20; // Good size
    else if (capacity >= 5000) score += 15; // Medium size
    else if (capacity >= 2000) score += 10; // Small-medium
    else if (capacity >= 1000) score += 5; // Minimum viable
    
    // Advanced facility scoring (35 points max)
    let facilityScore = 0;
    if (warehouse.hasGodownFacilities) facilityScore += 15; // Essential
    if (warehouse.hasColdStorage) facilityScore += 20; // Premium feature
    if (warehouse.hasGradingFacility) facilityScore += 15; // Quality control
    score += Math.min(facilityScore, 35); // Cap at 35
    
    // Strategic location scoring (25 points max)
    if (warehouse.nearestRailwayStation && warehouse.railwayDistance) {
      const distStr = warehouse.railwayDistance.replace(/[^\d.]/g, '');
      const distance = parseFloat(distStr) || 999;
      if (distance <= 1) score += 25; // Prime connectivity
      else if (distance <= 2) score += 20; // Excellent connectivity
      else if (distance <= 3) score += 15; // Good connectivity
      else if (distance <= 5) score += 10; // Decent connectivity
      else if (distance <= 10) score += 5; // Basic connectivity
    }
    
    // Market integration bonus (20 points max)
    if (warehouse.mandiName) {
      score += 20; // Authentic mandi integration
      // Extra bonus for major mandi centers
      const premiumMandis = ['Karnal', 'Ludhiana', 'Sirsa', 'Hisar', 'Panipat'];
      if (premiumMandis.some(mandi => warehouse.mandiName?.includes(mandi))) {
        score += 5;
      }
    }
    
    // Agricultural hub states (15 points max)
    const premiumStates = ['Haryana', 'Punjab', 'Uttar Pradesh']; // Top 3
    const majorStates = ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Gujarat']; // Major
    if (premiumStates.includes(warehouse.state)) score += 15;
    else if (majorStates.includes(warehouse.state)) score += 10;
    else score += 5; // All states get base points
    
    // Regulation compliance bonus (10 points max)
    if (warehouse.regulationStatus === 'fci_approved') score += 10;
    else if (warehouse.regulationStatus === 'wdra_registered') score += 8;
    else if (warehouse.regulationStatus === 'state_licensed') score += 5;
    
    // Available space adequacy (bonus system)
    if (available >= 5000) score += 10; // Plenty of space
    else if (available >= 2000) score += 7; // Good space
    else if (available >= 1000) score += 5; // Adequate space
    else if (available >= 500) score += 2; // Limited space
    
    return Math.round(score);
  };

  // Enhanced filtering and sorting for warehouses
  const filteredWarehouses = warehouses
    .filter(warehouse => {
      if (!searchValue.trim()) return true;
      
      const searchTerm = searchValue.toLowerCase();
      return (
        warehouse.name.toLowerCase().includes(searchTerm) ||
        warehouse.mandiName?.toLowerCase().includes(searchTerm) ||
        warehouse.city.toLowerCase().includes(searchTerm) ||
        warehouse.district?.toLowerCase().includes(searchTerm) ||
        warehouse.state.toLowerCase().includes(searchTerm) ||
        warehouse.nearestRailwayStation?.toLowerCase().includes(searchTerm) ||
        warehouse.primaryCommodities?.some(c => c.toLowerCase().includes(searchTerm))
      );
    })
    .sort((a, b) => {
      // Sort by relevance score (highest first)
      return calculateRelevanceScore(b) - calculateRelevanceScore(a);
    });

  // Group warehouses by state for better organization
  const warehousesByState = filteredWarehouses.reduce((groups, warehouse) => {
    const state = warehouse.state;
    if (!groups[state]) groups[state] = [];
    groups[state].push(warehouse);
    return groups;
  }, {} as Record<string, Warehouse[]>);

  const getCapacityText = (warehouse: Warehouse) => {
    const capacity = parseFloat(warehouse.capacity);
    const available = parseFloat(warehouse.availableSpace);
    const utilizationPercent = Math.round(((capacity - available) / capacity) * 100);
    
    return `${capacity.toLocaleString()} MT (${utilizationPercent}% utilized)`;
  };

  const getWarehouseTypeColor = (type?: string) => {
    switch (type) {
      case 'terminal_market': return 'bg-blue-100 text-blue-800';
      case 'primary_market': return 'bg-green-100 text-green-800';
      case 'secondary_market': return 'bg-yellow-100 text-yellow-800';
      case 'processing_unit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatWarehouseType = (type?: string) => {
    return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Market';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between min-h-[60px] p-3"
          onClick={() => setOpen(true)}
        >
          {selectedWarehouse ? (
            <div className="flex flex-col items-start">
              <span className="font-semibold">{selectedWarehouse.name}</span>
              <span className="text-sm text-muted-foreground">
                {selectedWarehouse.city}, {selectedWarehouse.state} • {getCapacityText(selectedWarehouse)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select warehouse...</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[600px] p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Search by warehouse name, city, state, or commodity..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {!searchValue.trim() && filteredWarehouses.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 border-b">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">
                  Top {Math.min(filteredWarehouses.length, 10)} Recommended Warehouses
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Based on capacity, location, facilities, and connectivity
              </p>
            </div>
          )}
          
          {Object.keys(warehousesByState).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No warehouses found matching your search.
            </div>
          ) : (
            Object.entries(warehousesByState).map(([state, stateWarehouses]) => (
              <div key={state} className="border-b last:border-b-0">
                <div className="px-4 py-2 bg-muted font-semibold text-sm flex items-center justify-between">
                  <span>{state} ({stateWarehouses.length})</span>
                  {!searchValue.trim() && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Sorted by relevance
                    </span>
                  )}
                </div>
                
                {stateWarehouses.map((warehouse, index) => {
                  const relevanceScore = calculateRelevanceScore(warehouse);
                  const isHighRecommended = relevanceScore >= 80;
                  const isRecommended = relevanceScore >= 60;
                  
                  return (
                    <div 
                      key={warehouse.id}
                      className={`p-4 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors ${
                        isHighRecommended ? 'bg-green-50 hover:bg-green-100' : 
                        isRecommended ? 'bg-blue-50 hover:bg-blue-100' : ''
                      }`}
                      onClick={() => {
                        onSelect(warehouse);
                        setOpen(false);
                        setSearchValue("");
                      }}
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{warehouse.name}</h4>
                                {isHighRecommended && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    ⭐ Top Choice
                                  </Badge>
                                )}
                                {isRecommended && !isHighRecommended && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              {warehouse.mandiName && warehouse.mandiName !== warehouse.city && (
                                <p className="text-sm text-muted-foreground">
                                  Based on {warehouse.mandiName} Mandi
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getWarehouseTypeColor(warehouse.warehouseType)}>
                              {formatWarehouseType(warehouse.warehouseType)}
                            </Badge>
                            {!searchValue.trim() && (
                              <span className="text-xs text-muted-foreground">
                                Score: {relevanceScore}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {warehouse.district && warehouse.district !== warehouse.city ? 
                              `${warehouse.city}, ${warehouse.district}` : 
                              warehouse.city
                            }
                          </div>
                          
                          {warehouse.nearestRailwayStation && (
                            <div className="flex items-center gap-1">
                              <Train className="h-3 w-3" />
                              {warehouse.nearestRailwayStation} 
                              {warehouse.railwayDistance && ` (${warehouse.railwayDistance})`}
                            </div>
                          )}
                        </div>

                        {/* Capacity and Facilities */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">{getCapacityText(warehouse)}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            {warehouse.hasGodownFacilities && (
                              <Badge variant="outline" className="text-xs">Godown</Badge>
                            )}
                            {warehouse.hasColdStorage && (
                              <Badge variant="outline" className="text-xs">Cold Storage</Badge>
                            )}
                            {warehouse.hasGradingFacility && (
                              <Badge variant="outline" className="text-xs">Grading</Badge>
                            )}
                          </div>
                        </div>

                        {/* Primary Commodities */}
                        {warehouse.primaryCommodities && warehouse.primaryCommodities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {warehouse.primaryCommodities.slice(0, 4).map((commodity, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {commodity}
                              </Badge>
                            ))}
                            {warehouse.primaryCommodities.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{warehouse.primaryCommodities.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}