import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { ExternalLink, AlertCircle, ArrowRight, Upload, FileSearch, ScanSearch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import UploadReceiptDialog from '@/components/receipts/UploadReceiptDialog';
import WarehouseReceiptCard from '@/components/receipts/WarehouseReceiptCard';

export default function OrangeChannelPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch external source receipts data
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  // Filter to only show Orange Channel receipts
  const orangeReceipts = (receipts as any[]).filter((receipt: any) => {
    if (receipt.metadata && typeof receipt.metadata === 'object') {
      return receipt.channelType === 'orange' || 
             (receipt.metadata as any).channelType === 'orange' ||
             receipt.externalSource;
    }
    return false;
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-orange-800">
                <ExternalLink className="h-6 w-6 mr-2 text-orange-600" />
                Orange Channel
              </h1>
              <p className="text-muted-foreground mt-1">
                Import and manage third-party warehouse receipts for financing and trading
              </p>
            </div>
            <div className="mt-4 md:mt-0 space-x-2">
              <Button 
                variant="default" 
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Upload External Receipt
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-md flex items-start">
            <div className="mr-3 mt-1">
              <ExternalLink className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-orange-800">Orange Channel Benefits</h3>
              <p className="text-sm text-orange-700 mt-1">
                Import receipts from third-party warehouses (WDRA, CMA, FCI, etc.) into a unified dashboard. 
                Access financing and transfer options while keeping commodities in their current location.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="receipts">My Receipts</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-orange-600" />
                    Receipt Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs or images of third-party warehouse receipts for automatic extraction and processing
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-orange-600" 
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    Upload now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ScanSearch className="h-5 w-5 mr-2 text-orange-600" />
                    Data Extraction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our OCR technology recognizes and extracts key information from various receipt formats
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-orange-600" 
                    onClick={() => setActiveTab('process')}
                  >
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileSearch className="h-5 w-5 mr-2 text-orange-600" />
                    Manual Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manually input receipt details when automatic extraction isn't possible or for verification
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-orange-600" 
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    Create receipt <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={() => setIsUploadDialogOpen(true)} 
                  size="lg" 
                  className="h-auto p-6 bg-orange-600 hover:bg-orange-700"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Upload External Receipt</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Import a third-party warehouse receipt for integration with TradeWiser
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
                <Button 
                  onClick={() => navigate('/receipts')} 
                  size="lg" 
                  variant="outline" 
                  className="h-auto p-6 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">View Receipts</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Check your existing Orange Channel receipts with special indicators
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto text-orange-600" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="receipts" className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Orange Channel Receipts</h2>
              <Button 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Upload New Receipt
              </Button>
            </div>
            
            {receiptsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orangeReceipts.length > 0 ? (
                  orangeReceipts.map((receipt: any) => (
                    <div key={receipt.id}>
                      <WarehouseReceiptCard
                        receipt={receipt}
                        orangeChannelVariant={true}
                        onView={(receipt: any) => navigate(`/receipts/${receipt.id}`)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-6 text-center border rounded-lg">
                    <AlertCircle className="h-8 w-8 mb-2 mx-auto text-muted-foreground" />
                    <h3 className="font-medium text-lg">No Orange Channel Receipts</h3>
                    <p className="text-muted-foreground">
                      You haven't imported any external warehouse receipts yet.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      Upload External Receipt
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="process" className="mt-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Orange Channel Import Process</h2>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-semibold text-orange-700">1</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Upload Receipt</h3>
                    <p className="text-muted-foreground mt-1">
                      Upload a PDF or image of your third-party warehouse receipt, or take a photo using your device's camera.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-semibold text-orange-700">2</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Data Extraction</h3>
                    <p className="text-muted-foreground mt-1">
                      Our OCR technology analyzes the document and extracts key information such as receipt number, 
                      commodity type, quantity, grade, and warehouse details.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-semibold text-orange-700">3</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Verification & Processing</h3>
                    <p className="text-muted-foreground mt-1">
                      The system verifies the authenticity of the receipt using external APIs and source-specific validation rules.
                      You can also manually verify and edit details if needed.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-semibold text-orange-700">4</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Integration</h3>
                    <p className="text-muted-foreground mt-1">
                      The external receipt is imported into your TradeWiser dashboard with special Orange Channel indicators. 
                      You maintain a clear distinction between TradeWiser-managed and external receipts.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-semibold text-orange-700">5</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Access to Services</h3>
                    <p className="text-muted-foreground mt-1">
                      Use your imported receipt to access TradeWiser services like collateral-based loans, 
                      ownership transfer, or trading on a single unified platform.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  Upload External Receipt
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Upload Dialog */}
      <UploadReceiptDialog 
        isOpen={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)} 
      />
    </MainLayout>
  );
}