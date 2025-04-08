import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import ReceiptWidget from "@/components/receipts/ReceiptWidget";
import WarehouseReceiptCard from "@/components/receipts/WarehouseReceiptCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, FileText, Upload, CreditCard, 
  Clock, Download, ExternalLink, Calendar 
} from "lucide-react";
import { WarehouseReceipt } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import UploadReceiptDialog from "@/components/receipts/UploadReceiptDialog";

export default function ReceiptsPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceipt | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "demat">("demat"); // Default to demat view

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

  // Calculate total value of filtered receipts in INR
  const getTotalValue = () => {
    const filteredReceipts = getFilteredReceipts();
    return filteredReceipts.reduce((total, receipt) => {
      const value = parseFloat(receipt.valuation?.toString() || "0");
      return total + value;
    }, 0).toLocaleString('en-IN');
  };

  // Calculate number of individual sacks from receipt quantity
  const getTotalSacks = () => {
    const filteredReceipts = getFilteredReceipts();
    return filteredReceipts.reduce((total, receipt) => {
      const quantity = parseFloat(receipt.quantity?.toString() || "0");
      // Each sack is 50kg (0.05 MT)
      return total + Math.ceil(quantity / 0.05);
    }, 0).toLocaleString('en-IN');
  };

  const handleViewReceipt = (receipt: WarehouseReceipt) => {
    setSelectedReceipt(receipt);
    setIsDetailsOpen(true);
  };

  // Function to determine the channel icon
  const getChannelIcon = (receipt: WarehouseReceipt) => {
    let isOrangeChannel = false;
    let isRedChannel = false;

    if (receipt.metadata && typeof receipt.metadata === 'object') {
      const metadata = receipt.metadata as Record<string, any>;
      isOrangeChannel = metadata.channelType === 'orange' || metadata.isExternal === true;
      isRedChannel = metadata.channelType === 'red' || metadata.isSelfCertified === true;
    }
    
    // External source indicates orange channel
    if (receipt.externalSource) {
      isOrangeChannel = true;
    }

    if (isRedChannel) {
      return <div className="h-3 w-3 rounded-full bg-red-500 mr-2" title="Red Channel" />;
    } else if (isOrangeChannel) {
      return <div className="h-3 w-3 rounded-full bg-orange-500 mr-2" title="Orange Channel" />;
    } else {
      return <div className="h-3 w-3 rounded-full bg-green-500 mr-2" title="Green Channel" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Digital Warehouse Receipts</h1>
            <p className="text-muted-foreground mt-1">Manage your digital warehouse receipts and linked commodity sacks</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === "cards" ? "demat" : "cards")}
            >
              {viewMode === "cards" ? (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Demat View
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card View
                </>
              )}
            </Button>
            <Button 
              onClick={() => setIsUploadDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Add Receipt
            </Button>
          </div>
        </div>

        {/* Stats summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">₹{getTotalValue()}</p>
            <p className="text-xs text-muted-foreground mt-1">Current market valuation</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Receipts</p>
            <p className="text-2xl font-bold">{getFilteredReceipts().length}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all channels</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Sacks</p>
            <p className="text-2xl font-bold">{getTotalSacks()}</p>
            <p className="text-xs text-muted-foreground mt-1">Individual 50kg commodity sacks</p>
          </div>
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
        ) : viewMode === "demat" ? (
          // Demat account style table view
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Receipt Number</th>
                    <th className="text-left py-3 px-4 font-medium">Commodity</th>
                    <th className="text-left py-3 px-4 font-medium">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium">Sacks</th>
                    <th className="text-left py-3 px-4 font-medium">Valuation</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Smart Contract</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredReceipts().map((receipt: WarehouseReceipt) => {
                    // Calculate number of sacks based on quantity (50kg per sack)
                    const sackCount = Math.ceil(parseFloat(receipt.quantity?.toString() || "0") / 0.05);
                    
                    return (
                      <tr 
                        key={receipt.id} 
                        className="border-t hover:bg-muted/10 cursor-pointer"
                        onClick={() => handleViewReceipt(receipt)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getChannelIcon(receipt)}
                            <span className="font-mono text-xs">{receipt.receiptNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {receipt.commodityName || "Not specified"}
                        </td>
                        <td className="py-3 px-4">
                          {receipt.quantity?.toString() || "0"} {receipt.measurementUnit || "MT"}
                        </td>
                        <td className="py-3 px-4">
                          {sackCount}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ₹{receipt.valuation?.toString() || "0"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            receipt.status === 'active' ? "bg-green-500" :
                            receipt.status === 'collateralized' ? "bg-blue-500" :
                            receipt.status === 'processing' ? "bg-amber-500" :
                            receipt.status === 'withdrawn' ? "bg-red-500" :
                            receipt.status === 'transferred' ? "bg-purple-500" :
                            "bg-gray-500"
                          }>
                            {receipt.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs truncate block max-w-[120px]">
                            {receipt.smartContractId || `SC-${receipt.id || '0'}-${Date.now().toString(16).slice(-6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleViewReceipt(receipt);
                          }}>
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Add new receipt row */}
                  <tr 
                    className="border-t hover:bg-muted/10 cursor-pointer text-muted-foreground"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <td colSpan={8} className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Receipt
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Card view
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
