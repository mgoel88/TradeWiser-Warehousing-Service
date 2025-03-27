import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Download, ArrowRight, Link2, Shield, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { WarehouseReceipt } from "@shared/schema";
import { verifyBlockchainRecord } from "@/lib/blockchainUtils";
import OwnershipTransferDialog from "./OwnershipTransferDialog";

export default function ReceiptWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("active");
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceipt | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [verificationStates, setVerificationStates] = useState<Record<number, 'idle' | 'verifying' | 'verified' | 'failed'>>({});

  // Query to fetch receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 30000
  });

  // Function to filter receipts by status
  const getFilteredReceipts = () => {
    if (!receipts) return [];
    
    switch (selectedTab) {
      case "active":
        return receipts.filter((receipt: WarehouseReceipt) => receipt.status === "active");
      case "collateralized":
        return receipts.filter((receipt: WarehouseReceipt) => receipt.status === "collateralized");
      case "all":
        return receipts;
      default:
        return receipts;
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = async (receipt: WarehouseReceipt) => {
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 102, 204);
      doc.text("ELECTRONIC WAREHOUSE RECEIPT", 105, 20, { align: "center" });
      
      // Add logo placeholder
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(14, 12, 36, 15, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("TradeWiser", 32, 21, { align: "center" });
      
      // Add receipt number and date
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Receipt No: ${receipt.receiptNumber}`, 14, 40);
      doc.text(`Issue Date: ${format(new Date(receipt.issuedDate), "dd/MM/yyyy")}`, 14, 47);

      // Add expiry date
      if (receipt.expiryDate) {
        doc.text(`Expiry Date: ${format(new Date(receipt.expiryDate), "dd/MM/yyyy")}`, 14, 54);
      }
      
      // Add divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 60, 196, 60);
      
      // Add commodity details
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Commodity Details", 14, 70);
      
      doc.setFontSize(11);
      doc.text(`Commodity: ${receipt.commodityName || "Not specified"}`, 14, 80);
      doc.text(`Quantity: ${receipt.quantity} MT`, 14, 87);
      doc.text(`Quality Grade: ${receipt.qualityGrade || "Not specified"}`, 14, 94);
      doc.text(`Warehouse: ${receipt.warehouseName || "Not specified"}`, 14, 101);
      doc.text(`Warehouse Address: ${receipt.warehouseAddress || "Not specified"}`, 14, 108);
      
      // Add valuation
      doc.setFontSize(13);
      doc.setTextColor(0, 102, 60);
      doc.text(`Valuation: ₹${Number(receipt.valuation || 0).toLocaleString()}`, 14, 120);
      
      // Try to extract verification code if available
      let verificationCode = '';
      try {
        if (receipt.metadata) {
          const metadata = typeof receipt.metadata === 'string' 
            ? JSON.parse(receipt.metadata) 
            : receipt.metadata;
          
          verificationCode = metadata.verificationCode || '';
        }
      } catch (err) {
        console.error("Error parsing receipt metadata:", err);
      }
      
      // Add QR code for verification if we have a verification code
      if (verificationCode) {
        const qrUrl = `${window.location.origin}/receipts/verify/${verificationCode}`;
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 120,
            margin: 1,
          });
          
          // Add QR code to PDF
          doc.addImage(qrCodeDataUrl, "PNG", 140, 70, 40, 40);
          
          // Add verification text
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text("Scan to verify authenticity", 160, 115, { align: "center" });
          doc.text(`Verification Code: ${verificationCode}`, 160, 120, { align: "center" });
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }
      
      // Add blockchain information if available
      if (receipt.blockchainHash) {
        // Add blockchain verification section
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(14, 130, 182, 30, 2, 2, "F");
        
        doc.setFontSize(11);
        doc.setTextColor(0, 102, 153);
        doc.text("Blockchain Verification", 20, 140);
        
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text("This warehouse receipt has been recorded on blockchain for security and authenticity.", 20, 146);
        doc.text(`Transaction Hash: ${receipt.blockchainHash}`, 20, 152);
      }
      
      // Add footer
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 270, 196, 270);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("This is an electronically generated document and does not require physical signature.", 105, 277, { align: "center" });
      doc.text(`Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} • TradeWiser Warehouse Receipt System`, 105, 282, { align: "center" });
      
      // Save PDF
      doc.save(`warehouse_receipt_${receipt.receiptNumber}.pdf`);
      
      toast({
        title: "Receipt Downloaded",
        description: "The warehouse receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the warehouse receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle blockchain verification
  const handleVerifyOnBlockchain = async (receipt: WarehouseReceipt) => {
    if (!receipt.blockchainHash) {
      toast({
        title: "Verification Failed",
        description: "This receipt does not have blockchain verification data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVerificationStates(prev => ({ ...prev, [receipt.id]: 'verifying' }));
      
      // Verify on blockchain
      const isValid = await verifyBlockchainRecord(receipt.blockchainHash);
      
      setVerificationStates(prev => ({ 
        ...prev, 
        [receipt.id]: isValid ? 'verified' : 'failed' 
      }));
      
      if (isValid) {
        toast({
          title: "Verification Successful",
          description: "This receipt has been verified on the blockchain.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "This receipt could not be verified on the blockchain.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerificationStates(prev => ({ ...prev, [receipt.id]: 'failed' }));
      toast({
        title: "Verification Error",
        description: "An error occurred during blockchain verification.",
        variant: "destructive",
      });
    }
  };

  // Handle transfer ownership
  const handleTransferOwnership = (receipt: WarehouseReceipt) => {
    setSelectedReceipt(receipt);
    setIsTransferDialogOpen(true);
  };

  // Handle transfer completion
  const handleTransferComplete = () => {
    // Refresh receipts data
    queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
    
    toast({
      title: "Transfer Success",
      description: "Receipt ownership has been transferred successfully.",
    });
  };

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Warehouse Receipts
          </CardTitle>
          <CardDescription>
            Manage your eWarehouse receipts, download receipts, and transfer ownership.
          </CardDescription>
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full mt-2"
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="collateralized">Collateralized</TabsTrigger>
              <TabsTrigger value="all">All Receipts</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : getFilteredReceipts().length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/10">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">No Receipts Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You don't have any {selectedTab !== "all" && selectedTab} warehouse receipts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredReceipts().map((receipt: WarehouseReceipt) => (
                <div key={receipt.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium flex items-center">
                        {receipt.receiptNumber}
                        {receipt.blockchainHash && (
                          <span className="ml-2 flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Shield className="h-3 w-3 mr-1" />
                            Blockchain Secured
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {receipt.commodityName || "Commodity"} • {receipt.quantity} MT • Grade: {receipt.qualityGrade || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {receipt.warehouseName || "Warehouse"} • Issued: {formatDate(receipt.issuedDate)}
                      </p>
                      {receipt.valuation && (
                        <p className="text-sm font-medium text-primary">
                          Valuation: ₹{Number(receipt.valuation).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="md:text-right mt-3 md:mt-0">
                      <div className="flex md:flex-col md:items-end gap-2">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-muted">
                          {receipt.status}
                        </span>
                        {receipt.expiryDate && (
                          <span className="inline-block text-xs text-muted-foreground">
                            Expires: {formatDate(receipt.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleDownloadReceipt(receipt)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    {receipt.blockchainHash && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleVerifyOnBlockchain(receipt)}
                        disabled={verificationStates[receipt.id] === 'verifying'}
                      >
                        {verificationStates[receipt.id] === 'verifying' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : verificationStates[receipt.id] === 'verified' ? (
                          <>
                            <BadgeCheck className="h-4 w-4 text-green-600" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            Verify on Blockchain
                          </>
                        )}
                      </Button>
                    )}
                    
                    {receipt.status === "active" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleTransferOwnership(receipt)}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Transfer Ownership
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            All receipts are cryptographically secured on blockchain for tamper-proof verification.
          </p>
        </CardFooter>
      </Card>
      
      {/* Ownership Transfer Dialog */}
      {selectedReceipt && (
        <OwnershipTransferDialog
          receipt={selectedReceipt}
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </>
  );
}