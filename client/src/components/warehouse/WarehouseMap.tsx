import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Warehouse } from '@shared/schema';

// @ts-ignore - importing from CDN
const L = window.L;

interface MapMarker {
  id: number;
  latlng: [number, number];
  count: number;
  type: 'green' | 'orange' | 'red';
}

export default function WarehouseMap({ onSelectWarehouse }: { onSelectWarehouse: (warehouse: Warehouse) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [leafletMap, setLeafletMap] = useState<any>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['/api/warehouses'],
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMap) return;

    // Default view of India
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setLeafletMap(map);

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          map.setView([latitude, longitude], 12);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [leafletMap]);

  // Add warehouse markers to map
  useEffect(() => {
    if (!leafletMap || !warehouses) return;

    // Clear existing markers
    leafletMap.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        leafletMap.removeLayer(layer);
      }
    });

    // Group nearby warehouses
    const groupedMarkers: MapMarker[] = [];
    
    warehouses.forEach((warehouse: Warehouse) => {
      const latlng: [number, number] = [Number(warehouse.latitude), Number(warehouse.longitude)];
      
      // Check if there's already a marker nearby
      const existingMarker = groupedMarkers.find(marker => {
        const distance = leafletMap.distance(marker.latlng, latlng);
        return distance < 5000; // 5km radius
      });
      
      if (existingMarker) {
        existingMarker.count += 1;
      } else {
        groupedMarkers.push({
          id: warehouse.id,
          latlng,
          count: 1,
          type: warehouse.channelType as 'green' | 'orange' | 'red'
        });
      }
    });
    
    setMarkers(groupedMarkers);
    
    // Add markers to map
    groupedMarkers.forEach(marker => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${getMarkerColor(marker.type)}; color: white; width: 32px; height: 32px; 
               display: flex; align-items: center; justify-content: center; border-radius: 50%; 
               font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${marker.count}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      L.marker(marker.latlng, { icon })
        .addTo(leafletMap)
        .on('click', () => {
          // If single warehouse, select it directly
          if (marker.count === 1) {
            const warehouse = warehouses.find((w: Warehouse) => w.id === marker.id);
            if (warehouse) onSelectWarehouse(warehouse);
          } else {
            // Otherwise zoom in to show individual warehouses
            leafletMap.setView(marker.latlng, leafletMap.getZoom() + 2);
          }
        });
    });
    
    // Add user location marker if available
    if (userLocation) {
      L.marker(userLocation, {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #1976D2; color: white; width: 32px; height: 32px; 
                 display: flex; align-items: center; justify-content: center; border-radius: 50%; 
                 font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                   <circle cx="12" cy="10" r="3"/>
                 </svg>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(leafletMap);
    }
  }, [leafletMap, warehouses, userLocation, onSelectWarehouse]);

  const handleSearch = () => {
    // In a real app, this would call a geocoding API
    // For now, we'll just center on a predefined location for "Delhi"
    if (location.toLowerCase().includes('delhi')) {
      leafletMap.setView([28.6139, 77.2090], 12);
    } else if (location.toLowerCase().includes('mumbai')) {
      leafletMap.setView([19.0760, 72.8777], 12);
    } else if (location.toLowerCase().includes('bangalore')) {
      leafletMap.setView([12.9716, 77.5946], 12);
    } else {
      // Default to user location or center of India
      if (userLocation) {
        leafletMap.setView(userLocation, 12);
      } else {
        leafletMap.setView([20.5937, 78.9629], 5);
      }
    }
  };

  function getMarkerColor(type: 'green' | 'orange' | 'red'): string {
    switch (type) {
      case 'green':
        return '#2E7D32';
      case 'orange':
        return '#FF8F00';
      case 'red':
        return '#D32F2F';
      default:
        return '#1976D2';
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b">
        <h2 className="font-headings font-medium text-lg">Nearby Warehouses</h2>
      </div>
      <div className="relative bg-gray-200" style={{ height: '320px' }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
            
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-white rounded-md shadow-sm p-2 flex items-center">
                <Search className="h-5 w-5 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search location or warehouse" 
                  className="ml-2 flex-1 border-none outline-none text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  className="ml-2 px-3 py-1 bg-primary-500 text-white rounded-md text-sm"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
