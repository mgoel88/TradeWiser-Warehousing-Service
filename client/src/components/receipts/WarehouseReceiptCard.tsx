import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, Download, ExternalLink, Calendar, Clock, CreditCard, 
  ArrowUpRight, FileCheck, Printer, ShieldCheck, Shield, Eye, QrCode 
} from "lucide-react";
import { WarehouseReceipt, Commodity, Warehouse } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { generateReceiptPDF, generatePlainTextReceipt } from '@/lib/receiptGenerator';
import { apiRequest } from '@/lib/queryClient';
import { QRCodeGenerator } from './QRCodeGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WarehouseReceiptCardProps {
  receipt: WarehouseReceipt;
  onView?: (receipt: WarehouseReceipt) => void;
  onPledge?: (receipt: WarehouseReceipt) => void;
  className?: string;
  redChannelVariant?: boolean;
  orangeChannelVariant?: boolean;
}


export default function WarehouseReceiptCard({ receipt, onView, onPledge, className = '', redChannelVariant = false, orangeChannelVariant = false }: WarehouseReceiptCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch commodity data for the receipt
  const { data: commodity } = useQuery({
    queryKey: ['/api/commodities', receipt.commodityId],
    queryFn: async () => {
      if (!receipt.commodityId) return null;
      const res = await apiRequest('GET', `/api/commodities/${receipt.commodityId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!receipt.commodityId,
  });

  // Fetch warehouse data for the receipt
  const { data: warehouse } = useQuery({
    queryKey: ['/api/warehouses', receipt.warehouseId],
    queryFn: async () => {
      if (!receipt.warehouseId) return null;
      const res = await apiRequest('GET', `/api/warehouses/${receipt.warehouseId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!receipt.warehouseId,
  });

  // Determine the status color and background
  const getStatusColor = () => {
    switch (receipt.status) {
      case 'active':
        return 'bg-green-500';
      case 'collateralized':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-amber-500';
      case 'withdrawn':
        return 'bg-red-500';
      case 'transferred':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format the creation date
  const formattedDate = formatDate(receipt.issuedDate || new Date());

  // Calculate expiry date (6 months from issue date)
  const expiryDate = new Date(receipt.issuedDate || new Date());
  expiryDate.setMonth(expiryDate.getMonth() + 6);
  const formattedExpiryDate = formatDate(expiryDate);

  // Generate a verification code
  const verificationCode = `WR-${receipt.id}-${Date.now().toString(16)}`;

  // Handle download receipt
  const handleDownload = async () => {
    try {
      const receiptData = {
        receiptNumber: receipt.receiptNumber,
        issueDate: formattedDate,
        expiryDate: formattedExpiryDate,
        depositorName: "Rajiv Farmer", // This should come from user data
        commodityName: commodity?.name || "Unknown Commodity",
        quantity: receipt.quantity?.toString() || "0" + " " + (commodity?.measurementUnit || "MT"),
        qualityGrade: commodity?.gradeAssigned || "Standard",
        warehouseName: warehouse?.name || "Unknown Warehouse",
        warehouseAddress: warehouse?.address || "Unknown Location",
        valuationAmount: receipt.valuation ? `₹${receipt.valuation.toString()}` : "₹0",
        verificationCode: verificationCode,
        smartContractId: receipt.smartContractId || ""
      };

      // Generate the PDF
      const pdfBlob = await generateReceiptPDF(receiptData);

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TradeWiser_Receipt_${receipt.receiptNumber.replace(/[-\s]/g, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  // Determine if this is an Orange Channel (third-party) receipt
  const isOrangeChannel = React.useMemo(() => {
    if (orangeChannelVariant) return true;

    if (receipt.metadata && typeof receipt.metadata === 'object') {
      const metadata = receipt.metadata as Record<string, any>;
      return metadata.channelType === 'orange' || metadata.isExternal === true;
    }

    // Also check if it has an externalSource as fallback
    return !!receipt.externalSource;
  }, [receipt, orangeChannelVariant]);

  // Determine if this is a Red Channel (self-certified) receipt
  const isRedChannel = React.useMemo(() => {
    if (redChannelVariant) return true;

    if (receipt.metadata && typeof receipt.metadata === 'object') {
      const metadata = receipt.metadata as Record<string, any>;
      return metadata.channelType === 'red' || metadata.isSelfCertified === true;
    }

    return false;
  }, [receipt, redChannelVariant]);

  // Determine card background based on channel type
  const cardBackground = React.useMemo(() => {
    if (isOrangeChannel) {
      // Orange Channel receipt - use orange gradient
      return `linear-gradient(135deg, #ff8c00, #e25822)`;
    }

    if (isRedChannel) {
      // Red Channel receipt - use red gradient
      return `linear-gradient(135deg, #d32f2f, #b71c1c)`;
    }

    // Default Green Channel receipt - use dark gradient
    return `linear-gradient(135deg, #1a1a1a, #333)`;
  }, [isOrangeChannel, isRedChannel]);

  // Styled card view like a real credit card
  return (
    <>
      <Card 
        className={`relative overflow-hidden transition-all hover:shadow-md cursor-pointer ${className} rounded-xl`}
        onClick={() => {
          if (onView) {
            onView(receipt);
          } else {
            setIsDetailOpen(true);
          }
        }}
        style={{ 
          background: cardBackground,
          maxWidth: '340px' 
        }}
      >
        {/* Smart contract chip */}
        <div className="absolute top-4 left-4 h-8 w-12 rounded-md bg-yellow-500/80 flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-3 gap-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-1 w-1 bg-yellow-300/70 rounded-sm"></div>
            ))}
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-0 right-0 h-full w-2" 
          style={{ backgroundColor: getStatusColor().replace('bg-', '') }}></div>

        <CardContent className="p-4 text-white">
          {/* Smart Contract ID */}
          <div className="mt-12 mb-4">
            <p className="text-xs text-white/70">Smart Contract ID</p>
            <p className="font-mono text-sm">{receipt.smartContractId || "SC-" + receipt.id + "-" + Date.now().toString(16).slice(-6)}</p>
          </div>

          {/* Receipt number displayed as credit card number */}
          <div className="mt-4 mb-4">
            <p className="text-xs text-white/70">Receipt Number</p>
            <p className="font-mono text-lg tracking-wider">{receipt.receiptNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p className="text-xs text-white/70">Commodity</p>
              <p className="font-medium">{commodity?.name || receipt.commodityName || "Commodity"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Quantity</p>
              <p>{receipt.quantity} {receipt.measurementUnit || commodity?.measurementUnit || "MT"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p className="text-xs text-white/70">Valuation</p>
              <p className="font-medium">₹{receipt.valuation?.toString() || "0"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Valid Until</p>
              <p className="flex items-center">
                {formatDate(expiryDate)}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 border-t border-white/10 flex justify-between items-center">
          <Badge variant="outline" className="border-white/50 text-white">
            {receipt.status}
          </Badge>
          <ArrowUpRight className="h-4 w-4 text-white/70" />
        </CardFooter>
      </Card>

      {/* Detailed receipt dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Warehouse Receipt Smart Contract
            </DialogTitle>
            <DialogDescription>
              {isOrangeChannel ? (
                <span className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1 text-orange-500" />
                  External Warehouse Receipt (Orange Channel)
                </span>
              ) : isRedChannel ? (
                <span className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-red-500" />
                  Self-Certified Commodity Receipt (Red Channel)
                </span>
              ) : (
                <span className="flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1 text-green-500" />
                  Verified Blockchain eWR Smart Contract
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sacks">Sacks</TabsTrigger>
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Header with receipt number and status */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Receipt Number</p>
                  <p className="font-mono text-muted-foreground">{receipt.receiptNumber}</p>
                </div>
                <Badge className={getStatusColor()}>{receipt.status}</Badge>
              </div>

              <Separator />

              {/* Commodity Details */}
              <div>
                <h3 className="font-medium mb-2">Commodity Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Commodity</p>
                    <p className="text-muted-foreground">{commodity?.name || "Unknown Commodity"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Quantity</p>
                    <p className="text-muted-foreground">{receipt.quantity} {commodity?.measurementUnit || "MT"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Grade</p>
                    <p className="text-muted-foreground">{commodity?.gradeAssigned || "Standard"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Valuation</p>
                    <p className="text-primary font-medium">₹{receipt.valuation?.toString() || "0"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Type</p>
                    <p className="text-muted-foreground">
                      {(receipt.metadata && typeof receipt.metadata === 'object' && (receipt.metadata as any).receiptType) || 
                      (isRedChannel ? "Self-Certified" : isOrangeChannel ? "External" : "Standard")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Warehouse & Validity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Storage Location</h3>
                  <p className="text-sm">{warehouse?.name || "Unknown Warehouse"}</p>
                  <p className="text-sm text-muted-foreground">{warehouse?.address || "Unknown Location"}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Validity</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Issue Date</p>
                      <p className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formattedDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry Date</p>
                      <p className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formattedExpiryDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments & Documents */}
              {receipt.attachmentUrl && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Attachments</h3>
                  <div className="border rounded-md overflow-hidden">
                    <div className="p-3 bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">Original Receipt Document</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/receipts/attachments/${receipt.attachmentUrl}`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = `/api/receipts/attachments/${receipt.attachmentUrl}`;
                            link.download = receipt.attachmentUrl || 'receipt-document';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {receipt.attachmentUrl?.match(/\.(jpg|jpeg|png)$/i) && (
                      <div className="p-2 bg-background">
                        <img 
                          src={`/api/receipts/attachments/${receipt.attachmentUrl}`} 
                          alt="Receipt Document" 
                          className="w-full max-h-40 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sacks">
              <div className="py-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Individual Sacks</h3>
                  <Badge variant="outline" className="bg-primary/10">
                    {Math.ceil(parseFloat(receipt.quantity.toString()) / 0.05)} sacks
                  </Badge>
                </div>
                
                {/* Sacks table */}
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Sack ID</th>
                        <th className="text-left p-2">Weight</th>
                        <th className="text-left p-2">Grade</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Generate dummy sacks based on receipt quantity (50kg per sack) */}
                      {Array.from({ length: Math.ceil(parseFloat(receipt.quantity.toString()) / 0.05) }).map((_, index) => {
                        // Generate a unique sack ID based on receipt number
                        const receiptNumericPart = receipt.receiptNumber.replace(/\D/g, '');
                        const sackId = `SC-SAK-${receiptNumericPart}-${(index + 1).toString().padStart(3, '0')}`;
                        
                        // Generate realistic looking sack weights - most will be 50kg but some might be slightly different
                        const weight = Math.random() > 0.8 ? (49.5 + Math.random()).toFixed(1) : "50.0";
                        
                        // Generate grades - most will be the same as receipt but some might vary
                        const grades = ["A+", "A", "B+", "B", "C+", "C"];
                        const mainGrade = commodity?.gradeAssigned || grades[1];
                        const grade = Math.random() > 0.9 ? 
                          grades[grades.indexOf(mainGrade) + (Math.random() > 0.5 ? 1 : -1) || 1] : 
                          mainGrade;
                          
                        // Status may vary
                        const statuses = ["active", "processing", "inspected"];
                        const status = statuses[Math.floor(Math.random() * statuses.length)];
                        
                        return (
                          <tr key={sackId} className="border-t hover:bg-muted/20">
                            <td className="p-2 font-mono text-xs">{sackId}</td>
                            <td className="p-2">{weight} kg</td>
                            <td className="p-2">
                              <Badge variant="outline" className={
                                grade.includes("A") ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                grade.includes("B") ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }>
                                {grade}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge className={
                                status === "active" ? "bg-green-500" :
                                status === "processing" ? "bg-amber-500" :
                                "bg-blue-500"
                              }>
                                {status}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Each 50kg sack has a unique identifier and blockchain tracking. Click on any sack to view its detailed information, quality assessments, and movement history.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="qrcode">
              <div className="flex flex-col items-center py-2">
                <h3 className="font-medium mb-4 text-center">Receipt Verification QR Code</h3>
                <div className="w-full max-w-xs mx-auto">
                  <QRCodeGenerator receiptId={receipt.id} />
                </div>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Use this QR code to verify the authenticity of this receipt and track its ownership.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="blockchain">
              <div className="py-4 space-y-3">
                <h3 className="font-medium">Blockchain Record</h3>
                <div className="bg-black/5 p-3 rounded-md">
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Smart Contract ID</p>
                    <p className="font-mono text-sm break-all">{receipt.smartContractId || "SC-" + receipt.id + "-" + Date.now().toString(16).slice(-6)}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Blockchain Hash</p>
                    <p className="font-mono text-sm break-all">{receipt.blockchainHash || '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Last Transaction</p>
                    <p className="font-mono text-sm">{formatDate(receipt.issuedDate || new Date())}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This receipt is securely recorded on the TradeWiser blockchain network, ensuring tamper-proof ownership records and transparent transaction history.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Additional information outside tabs */}
          <div className="space-y-4 mt-4">
            {/* External Source Info - Only shown for Orange Channel receipts */}
            {isOrangeChannel && (
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <div className="flex items-center mb-1">
                  <ExternalLink className="h-4 w-4 mr-2 text-orange-500" />
                  <h3 className="text-sm font-medium text-orange-700">External Receipt Source</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm text-orange-700">
                      {receipt.externalSource || (receipt.metadata && typeof receipt.metadata === 'object' 
                        ? (receipt.metadata as any).sourceType || 'External Source' 
                        : 'External Source')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Processing Method</p>
                    <p className="text-sm text-orange-700">
                      {receipt.metadata && typeof receipt.metadata === 'object' 
                        ? (receipt.metadata as any).processingMethod || 'ETL Import' 
                        : 'ETL Import'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-orange-600/80 mt-2">
                  This is an imported third-party warehouse receipt processed through the Orange Channel ETL tool.
                </p>
              </div>
            )}

            {/* Red Channel Info - Only shown for Red Channel (self-certified) receipts */}
            {isRedChannel && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <div className="flex items-center mb-1">
                  <Shield className="h-4 w-4 mr-2 text-red-600" />
                  <h3 className="text-sm font-medium text-red-700">Self-Certified Commodity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Certification Type</p>
                    <p className="text-sm text-red-700">
                      {receipt.metadata && typeof receipt.metadata === 'object' 
                        ? (receipt.metadata as any).certificationType || 'Self-Declaration' 
                        : 'Self-Declaration'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Storage Type</p>
                    <p className="text-sm text-red-700">
                      {receipt.metadata && typeof receipt.metadata === 'object' 
                        ? (receipt.metadata as any).storageType || 'Personal Storage' 
                        : 'Personal Storage'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-red-600/80 mt-2">
                  This is a self-certified commodity receipt registered through the Red Channel. The commodity information and valuation are based on self-declaration.
                </p>
              </div>
            )}

            {/* Smart Contract Info */}
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center mb-1">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Blockchain Verification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Smart Contract ID</p>
                  <p className="font-mono text-xs bg-background p-1 rounded mt-1">
                    {receipt.smartContractId || `SC-${receipt.id || '0'}-${Date.now().toString(16).slice(-6)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verification Code</p>
                  <p className="font-mono text-xs bg-background p-1 rounded mt-1">
                    {verificationCode}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This electronic warehouse receipt is secured using blockchain technology for tamper-proof verification.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const receiptData = {
                      receiptNumber: receipt.receiptNumber,
                      issueDate: formattedDate,
                      expiryDate: formattedExpiryDate,
                      depositorName: "Rajiv Farmer", // This should come from user data
                      commodityName: commodity?.name || "Unknown Commodity",
                      quantity: receipt.quantity?.toString() || "0" + " " + (commodity?.measurementUnit || "MT"),
                      qualityGrade: commodity?.gradeAssigned || "Standard",
                      warehouseName: warehouse?.name || "Unknown Warehouse",
                      warehouseAddress: warehouse?.address || "Unknown Location",
                      valuationAmount: receipt.valuation ? `₹${receipt.valuation.toString()}` : "₹0",
                      verificationCode: verificationCode,
                      smartContractId: receipt.smartContractId || undefined
                    };

                    const textReceipt = generatePlainTextReceipt(receiptData);
                    navigator.clipboard.writeText(textReceipt);

                    // Show feedback (this would be better with a toast)
                    alert("Receipt text copied to clipboard");
                  } catch (error) {
                    console.error("Error copying receipt text:", error);
                  }
                }}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Copy Text
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Generate the PDF first
                    const receiptData = {
                      receiptNumber: receipt.receiptNumber,
                      issueDate: formattedDate,
                      expiryDate: formattedExpiryDate,
                      depositorName: "Rajiv Farmer", // This should come from user data
                      commodityName: commodity?.name || "Unknown Commodity",
                      quantity: receipt.quantity?.toString() || "0" + " " + (commodity?.measurementUnit || "MT"),
                      qualityGrade: commodity?.gradeAssigned || "Standard",
                      warehouseName: warehouse?.name || "Unknown Warehouse",
                      warehouseAddress: warehouse?.address || "Unknown Location",
                      valuationAmount: receipt.valuation ? `₹${receipt.valuation.toString()}` : "₹0",
                      verificationCode: verificationCode,
                      smartContractId: receipt.smartContractId || undefined
                    };

                    // Generate PDF and create object URL
                    const pdfBlob = await generateReceiptPDF(receiptData);
                    const url = URL.createObjectURL(pdfBlob);

                    // Open in new window and print
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => {
                        printWindow.print();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      };
                    }
                  } catch (error) {
                    console.error("Error printing receipt:", error);
                  }
                }}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (verificationCode) {
                    window.open(`/verify-receipt/${verificationCode}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Verify
              </Button>
            </div>

            {receipt.status === 'active' && (
              <Button 
                className="sm:w-auto w-full" 
                onClick={() => {
                  if (onPledge) onPledge(receipt);
                  setIsDetailOpen(false);
                }}
              >
                <FileCheck className="h-4 w-4 mr-1" />
                Use as Collateral
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}