import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import ReceiptWidget from "@/components/receipts/ReceiptWidget";
import WarehouseReceiptCard from "@/components/receipts/WarehouseReceiptCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload } from "lucide-react";
import { WarehouseReceipt } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import UploadReceiptDialog from "@/components/receipts/UploadReceiptDialog";

export default function ReceiptsPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceipt | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Query to fetch receipts
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 30000
  });

  // Function to filter receipts by channel type
  const getFilteredReceipts = () => {
    if (!receipts) return [];
    
    const allReceipts = receipts as WarehouseReceipt[];
    
    switch (selectedTab) {
      case "green":
        return allReceipts.filter(r => {
          if (r.metadata && typeof r.metadata === 'object') {
            const metadata = r.metadata as Record<string, any>;
            return metadata.channelType === 'green' || (!metadata.channelType && !metadata.isExternal && !metadata.isSelfCertified);
          }
          return !r.externalSource; // Default to green if no metadata
        });
      case "orange":
        return allReceipts.filter(r => {
          if (r.metadata && typeof r.metadata === 'object') {
            const metadata = r.metadata as Record<string, any>;
            return metadata.channelType === 'orange' || metadata.isExternal === true;
          }
          return !!r.externalSource; // External source indicates orange channel
        });
      case "red":
        return allReceipts.filter(r => {
          if (r.metadata && typeof r.metadata === 'object') {
            const metadata = r.metadata as Record<string, any>;
            return metadata.channelType === 'red' || metadata.isSelfCertified === true;
          }
          return false;
        });
      case "all":
      default:
        return allReceipts;
    }
  };

  const handleViewReceipt = (receipt: WarehouseReceipt) => {
    setSelectedReceipt(receipt);
    setIsDetailsOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Warehouse Receipts</h1>
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Receipt
          </Button>
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full mb-6"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All Receipts</TabsTrigger>
            <TabsTrigger value="green" className="text-green-600">Green Channel</TabsTrigger>
            <TabsTrigger value="orange" className="text-orange-600">Orange Channel</TabsTrigger>
            <TabsTrigger value="red" className="text-red-600">Red Channel</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredReceipts().map((receipt: WarehouseReceipt) => (
              <WarehouseReceiptCard 
                key={receipt.id} 
                receipt={receipt}
                onView={handleViewReceipt}
                redChannelVariant={
                  receipt.metadata && typeof receipt.metadata === 'object' && 
                  ((receipt.metadata as any).channelType === 'red' || (receipt.metadata as any).isSelfCertified)
                }
                orangeChannelVariant={
                  receipt.metadata && typeof receipt.metadata === 'object' && 
                  ((receipt.metadata as any).channelType === 'orange' || (receipt.metadata as any).isExternal) || 
                  !!receipt.externalSource
                }
              />
            ))}

            {/* Add Receipt Card */}
            <div 
              className="border border-dashed rounded-xl h-[220px] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Plus className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">Add New Receipt</p>
              <p className="text-xs text-muted-foreground mt-1">Upload or create a new receipt</p>
            </div>
          </div>
        )}

        {/* Upload Dialog */}
        <UploadReceiptDialog 
          open={isUploadDialogOpen} 
          onOpenChange={setIsUploadDialogOpen} 
        />

        {/* Receipt Details Dialog */}
        {selectedReceipt && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Warehouse Receipt Details
                </DialogTitle>
                <DialogDescription>
                  View details and manage your warehouse receipt
                </DialogDescription>
              </DialogHeader>
              
              <WarehouseReceiptCard 
                receipt={selectedReceipt} 
                className="w-full max-w-full cursor-default" 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
