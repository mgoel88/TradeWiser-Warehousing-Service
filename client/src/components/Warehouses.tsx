import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warehouse as WarehouseType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getChannelClass } from "@/lib/utils";
import { Search, MapPin, Filter, Warehouse } from "lucide-react";

export default function Warehouses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch warehouses
  const { data: warehouses = [], isLoading, error } = useQuery<WarehouseType[]>({
    queryKey: ['/api/warehouses'],
  });

  // Calculate distance between user and warehouse with null safety
  const calculateDistance = (warehouse: WarehouseType) => {
    if (!userLocation || !warehouse.latitude || !warehouse.longitude) return Infinity;
    
    const lat1 = userLocation[0];
    const lon1 = userLocation[1];
    const lat2 = Number(warehouse.latitude);
    const lon2 = Number(warehouse.longitude);
    
    // Check if coordinates are valid numbers
    if (isNaN(lat2) || isNaN(lon2)) return Infinity;
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // Filter and sort warehouses with null safety
  const filteredWarehouses = warehouses
    .filter((warehouse: WarehouseType) => {
          // Safe null checks for all properties
          const name = warehouse.name || '';
          const city = warehouse.city || '';
          const state = warehouse.state || '';
          const channelType = warehouse.channelType || '';
          
          const matchesSearch = searchTerm === "" ||
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            state.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesChannel = filterChannel === null || filterChannel === 'all' || channelType === filterChannel;
          
          return matchesSearch && matchesChannel;
        })
        .sort((a: WarehouseType, b: WarehouseType) => {
          const distanceA = calculateDistance(a);
          const distanceB = calculateDistance(b);
          return distanceA - distanceB;
        });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Find Warehouses</h1>
        <p className="text-gray-600">Discover and book warehouses for your agricultural commodities</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, city, or state"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={filterChannel || ""} onValueChange={(value) => setFilterChannel(value || null)}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter size={18} className="mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter by channel" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="green">Green Channel</SelectItem>
                <SelectItem value="orange">Orange Channel</SelectItem>
                <SelectItem value="red">Red Channel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">Loading warehouses...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-10 text-red-500">
          Failed to load warehouses. Please try again later.
        </div>
      )}

      {/* Warehouse List */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.length > 0 ? (
            filteredWarehouses.map((warehouse: WarehouseType) => (
              <Card key={warehouse.id} className={`overflow-hidden ${getChannelClass(warehouse.channelType || 'green')}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{warehouse.name || 'Unknown Warehouse'}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin size={14} className="mr-1" />
                        {warehouse.city || 'Unknown'}, {warehouse.state || 'Unknown'}
                      </CardDescription>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${(warehouse.channelType || 'green') === 'green' 
                        ? 'bg-primary-100 text-primary-600' 
                        : (warehouse.channelType || 'green') === 'orange'
                          ? 'bg-secondary-100 text-secondary-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                      <Warehouse size={20} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Channel Type:</span>
                      <span className={`font-medium 
                        ${(warehouse.channelType || 'green') === 'green' 
                          ? 'text-primary-600' 
                          : (warehouse.channelType || 'green') === 'orange'
                            ? 'text-secondary-600'
                            : 'text-red-600'
                        }`}>
                        {(warehouse.channelType || 'green').charAt(0).toUpperCase() + (warehouse.channelType || 'green').slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Capacity:</span>
                      <span className="font-medium">{warehouse.capacity || 0} MT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available Space:</span>
                      <span className="font-medium">{warehouse.availableSpace || 0} MT</span>
                    </div>
                    {userLocation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Distance:</span>
                        <span className="font-medium">{calculateDistance(warehouse).toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full 
                    ${(warehouse.channelType || 'green') === 'green' 
                      ? 'bg-primary-500 hover:bg-primary-600' 
                      : (warehouse.channelType || 'green') === 'orange'
                        ? 'bg-secondary-500 hover:bg-secondary-600'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}>
                    Book Warehouse
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-white rounded-lg shadow-sm">
              <div className="text-gray-400 mb-2">
                <Warehouse size={40} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-1">No warehouses found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
