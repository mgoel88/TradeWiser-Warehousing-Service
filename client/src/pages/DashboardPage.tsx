import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MainLayout from "@/components/layout/MainLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Warehouse, ExternalLink, FileCheck, ArrowRight, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch data for the dashboard
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['/api/warehouses'],
    retry: 1,
    staleTime: 60000
  });

  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['/api/loans'],
    retry: 1,
    staleTime: 60000
  });

  // Filter receipts by channel
  const greenChannelReceipts = receipts.filter((receipt: any) => 
    receipt.channelType === 'green' || 
    (receipt.metadata && (receipt.metadata as any).channelType === 'green'));
  
  const orangeChannelReceipts = receipts.filter((receipt: any) => 
    receipt.channelType === 'orange' || 
    (receipt.metadata && (receipt.metadata as any).channelType === 'orange') ||
    receipt.externalSource);
  
  const redChannelReceipts = receipts.filter((receipt: any) => 
    receipt.channelType === 'red' || 
    (receipt.metadata && (receipt.metadata as any).channelType === 'red') ||
    (receipt.metadata && (receipt.metadata as any).isSelfCertified));
  
  // Count total active commodities
  const totalCommodities = receipts.filter((receipt: any) => 
    receipt.status === 'active' || receipt.status === 'processing').length;
  
  // Count active loans
  const activeLoans = loans.filter((loan: any) => 
    loan.status === 'active' || loan.status === 'pending').length;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.username || 'User'}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your commodities through our secure three-channel system
          </p>
        </div>
        
        {/* Channel Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-[6px] border-l-primary-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-primary-700">
                <Warehouse className="w-5 h-5 mr-2" />
                Green Channel
              </CardTitle>
              <CardDescription>TradeWiser Warehouses</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your receipts:</span>
                <span className="font-medium">{greenChannelReceipts.length}</span>
              </div>
              <p className="text-sm">
                Manage commodities stored in TradeWiser verified warehouses with full quality assurance and insurance
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-primary-600 hover:bg-primary-700" 
                onClick={() => navigate('/green-channel')}
              >
                Access Green Channel
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-l-[6px] border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-orange-700">
                <ExternalLink className="w-5 h-5 mr-2" />
                Orange Channel
              </CardTitle>
              <CardDescription>External Warehouse Receipts</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your receipts:</span>
                <span className="font-medium">{orangeChannelReceipts.length}</span>
              </div>
              <p className="text-sm">
                Import and verify receipts from external warehouses to access financing and trading options
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                onClick={() => navigate('/orange-channel')}
              >
                Access Orange Channel
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-l-[6px] border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-red-700">
                <FileCheck className="w-5 h-5 mr-2" />
                Red Channel
              </CardTitle>
              <CardDescription>Self-Certified Storage</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your receipts:</span>
                <span className="font-medium">{redChannelReceipts.length}</span>
              </div>
              <p className="text-sm">
                Self-certify your privately stored commodities with basic verification for record keeping
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={() => navigate('/red-channel')}
              >
                Access Red Channel
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Total Commodities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalCommodities}</p>
              <p className="text-sm text-muted-foreground">Active warehouse receipts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">TradeWiser Warehouses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{warehouses.length}</p>
              <p className="text-sm text-muted-foreground">Available storage locations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeLoans}</p>
              <p className="text-sm text-muted-foreground">Commodity-backed loans</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Collateral Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(receipts.reduce((total: number, receipt: any) => {
                  return total + (parseInt(receipt.valuation || '0', 10) || 0);
                }, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total commodity value</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 px-4 flex flex-col items-center justify-center border-primary-200 hover:bg-primary-50 hover:border-primary-300"
              onClick={() => navigate('/deposit')}
            >
              <Package className="h-10 w-10 mb-2 text-primary-600" />
              <span className="text-base font-medium">Deposit Commodity</span>
              <span className="text-xs text-muted-foreground mt-1">Store in a TradeWiser warehouse</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 px-4 flex flex-col items-center justify-center border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => navigate('/orange-channel')}
            >
              <ExternalLink className="h-10 w-10 mb-2 text-orange-600" />
              <span className="text-base font-medium">Import External Receipt</span>
              <span className="text-xs text-muted-foreground mt-1">From third-party warehouses</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 px-4 flex flex-col items-center justify-center border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => navigate('/red-channel')}
            >
              <FileCheck className="h-10 w-10 mb-2 text-red-600" />
              <span className="text-base font-medium">Self-Certify Commodity</span>
              <span className="text-xs text-muted-foreground mt-1">For private storage</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 px-4 flex flex-col items-center justify-center border-primary-200 hover:bg-primary-50 hover:border-primary-300"
              onClick={() => navigate('/loans')}
            >
              <ShieldCheck className="h-10 w-10 mb-2 text-primary-600" />
              <span className="text-base font-medium">Apply for Loan</span>
              <span className="text-xs text-muted-foreground mt-1">Using receipts as collateral</span>
            </Button>
          </div>
        </div>
        
        {/* Recent Receipts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Receipts</h2>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Channels</TabsTrigger>
              <TabsTrigger value="green">Green</TabsTrigger>
              <TabsTrigger value="orange">Orange</TabsTrigger>
              <TabsTrigger value="red">Red</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : receipts.length > 0 ? (
                  <div className="space-y-4">
                    {receipts.slice(0, 5).map((receipt: any) => {
                      // Determine the channel type
                      let channelType = 'green';
                      let borderColor = 'border-l-primary-500';
                      
                      if (receipt.channelType === 'orange' || 
                          (receipt.metadata && (receipt.metadata as any).channelType === 'orange') ||
                          receipt.externalSource) {
                        channelType = 'orange';
                        borderColor = 'border-l-orange-500';
                      } else if (receipt.channelType === 'red' || 
                               (receipt.metadata && (receipt.metadata as any).channelType === 'red') ||
                               (receipt.metadata && (receipt.metadata as any).isSelfCertified)) {
                        channelType = 'red';
                        borderColor = 'border-l-red-500';
                      }
                      
                      return (
                        <div 
                          key={receipt.id} 
                          className={`bg-white p-4 rounded-md shadow-sm border-l-4 ${borderColor} hover:bg-gray-50 cursor-pointer`}
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{receipt.receiptNumber}</h3>
                              <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                channelType === 'green' ? 'bg-primary-100 text-primary-800' : 
                                channelType === 'orange' ? 'bg-orange-100 text-orange-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {channelType.charAt(0).toUpperCase() + channelType.slice(1)} Channel
                              </div>
                              <p className="text-sm mt-1">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {receipts.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/receipts')}
                      >
                        View all {receipts.length} receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No receipts found</h3>
                    <p className="text-muted-foreground mb-4">You don't have any warehouse receipts yet</p>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => navigate('/green-channel')}>
                        Browse Warehouses
                      </Button>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="green">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : greenChannelReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {greenChannelReceipts.slice(0, 5).map((receipt: any) => (
                      <div 
                        key={receipt.id} 
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-primary-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800">
                              Green Channel
                            </div>
                            <p className="text-sm mt-1">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {greenChannelReceipts.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/green-channel')}
                      >
                        View all {greenChannelReceipts.length} green channel receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No green channel receipts</h3>
                    <p className="text-muted-foreground mb-4">You don't have any TradeWiser warehouse receipts yet</p>
                    <Button size="sm" onClick={() => navigate('/green-channel')}>
                      Browse Warehouses
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="orange">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : orangeChannelReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {orangeChannelReceipts.slice(0, 5).map((receipt: any) => (
                      <div 
                        key={receipt.id} 
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-orange-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">
                              {receipt.commodityName} {receipt.externalSource ? `(${receipt.externalSource})` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                              Orange Channel
                            </div>
                            <p className="text-sm mt-1">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {orangeChannelReceipts.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/orange-channel')}
                      >
                        View all {orangeChannelReceipts.length} orange channel receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No orange channel receipts</h3>
                    <p className="text-muted-foreground mb-4">You haven't imported any external warehouse receipts yet</p>
                    <Button size="sm" onClick={() => navigate('/orange-channel')}>
                      Import External Receipt
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="red">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : redChannelReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {redChannelReceipts.slice(0, 5).map((receipt: any) => (
                      <div 
                        key={receipt.id} 
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-red-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                              Red Channel
                            </div>
                            <p className="text-sm mt-1">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {redChannelReceipts.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/red-channel')}
                      >
                        View all {redChannelReceipts.length} red channel receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No red channel receipts</h3>
                    <p className="text-muted-foreground mb-4">You haven't created any self-certified commodity receipts yet</p>
                    <Button size="sm" onClick={() => navigate('/red-channel')}>
                      Create Self-Certified Receipt
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Customizable Dashboard */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Customizable Dashboard</h2>
          </div>
          <Dashboard />
        </div>
      </div>
    </MainLayout>
  );
}
