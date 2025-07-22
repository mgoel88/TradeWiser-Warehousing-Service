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

  // Enhanced filtering for warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
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
          {Object.keys(warehousesByState).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No warehouses found matching your search.
            </div>
          ) : (
            Object.entries(warehousesByState).map(([state, stateWarehouses]) => (
              <div key={state} className="border-b last:border-b-0">
                <div className="px-4 py-2 bg-muted font-semibold text-sm">
                  {state} ({stateWarehouses.length})
                </div>
                
                {stateWarehouses.map((warehouse) => (
                  <div 
                    key={warehouse.id}
                    className="p-4 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => {
                      onSelect(warehouse);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{warehouse.name}</h4>
                          {warehouse.mandiName && warehouse.mandiName !== warehouse.city && (
                            <p className="text-sm text-muted-foreground">
                              Based on {warehouse.mandiName} Mandi
                            </p>
                          )}
                        </div>
                        <Badge className={getWarehouseTypeColor(warehouse.warehouseType)}>
                          {formatWarehouseType(warehouse.warehouseType)}
                        </Badge>
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
                            {warehouse.railwayDistance && ` (${warehouse.railwayDistance} km)`}
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
                          {warehouse.primaryCommodities.slice(0, 4).map((commodity, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
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
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}