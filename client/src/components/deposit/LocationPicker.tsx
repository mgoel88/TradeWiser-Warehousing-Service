import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (address: string, coordinates: [number, number]) => void;
  initialAddress?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialAddress = '' }) => {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    // Set a default location (Delhi, India) if no initial location
    const defaultLocation: [number, number] = [28.6139, 77.2090]; 
    
    const leafletMap = L.map(mapContainerRef.current).setView(defaultLocation, 11);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    // Create custom marker icon
    const icon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    // Add click event to map
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition([lat, lng]);
      reverseGeocode([lat, lng]);
    });

    setMap(leafletMap);

    return () => {
      if (leafletMap) {
        leafletMap.remove();
      }
    };
  }, []);

  // Update marker position
  const updateMarkerPosition = (latlng: [number, number]) => {
    if (!map) return;

    // Remove existing marker
    if (marker) {
      marker.remove();
    }

    // Create custom marker icon
    const icon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    // Add new marker
    const newMarker = L.marker(latlng, { icon }).addTo(map);
    setMarker(newMarker);
    setCoordinates(latlng);
  };

  // Get user's current location
  const getUserLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        
        if (map) {
          map.setView(location, 16);
          updateMarkerPosition(location);
          reverseGeocode(location);
        }
        
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Search by address
  const searchAddress = async () => {
    if (!address || !map) return;
    
    setIsLoading(true);
    
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const location: [number, number] = [parseFloat(lat), parseFloat(lon)];
        
        map.setView(location, 16);
        updateMarkerPosition(location);
        reverseGeocode(location);
      } else {
        toast({
          title: "Address not found",
          description: "Try a different address or select a location on the map",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for this address. Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reverse geocode (get address from coordinates)
  const reverseGeocode = async (latlng: [number, number]) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng[0]}&lon=${latlng[1]}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  // Confirm location selection
  const confirmLocation = () => {
    if (coordinates && address) {
      onLocationSelect(address, coordinates);
    } else {
      toast({
        title: "No location selected",
        description: "Please select a location on the map or search for an address",
        variant: "destructive",
      });
    }
  };

  // Handle search input enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchAddress();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Search for address or location" 
          className="flex-1"
          onKeyDown={handleSearchKeyDown}
        />
        <Button 
          onClick={searchAddress} 
          variant="outline" 
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
        <Button 
          onClick={getUserLocation} 
          variant="outline"
          title="Use current location"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          ) : (
            <Locate className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="relative border rounded-md overflow-hidden">
        <div ref={mapContainerRef} className="h-[300px]"></div>
        <div className="absolute bottom-3 right-3">
          <Button
            onClick={confirmLocation}
            disabled={!coordinates || !address}
            className="shadow-lg"
          >
            Confirm Location
          </Button>
        </div>
      </div>
      
      {coordinates && (
        <Card className="bg-muted">
          <CardContent className="p-3 text-sm">
            <p className="font-medium">Selected Location:</p>
            <p className="text-muted-foreground">{address}</p>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Navigation className="h-3 w-3 mr-1" />
                {coordinates[0].toFixed(5)}
              </span>
              <span className="flex items-center">
                <Navigation className="h-3 w-3 mr-1 rotate-90" />
                {coordinates[1].toFixed(5)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationPicker;