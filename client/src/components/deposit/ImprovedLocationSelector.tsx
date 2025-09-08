import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Locate, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Warehouse } from '@shared/schema';

interface ImprovedLocationSelectorProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  onWarehouseSelect?: (warehouses: Warehouse[]) => void;
  className?: string;
}

interface LocationCoords {
  lat: number;
  lng: number;
}

export default function ImprovedLocationSelector({ 
  onLocationSelect, 
  onWarehouseSelect, 
  className = '' 
}: ImprovedLocationSelectorProps) {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [nearbyWarehouses, setNearbyWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  // Get current location using geolocation API
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setSelectedLocation(coords);
        reverseGeocode(latitude, longitude);
        findNearbyWarehouses(latitude, longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location access denied",
          description: "Please enable location access or enter address manually",
          variant: "destructive"
        });
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  // Address input change handler with autocomplete suggestions
  const handleAddressChange = useCallback(async (value: string) => {
    setAddress(value);
    
    if (value.length > 3) {
      // Generate smart address suggestions based on input
      const mockSuggestions = generateAddressSuggestions(value);
      setSuggestions(mockSuggestions.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, []);

  // Generate intelligent address suggestions
  const generateAddressSuggestions = (input: string): string[] => {
    const commonCities = [
      'New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 
      'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
      'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal',
      'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana'
    ];

    const states = [
      'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal',
      'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh',
      'Andhra Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Kerala'
    ];

    const suggestions: string[] = [];
    const lowerInput = input.toLowerCase();

    // Add matching cities
    commonCities.forEach(city => {
      if (city.toLowerCase().includes(lowerInput)) {
        suggestions.push(`${input}, ${city}`);
        suggestions.push(`${city}, India`);
      }
    });

    // Add matching states
    states.forEach(state => {
      if (state.toLowerCase().includes(lowerInput)) {
        suggestions.push(`${input}, ${state}, India`);
      }
    });

    // Add generic suggestions
    suggestions.push(`${input}, New Delhi, Delhi`);
    suggestions.push(`${input}, Mumbai, Maharashtra`);
    suggestions.push(`${input}, Bangalore, Karnataka`);

    return [...new Set(suggestions)]; // Remove duplicates
  };

  // Select an address from suggestions
  const selectAddress = async (selectedAddress: string) => {
    setAddress(selectedAddress);
    setSuggestions([]);

    // Mock geocoding - in production, use a real geocoding API
    const mockCoords = await mockGeocode(selectedAddress);
    setSelectedLocation(mockCoords);
    onLocationSelect(selectedAddress, mockCoords);
    findNearbyWarehouses(mockCoords.lat, mockCoords.lng);
  };

  // Mock geocoding function (replace with real API in production)
  const mockGeocode = async (address: string): Promise<LocationCoords> => {
    // Simple city-based coordinate mapping
    const cityCoords: Record<string, LocationCoords> = {
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'pune': { lat: 18.5204, lng: 73.8567 },
    };

    const lowerAddress = address.toLowerCase();
    for (const [city, coords] of Object.entries(cityCoords)) {
      if (lowerAddress.includes(city)) {
        return coords;
      }
    }

    // Default to Delhi if no match
    return { lat: 28.6139, lng: 77.2090 };
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Mock reverse geocoding
      const mockAddress = `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}, India`;
      setAddress(mockAddress);
      onLocationSelect(mockAddress, { lat, lng });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Find warehouses near the selected location
  const findNearbyWarehouses = async (lat: number, lng: number) => {
    setIsLoadingWarehouses(true);
    try {
      const radius = 50; // 50km radius
      const response = await fetch(`/api/warehouses/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNearbyWarehouses(data.warehouses || []);
        
        if (onWarehouseSelect) {
          onWarehouseSelect(data.warehouses || []);
        }
        
        toast({
          title: "Found nearby warehouses",
          description: `${data.warehouses?.length || 0} warehouses found within ${radius}km`,
        });
      }
    } catch (error) {
      console.error('Failed to find nearby warehouses:', error);
      toast({
        title: "Error finding warehouses",
        description: "Could not fetch nearby warehouses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Input Section */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Locate className="h-4 w-4" />
            {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
          </Button>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter your pickup address"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="pl-10"
            />
            {selectedLocation && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>

          {/* Address Suggestions */}
          {suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0 flex items-center gap-2"
                    onClick={() => selectAddress(suggestion)}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Location Selected</h4>
                <p className="text-sm text-green-700">{address}</p>
                <p className="text-xs text-green-600">
                  Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Warehouses Summary */}
      {nearbyWarehouses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Nearby Warehouses Found</h4>
                  <p className="text-sm text-blue-700">
                    {nearbyWarehouses.length} warehouses within 50km
                  </p>
                </div>
              </div>
              {isLoadingWarehouses && (
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              )}
            </div>
            
            {/* Preview of closest warehouses */}
            <div className="mt-3 flex flex-wrap gap-1">
              {nearbyWarehouses.slice(0, 3).map((warehouse) => (
                <Badge key={warehouse.id} variant="secondary" className="text-xs">
                  {warehouse.name} - {warehouse.city}
                </Badge>
              ))}
              {nearbyWarehouses.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{nearbyWarehouses.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Location Presets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Quick Select</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "New Delhi", coords: { lat: 28.6139, lng: 77.2090 } },
            { name: "Mumbai", coords: { lat: 19.0760, lng: 72.8777 } },
            { name: "Bangalore", coords: { lat: 12.9716, lng: 77.5946 } },
            { name: "Chennai", coords: { lat: 13.0827, lng: 80.2707 } }
          ].map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedLocation(preset.coords);
                setAddress(`${preset.name}, India`);
                onLocationSelect(`${preset.name}, India`, preset.coords);
                findNearbyWarehouses(preset.coords.lat, preset.coords.lng);
              }}
              className="text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}