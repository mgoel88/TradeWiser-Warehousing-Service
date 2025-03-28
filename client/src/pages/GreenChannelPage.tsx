import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Warehouse, ArrowRight, Package, MapPin, Search, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function GreenChannelPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch warehouses data
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['/api/warehouses'],
    retry: 1,
    staleTime: 60000
  });

  // Filter warehouses based on search query
  const filteredWarehouses = searchQuery 
    ? (warehouses as any[]).filter((warehouse: any) => 
        warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : warehouses;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-primary-800">
                <Warehouse className="h-6 w-6 mr-2 text-primary-600" />
                Green Channel
              </h1>
              <p className="text-muted-foreground mt-1">
                Store and manage your commodities in TradeWiser's network of verified warehouses
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={() => navigate('/deposit')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Deposit New Commodity
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-primary-50 border-l-4 border-primary-500 rounded-md flex items-start">
            <div className="mr-3 mt-1">
              <Warehouse className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-primary-800">Green Channel Benefits</h3>
              <p className="text-sm text-primary-700 mt-1">
                With Green Channel storage, your commodities undergo rigorous quality checks, 
                temperature and humidity monitoring, and are eligible for our premium insurance coverage. 
                Green Channel receipts have the highest verification status for lending and trading.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Warehouse className="h-5 w-5 mr-2 text-primary-600" />
                    Premium Storage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our network of certified warehouses provide state-of-the-art storage facilities with climate control and security
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary-600" 
                    onClick={() => setActiveTab('warehouses')}
                  >
                    Browse warehouses <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-primary-600" />
                    Quality Assurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    All commodities undergo detailed quality assessment and certification before generating warehouse receipts
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary-600" 
                    onClick={() => setActiveTab('process')}
                  >
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                    Wide Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our warehouses are strategically located across major agricultural regions for easy access
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary-600"
                    onClick={() => navigate('/warehouses/nearby')}
                  >
                    Find nearby <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={() => navigate('/deposit')} 
                  size="lg" 
                  className="h-auto p-6 bg-primary-600 hover:bg-primary-700"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Deposit Commodity</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Store your goods in our secure warehouses with full quality certification
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
                <Button 
                  onClick={() => setActiveTab('warehouses')} 
                  size="lg" 
                  variant="outline" 
                  className="h-auto p-6 border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-800"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Browse Warehouses</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Explore our network of premium storage facilities
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto text-primary-600" />
                </Button>
              </div>
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
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWarehouses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(filteredWarehouses as any[]).map((warehouse: any) => (
                  <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle>{warehouse.name}</CardTitle>
                      <CardDescription>
                        {warehouse.location || warehouse.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Storage Type:</span>
                          <span className="font-medium">{warehouse.storageType || "General"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{warehouse.capacity || "Available"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Services:</span>
                          <span className="font-medium">{warehouse.services || "Standard"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                        onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No warehouses found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : "There are no warehouses available at the moment."}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="process" className="mt-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Green Channel Deposit Process</h2>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-700">1</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Select Warehouse</h3>
                    <p className="text-muted-foreground mt-1">
                      Choose from our network of certified warehouses based on your location and commodity type.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-700">2</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Schedule Deposit</h3>
                    <p className="text-muted-foreground mt-1">
                      Book a time slot for delivering your commodity to the warehouse using our online scheduling system.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-700">3</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Quality Assessment</h3>
                    <p className="text-muted-foreground mt-1">
                      Your commodity undergoes a thorough quality check by certified inspectors, 
                      including moisture content, impurity levels, and other quality parameters.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-700">4</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Secure Storage</h3>
                    <p className="text-muted-foreground mt-1">
                      Your commodity is stored in optimal conditions with climate control, pest management, 
                      and 24/7 security monitoring.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-700">5</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Receipt Generation</h3>
                    <p className="text-muted-foreground mt-1">
                      A blockchain-secured warehouse receipt is issued, containing all details including 
                      quality grades, quantity, and storage location. Green Channel receipts receive our highest verification status.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <Button 
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => navigate('/deposit')}
                >
                  Start Deposit Process
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}