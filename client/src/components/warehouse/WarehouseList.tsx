import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Warehouse } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { formatCurrency, calculateDistance } from '@/lib/utils';

interface WarehouseListProps {
  selectedWarehouse?: Warehouse | null;
  onSelect: (warehouse: Warehouse) => void;
  userLocation?: [number, number] | null;
}

export default function WarehouseList({ selectedWarehouse, onSelect, userLocation }: WarehouseListProps) {
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['/api/warehouses'],
  });
  
  const [sortedWarehouses, setSortedWarehouses] = useState<Warehouse[]>([]);
  
  // Sort warehouses by distance if user location is available
  useEffect(() => {
    if (!warehouses) return;
    
    let sorted = [...warehouses];
    
    if (userLocation) {
      sorted.sort((a, b) => {
        const distA = calculateDistance(
          userLocation[0], 
          userLocation[1], 
          Number(a.latitude), 
          Number(a.longitude)
        );
        
        const distB = calculateDistance(
          userLocation[0], 
          userLocation[1], 
          Number(b.latitude), 
          Number(b.longitude)
        );
        
        return distA - distB;
      });
    }
    
    setSortedWarehouses(sorted);
  }, [warehouses, userLocation]);
  
  const getChannelClass = (channelType: string) => {
    switch (channelType) {
      case 'green':
        return 'channel-green';
      case 'orange':
        return 'channel-orange';
      case 'red':
        return 'channel-red';
      default:
        return '';
    }
  };
  
  const getDistanceText = (warehouse: Warehouse) => {
    if (!userLocation) return '';
    
    const distance = calculateDistance(
      userLocation[0],
      userLocation[1],
      Number(warehouse.latitude),
      Number(warehouse.longitude)
    );
    
    return `${distance.toFixed(1)} km away`;
  };
  
  if (isLoading) {
    return (
      <div className="p-4 overflow-auto" style={{ maxHeight: '240px' }}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-md bg-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 overflow-auto" style={{ maxHeight: '240px' }}>
      {sortedWarehouses && sortedWarehouses.length > 0 ? (
        sortedWarehouses.map((warehouse) => (
          <div 
            key={warehouse.id} 
            className={`${getChannelClass(warehouse.channelType)} p-3 rounded-md mb-3`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{warehouse.name}</h3>
                <p className="text-sm text-gray-600">
                  {warehouse.city}, {warehouse.state} 
                  {userLocation && ` - ${getDistanceText(warehouse)}`}
                </p>
                <div className="mt-1 flex items-center flex-wrap">
                  <span className={`text-xs font-medium ${
                    warehouse.channelType === 'green' 
                      ? 'bg-primary-100 text-primary-800' 
                      : warehouse.channelType === 'orange'
                        ? 'bg-secondary-100 text-secondary-800'
                        : 'bg-red-100 text-red-800'
                  } px-2 py-0.5 rounded`}>
                    {warehouse.channelType.charAt(0).toUpperCase() + warehouse.channelType.slice(1)} Channel
                  </span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-xs text-gray-600">Capacity: {warehouse.capacity} MT</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-xs text-gray-600">Available: {warehouse.availableSpace} MT</span>
                </div>
              </div>
              <Button 
                className={warehouse.channelType === 'green' 
                  ? 'bg-primary-500 hover:bg-primary-600' 
                  : warehouse.channelType === 'orange'
                    ? 'bg-secondary-500 hover:bg-secondary-600'
                    : 'bg-red-500 hover:bg-red-600'
                }
                onClick={() => onSelect(warehouse)}
              >
                Select
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No warehouses found.
        </div>
      )}
    </div>
  );
}
