import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, ExternalLink, Calendar, Clock, CreditCard, ArrowUpRight, FileCheck, Printer, ShieldCheck } from "lucide-react";
import { WarehouseReceipt, Commodity, Warehouse } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { downloadReceiptPDF } from '@/lib/receiptGenerator';
import { apiRequest } from '@/lib/queryClient';

interface WarehouseReceiptCardProps {
  receipt: WarehouseReceipt;
  onView?: (receipt: WarehouseReceipt) => void;
  onPledge?: (receipt: WarehouseReceipt) => void;
  className?: string;
}

export default function WarehouseReceiptCard({ receipt, onView, onPledge, className = '' }: WarehouseReceiptCardProps) {
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
        verificationCode: verificationCode
      };
      
      await downloadReceiptPDF(receiptData);
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };
  
  // Simplified card view - like a credit card
  return (
    <>
      <Card 
        className={`relative overflow-hidden transition-all hover:shadow-md cursor-pointer ${className}`}
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="absolute top-0 right-0 h-full w-2 z-10" style={{ backgroundColor: getStatusColor().replace('bg-', '') }}></div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              <span className="font-mono text-sm">{receipt.receiptNumber}</span>
            </div>
            <Badge className={getStatusColor()}>{receipt.status}</Badge>
          </div>
          
          <h3 className="font-medium mt-3 text-lg">{commodity?.name || "Commodity"}</h3>
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p>{receipt.quantity} {commodity?.measurementUnit || "MT"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grade</p>
              <p>{commodity?.gradeAssigned || "Standard"}</p>
            </div>
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Valuation</p>
              <p className="font-medium text-primary">₹{receipt.valuation?.toString() || "0"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formattedDate}
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-3 bg-muted/30 border-t flex justify-end">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardFooter>
      </Card>
      
      {/* Detailed receipt dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Warehouse Receipt
            </DialogTitle>
            <DialogDescription>
              Electronic Warehouse Receipt (eWR) details and actions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                  <p className="text-muted-foreground">{receipt.receiptType || "Standard"}</p>
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
            
            {/* Verification box */}
            <div className="bg-muted p-3 rounded-md mt-4">
              <div className="flex items-center mb-1">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Blockchain Verification</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                This electronic warehouse receipt is secured using blockchain technology. 
                Verification code:
              </p>
              <p className="bg-background p-2 rounded mt-1 text-center font-mono text-xs">
                {verificationCode}
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
                      verificationCode: verificationCode
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