import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import { Warehouse, ArrowRight, Package, MapPin, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function GreenChannelPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['/api/warehouses'],
    retry: 1,
    staleTime: 60000
  });

  const filteredWarehouses = searchQuery 
    ? (warehouses as any[]).filter((warehouse: any) => 
        warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : warehouses;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-emerald-800">
                <Warehouse className="h-6 w-6 mr-2 text-emerald-600" />
                Premium Storage Network
              </h1>
              <p className="text-muted-foreground mt-1">
                Store your commodities in our verified warehouses with complete quality assurance
              </p>
            </div>
            <Button 
              onClick={() => navigate('/deposit')} 
              className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Store Commodity
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="warehouses">Browse Warehouses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-emerald-600" />
                    Quality Assurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    All commodities undergo thorough quality checks and certification
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-emerald-600"
                    onClick={() => navigate('/quality-standards')}
                  >
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Warehouse className="h-5 w-5 mr-2 text-emerald-600" />
                    Storage Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access our network of premium warehouses across major agricultural regions
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-emerald-600"
                    onClick={() => setActiveTab('warehouses')}
                  >
                    Browse locations <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                    Easy Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Find the nearest warehouse and schedule commodity storage
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-emerald-600" 
                    onClick={() => navigate('/deposit')}
                  >
                    Start now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="warehouses" className="mt-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search warehouses by name or location..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {warehousesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredWarehouses.map((warehouse: any) => (
                  <Card key={warehouse.id} className="border-l-4 border-l-emerald-500">
                    <CardHeader>
                      <CardTitle>{warehouse.name}</CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {warehouse.city}, {warehouse.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span>{warehouse.capacity} MT</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Available:</span>
                          <span>{warehouse.availableSpace} MT</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => navigate(`/deposit?warehouse=${warehouse.id}`)}
                      >
                        Select Warehouse
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}