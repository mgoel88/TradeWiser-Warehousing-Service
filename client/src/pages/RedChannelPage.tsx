import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { FileCheck, AlertCircle, ArrowRight, FileEdit, UserCheck, Shield, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { RedChannelDialog } from '@/components/receipts/RedChannelDialog';
import WarehouseReceiptCard from '@/components/receipts/WarehouseReceiptCard';

export default function RedChannelPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showRedChannelDialog, setShowRedChannelDialog] = useState(false);

  // Fetch receipts data
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  // Filter to only show Red Channel receipts
  const redChannelReceipts = receipts.filter((receipt: any) => {
    if (receipt.metadata && typeof receipt.metadata === 'object') {
      return receipt.channelType === 'red' || 
             (receipt.metadata as any).channelType === 'red' ||
             (receipt.metadata as any).isSelfCertified;
    }
    return false;
  });
  
  // Open the Red Channel dialog
  const handleOpenDialog = () => {
    setShowRedChannelDialog(true);
  };
  
  // Close the Red Channel dialog
  const handleCloseDialog = () => {
    setShowRedChannelDialog(false);
    queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Red Channel Dialog */}
        {showRedChannelDialog && (
          <RedChannelDialog 
            isOpen={showRedChannelDialog} 
            onClose={handleCloseDialog} 
          />
        )}
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-red-800">
                <FileCheck className="h-6 w-6 mr-2 text-red-600" />
                Red Channel
              </h1>
              <p className="text-muted-foreground mt-1">
                Self-certified commodity declarations for your privately stored goods
              </p>
            </div>
            <Button 
              onClick={handleOpenDialog}
              className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Self-Certified Receipt
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
            <div className="mr-3 mt-1">
              <UserCheck className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">Self-Certification Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                The Red Channel is for self-declared commodities not stored in TradeWiser or partner warehouses. 
                Self-certified receipts have limited verification and may have restricted access to certain platform features.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="receipts">My Receipts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileEdit className="h-5 w-5 mr-2 text-red-600" />
                    Self-Declaration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create receipts for commodities stored in your private facilities or with non-integrated warehouses
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600" 
                    onClick={handleOpenDialog}
                  >
                    Create now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Self-certified receipts may have limited verification status and restricted access to premium services
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600"
                    onClick={() => navigate('/green-channel')}
                  >
                    Explore Green Channel <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileCheck className="h-5 w-5 mr-2 text-red-600" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Self-certified receipts can be used for record-keeping and basic platform integration
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600" 
                    onClick={() => setActiveTab('receipts')}
                  >
                    View receipts <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={handleOpenDialog} 
                  size="lg" 
                  className="h-auto p-6 bg-red-600 hover:bg-red-700"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Create Self-Certified Receipt</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Register your privately stored commodities in the system
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
                <Button 
                  onClick={() => setActiveTab('receipts')} 
                  size="lg" 
                  variant="outline" 
                  className="h-auto p-6 border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">View Self-Certified Receipts</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Check your existing self-certified commodities with Red Channel marking
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto text-red-600" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="receipts" className="mt-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">My Self-Certified Receipts</h2>
                  <p className="text-muted-foreground">
                    View and manage all your self-certified commodity receipts
                  </p>
                </div>
                <Button 
                  onClick={handleOpenDialog}
                  className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Receipt
                </Button>
              </div>
              
              {receiptsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading receipts...</p>
                </div>
              ) : (
                <>
                  {redChannelReceipts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {redChannelReceipts.map((receipt: any) => (
                        <WarehouseReceiptCard 
                          key={receipt.id}
                          receipt={receipt}
                          redChannelVariant={true}
                          onView={(receipt: any) => navigate(`/receipts/${receipt.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed rounded-lg">
                      <FileCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <h3 className="text-lg font-medium mt-4">No Self-Certified Receipts</h3>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        You haven't created any self-certified receipts yet. Create one to register your privately stored commodities.
                      </p>
                      <Button
                        onClick={handleOpenDialog}
                        className="mt-6 bg-red-600 hover:bg-red-700"
                      >
                        Create Self-Certified Receipt
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}