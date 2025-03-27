import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Locate, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (address: string, coordinates: [number, number]) => void;
  initialAddress?: string;
  className?: string;
}

// Default locations - some popular Indian cities
const POPULAR_LOCATIONS: Array<{ name: string, coordinates: [number, number] }> = [
  { name: "New Delhi", coordinates: [28.6139, 77.2090] },
  { name: "Mumbai", coordinates: [19.0760, 72.8777] },
  { name: "Bangalore", coordinates: [12.9716, 77.5946] },
  { name: "Chennai", coordinates: [13.0827, 80.2707] },
  { name: "Kolkata", coordinates: [22.5726, 88.3639] }
];

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialAddress = '',
  className = ''
}) => {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLocationSelected, setIsLocationSelected] = useState<boolean>(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    // Set a default location (Delhi, India)
    const defaultLocation: [number, number] = [28.6139, 77.2090]; 
    
    const leafletMap = L.map(mapContainerRef.current).setView(defaultLocation, 11);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    // Add click event to map
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition([lat, lng]);
      reverseGeocode([lat, lng]);
    });

    setMap(leafletMap);

    // If we have an initial address, try to geocode it
    if (initialAddress) {
      geocodeAddress(initialAddress);
    }

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
      html: `<div class="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    // Add new marker with bounce animation
    const newMarker = L.marker(latlng, { icon }).addTo(map);
    
    // Add a simple bounce animation
    const markerElement = newMarker.getElement();
    if (markerElement) {
      markerElement.style.transition = 'transform 0.3s ease-out';
      markerElement.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (markerElement) {
          markerElement.style.transform = 'translateY(0)';
        }
      }, 300);
    }
    
    setMarker(newMarker);
    setCoordinates(latlng);
    
    // Auto-select location after placing a marker
    if (address) {
      setIsLocationSelected(true);
      onLocationSelect(address, latlng);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: "Getting your location",
      description: "Please allow location access if prompted",
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        
        if (map) {
          map.setView(location, 16);
          updateMarkerPosition(location);
          reverseGeocode(location);
          
          toast({
            title: "Location Found",
            description: "Your current location has been set",
          });
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
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Geocode address to coordinates
  const geocodeAddress = async (searchText: string) => {
    if (!searchText || !map) return;
    
    setIsLoading(true);
    
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const location: [number, number] = [parseFloat(lat), parseFloat(lon)];
        
        map.setView(location, 16);
        updateMarkerPosition(location);
        
        // Get the formatted address
        const displayName = data[0].display_name;
        setAddress(displayName);
        
        // Clear suggestions
        setSuggestions([]);
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

  // Search by address (for auto-complete)
  const searchAddress = async (searchText: string) => {
    if (!searchText) {
      setSuggestions([]);
      return;
    }
    
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Extract just the place names and limit to 5 results
        const places = data.slice(0, 5).map((item: any) => item.display_name);
        setSuggestions(places);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Address search error:", error);
      setSuggestions([]);
    }
  };

  // Handle typing in the search box (debounced)
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchText = e.target.value;
    setAddress(searchText);
    
    // Clear location selection when user types
    if (isLocationSelected) {
      setIsLocationSelected(false);
    }
    
    // Debounce search to avoid too many API calls
    if (searchText.length > 3) {
      setTimeout(() => {
        searchAddress(searchText);
      }, 300);
    } else {
      setSuggestions([]);
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

  // Handle search input enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(address);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setSuggestions([]);
    geocodeAddress(suggestion);
    
    // Focus back on the input after selection
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Select a popular location
  const selectPopularLocation = (locationName: string, coordinates: [number, number]) => {
    if (map) {
      map.setView(coordinates, 16);
      updateMarkerPosition(coordinates);
      reverseGeocode(coordinates);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search box with suggestions */}
      <div className="flex flex-col relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              value={address} 
              onChange={handleSearchInput}
              placeholder="Enter pickup address" 
              className="pl-8"
              onKeyDown={handleSearchKeyDown}
            />
            {isLocationSelected && (
              <div className="absolute right-2 top-2.5">
                <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1 px-2">
                  <Check className="h-3 w-3" /> Set
                </Badge>
              </div>
            )}
          </div>
          <Button 
            onClick={() => geocodeAddress(address)} 
            variant="outline" 
            disabled={isLoading || !address}
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
        
        {/* Address suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-background border rounded-md mt-1 z-10 shadow-lg max-h-60 overflow-y-auto">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  className="px-3 py-2 hover:bg-accent cursor-pointer text-sm truncate"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <MapPin className="h-3 w-3 inline mr-2 text-muted-foreground" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Popular locations */}
      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-muted-foreground w-full mb-1">Popular locations:</p>
        {POPULAR_LOCATIONS.map((location, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="cursor-pointer hover:bg-accent"
            onClick={() => selectPopularLocation(location.name, location.coordinates)}
          >
            {location.name}
          </Badge>
        ))}
      </div>
      
      {/* Map */}
      <div className="relative border rounded-md overflow-hidden">
        <div ref={mapContainerRef} className="h-[300px]"></div>
        
        {/* Explanatory overlay when no location is selected */}
        {!coordinates && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center flex-col p-6 text-center">
            <MapPin className="h-10 w-10 text-primary mb-2" />
            <h3 className="text-lg font-medium">Select Your Pickup Location</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Click anywhere on the map, search for an address, or use your current location
            </p>
          </div>
        )}
        
        {/* Confirm button */}
        {coordinates && !isLocationSelected && (
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={() => {
                if (coordinates && address) {
                  setIsLocationSelected(true);
                  onLocationSelect(address, coordinates);
                  toast({
                    title: "Location Selected",
                    description: "Pickup location has been set",
                  });
                }
              }}
              disabled={!coordinates || !address}
              className="shadow-lg"
            >
              Confirm Location
            </Button>
          </div>
        )}
      </div>
      
      {/* Selected location display */}
      {coordinates && (
        <Card className={`${isLocationSelected ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
          <CardContent className="p-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Selected Pickup Location:</p>
                <p className="text-muted-foreground">{address}</p>
              </div>
              {isLocationSelected && (
                <Badge className="bg-green-500">Confirmed</Badge>
              )}
            </div>
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