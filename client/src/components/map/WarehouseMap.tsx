import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { Warehouse } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Fix marker icon issues in React Leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Create custom warehouse icon
const warehouseIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS13YXJlaG91c2UiPjxwYXRoIGQ9Ik0yMCAxMFY4YTEgMSAwIDAgMC0xLTFIMTBhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMC0xLTFINWExIDEgMCAwIDAtMSAxdjEyYTMgMyAwIDAgMCAzIDNoPTlhMyAzIDAgMCAwIDMtM3YtMiIvPjxwYXRoIGQ9Ik0xMCA4VjZhMSAxIDAgMCAxIDEtMWg5YTEgMSAwIDAgMSAxIDEiLz48cGF0aCBkPSJNMTAgMTZ2LTFhMSAxIDAgMCAxIDEtMWg2YTEgMSAwIDAgMSAxIDEiLz48L3N2Zz4=',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// Create custom user location icon
const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDY2RkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzAwNjZGRiIgZmlsbC1vcGFjaXR5PSIwLjIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiBmaWxsPSIjMDA2NkZGIi8+PC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Component to auto-center the map on user's location
function SetViewOnLocation({ coords }: { coords: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 12);
  }, [coords, map]);
  return null;
}

interface WarehouseWithDistance extends Warehouse {
  distance?: number;
}

// Main component
export function WarehouseMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  // Fetch warehouses
  const { data: warehouses = [], isLoading } = useQuery<WarehouseWithDistance[]>({
    queryKey: ['/api/warehouses'],
    staleTime: 60000,
  });

  // Fetch nearby warehouses when user location is available
  const { data: nearbyWarehouses = [], isLoading: isLoadingNearby } = useQuery<WarehouseWithDistance[]>({
    queryKey: ['/api/warehouses/nearby', userLocation],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const [lat, lng] = userLocation;
      const res = await apiRequest('GET', `/api/warehouses/nearby?lat=${lat}&lng=${lng}&radius=50`);
      if (!res.ok) return [];
      
      return res.json();
    },
    enabled: !!userLocation,
    staleTime: 60000,
  });

  // Get user's location
  const getUserLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Could not get your location. Using default location.',
            variant: 'destructive',
          });
          // Use default location (Mumbai, India)
          setUserLocation([19.0760, 72.8777]);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
      // Use default location (Mumbai, India)
      setUserLocation([19.0760, 72.8777]);
      setIsLocating(false);
    }
  };

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Default map center (India)
  const defaultCenter: LatLngExpression = [20.5937, 78.9629];

  return (
    <div className="h-[400px] rounded-lg overflow-hidden border shadow-sm relative">
      {userLocation ? (
        <MapContainer
          center={userLocation}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
          
          {/* 10km radius around user */}
          <Circle 
            center={userLocation}
            radius={10000}
            pathOptions={{ color: '#0066FF', fillColor: '#0066FF', fillOpacity: 0.05 }}
          />
          
          {/* All warehouses */}
          {warehouses.map((warehouse) => (
            <Marker 
              key={warehouse.id}
              position={[Number(warehouse.latitude), Number(warehouse.longitude)]}
              icon={warehouseIcon}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-medium">{warehouse.name}</h3>
                  <p className="text-sm text-muted-foreground">{warehouse.address}</p>
                  {warehouse.distance && (
                    <p className="text-xs mt-1 font-medium text-primary">
                      {warehouse.distance.toFixed(1)} km away
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full text-xs h-7"
                    onClick={() => window.open(`https://maps.google.com/?q=${warehouse.latitude},${warehouse.longitude}`, '_blank')}
                  >
                    Get Directions
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
          
          <SetViewOnLocation coords={userLocation} />
        </MapContainer>
      ) : (
        <div className="h-full flex items-center justify-center bg-muted/20">
          <div className="text-center">
            {isLocating ? (
              <>
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Getting your location...</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">Location access is required to show nearby warehouses</p>
                <Button onClick={getUserLocation}>Allow Location Access</Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Location button */}
      {userLocation && (
        <Button 
          size="sm"
          variant="secondary"
          className="absolute bottom-4 right-4 z-[1000] shadow-md"
          onClick={getUserLocation}
          disabled={isLocating}
        >
          {isLocating ? 'Getting Location...' : 'Update Location'}
        </Button>
      )}
    </div>
  );
}