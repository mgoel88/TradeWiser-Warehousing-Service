import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import { Warehouse, ExternalLink, Package, ArrowRight, AlertCircle, ShieldCheck, MapPin, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { WarehouseMap } from '@/components/map/WarehouseMap';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<any[]>({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  // Filter receipts by type
  const verifiedReceipts = receipts.filter((r) => r.channelType === 'verified');
  const externalReceipts = receipts.filter((r) => r.channelType === 'external');
  const privateReceipts = receipts.filter((r) => r.channelType === 'private');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-1">
            Manage your commodities and access storage services
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-auto py-6 px-4 flex flex-col items-center justify-center border-emerald-200 hover:bg-emerald-50"
            onClick={() => navigate('/deposit')}
          >
            <Package className="h-10 w-10 mb-2 text-emerald-600" />
            <span className="text-base font-medium">Store Commodity</span>
            <span className="text-xs text-muted-foreground mt-1">In verified warehouses</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-6 px-4 flex flex-col items-center justify-center border-blue-200 hover:bg-blue-50"
            onClick={() => navigate('/import-receipts')}
          >
            <ExternalLink className="h-10 w-10 mb-2 text-blue-600" />
            <span className="text-base font-medium">Import Receipt</span>
            <span className="text-xs text-muted-foreground mt-1">From external warehouses</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-6 px-4 flex flex-col items-center justify-center border-purple-200 hover:bg-purple-50"
            onClick={() => navigate('/private-storage')}
          >
            <ShieldCheck className="h-10 w-10 mb-2 text-purple-600" />
            <span className="text-base font-medium">Private Storage</span>
            <span className="text-xs text-muted-foreground mt-1">Self-certified storage</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-6 px-4 flex flex-col items-center justify-center border-green-200 hover:bg-green-50"
            onClick={() => navigate('/loans')}
          >
            <DollarSign className="h-10 w-10 mb-2 text-green-600" />
            <span className="text-base font-medium">Get Financing</span>
            <span className="text-xs text-muted-foreground mt-1">Based on your warehouse receipts</span>
          </Button>
        </div>
        
        {/* Warehouse Map Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Nearby Warehouses</h2>
              <p className="text-sm text-muted-foreground">Explore warehouses and deposit commodities</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/warehouses')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View All Warehouses
            </Button>
          </div>
          
          <div className="bg-white border rounded-lg overflow-hidden" style={{ height: "400px" }}>
            <WarehouseMap />
          </div>
        </div>
        
        {/* Financing Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Warehouse Receipt Financing</h2>
              <p className="text-sm text-muted-foreground">Unlock the value of your stored commodities</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/loans')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Apply for Loan
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Available Credit Limit
                </CardTitle>
                <CardDescription>80% of your receipts' valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(receipts.reduce((total: number, r) => total + (parseFloat(r.valuation?.toString() || "0") * 0.8), 0)).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on your warehouse receipts
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Outstanding Balance
                </CardTitle>
                <CardDescription>Currently utilized credit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹0
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  No active loans
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  Interest Rate
                </CardTitle>
                <CardDescription>Pay only for what you use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  12% <span className="text-sm font-normal">p.a.</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Calculated on daily utilized amount
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Receipts</h2>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Receipts</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="external">External</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : receipts.length > 0 ? (
                  <div className="space-y-4">
                    {receipts.slice(0, 5).map((receipt) => (
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
                            <p className="text-sm">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}

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
                    <p className="text-muted-foreground mb-4">Start by storing your commodities or importing receipts</p>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => navigate('/deposit')}>
                        Store Commodity
                      </Button>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="verified">
              {/*  Similar structure as "all" TabsContent, using verifiedReceipts */}
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : verifiedReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {verifiedReceipts.slice(0, 5).map((receipt) => (
                      <div
                        key={receipt.id}
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-emerald-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {verifiedReceipts.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/deposit')}
                      >
                        View all {verifiedReceipts.length} receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No verified receipts found</h3>
                    <p className="text-muted-foreground mb-4">Start by storing your commodities.</p>
                    <Button size="sm" onClick={() => navigate('/deposit')}>
                      Store Commodity
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="external">
              {/* Similar structure as "all" TabsContent, using externalReceipts */}
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : externalReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {externalReceipts.slice(0, 5).map((receipt) => (
                      <div
                        key={receipt.id}
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-blue-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {externalReceipts.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/import-receipts')}
                      >
                        View all {externalReceipts.length} receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No external receipts found</h3>
                    <p className="text-muted-foreground mb-4">Import receipts from external warehouses.</p>
                    <Button size="sm" onClick={() => navigate('/import-receipts')}>
                      Import Receipt
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="private">
              {/* Similar structure as "all" TabsContent, using privateReceipts */}
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {receiptsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : privateReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {privateReceipts.slice(0, 5).map((receipt) => (
                      <div
                        key={receipt.id}
                        className="bg-white p-4 rounded-md shadow-sm border-l-4 border-l-purple-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{receipt.receiptNumber}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.commodityName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{receipt.quantity} {receipt.measurementUnit || 'MT'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {privateReceipts.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => navigate('/private-storage')}
                      >
                        View all {privateReceipts.length} receipts <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No private receipts found</h3>
                    <p className="text-muted-foreground mb-4">Start using self-certified storage.</p>
                    <Button size="sm" onClick={() => navigate('/private-storage')}>
                      Private Storage
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
            <h2 className="text-xl font-semibold">Dashboard Overview</h2>
          </div>
          <Dashboard />
        </div>
      </div>
    </MainLayout>
  );
}