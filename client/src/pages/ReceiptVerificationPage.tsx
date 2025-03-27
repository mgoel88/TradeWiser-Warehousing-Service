import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, AlertTriangle, FileCheck, Download, Calendar, ArrowLeft } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { WarehouseReceipt, Commodity, Warehouse } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { downloadReceiptPDF, generateReceiptPDF } from '@/lib/receiptGenerator';

// Extending the WarehouseReceipt type with proper typing for various fields 
type ExtendedWarehouseReceipt = WarehouseReceipt & {
  // Ensure the metadata is properly typed for verification
  metadata: Record<string, any>;
}

// Verification page that doesn't require authentication
// This page is used to verify receipts via QR code
export default function ReceiptVerificationPage() {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const [receipt, setReceipt] = useState<ExtendedWarehouseReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch receipt data using verification code
  useEffect(() => {
    const verifyReceipt = async () => {
      if (!verificationCode) {
        setError('No verification code provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const response = await apiRequest('GET', `/api/receipts/verify/${verificationCode}`);
        
        if (!response.ok) {
          throw new Error('Receipt verification failed');
        }
        
        const data = await response.json();
        setReceipt(data);
      } catch (err) {
        setError('Invalid verification code or receipt not found');
        console.error('Verification error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    verifyReceipt();
  }, [verificationCode]);
  
  // Format dates
  const formatExpiryDate = (issueDate: Date | string | null) => {
    if (!issueDate) return 'Not available';
    
    const expiryDate = new Date(issueDate);
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    return formatDate(expiryDate);
  };
  
  // Handle PDF download
  const handleDownload = async () => {
    if (!receipt) return;
    
    try {
      const receiptData = {
        receiptNumber: receipt.receiptNumber,
        issueDate: formatDate(receipt.issuedDate || new Date()),
        expiryDate: formatExpiryDate(receipt.issuedDate),
        depositorName: "Owner", // In a real system, we'd retrieve this
        commodityName: receipt.commodityName || "Commodity",
        quantity: receipt.quantity?.toString() || "0" + " MT",
        qualityGrade: receipt.qualityGrade || "Standard",
        warehouseName: receipt.warehouseName || "Warehouse",
        warehouseAddress: receipt.warehouseAddress || "Address",
        valuationAmount: receipt.valuation ? `₹${receipt.valuation.toString()}` : "₹0",
        verificationCode: verificationCode
      };
      
      await downloadReceiptPDF(receiptData);
      
      toast({
        title: "Receipt downloaded",
        description: "The warehouse receipt has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the receipt",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Warehouse Receipt Verification</CardTitle>
          <CardDescription>
            Verify the authenticity of warehouse receipts
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="text-center text-sm text-muted-foreground">
                Verifying receipt...
              </p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          ) : receipt ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 text-green-700">
                <FileCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Verification Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                  This warehouse receipt is valid and authentic
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Receipt Number</p>
                    <p className="font-mono text-muted-foreground text-xs">{receipt.receiptNumber}</p>
                  </div>
                  <Badge variant={receipt.status === 'active' ? 'default' : (receipt.status === 'collateralized' ? 'outline' : 'destructive')}>
                    {receipt.status}
                  </Badge>
                </div>
                
                <Separator className="my-2" />
                
                <div>
                  <p className="text-sm font-medium">Commodity</p>
                  <p className="text-muted-foreground">{receipt.commodityName || "Not available"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <p className="text-muted-foreground">{receipt.quantity} MT</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Valuation</p>
                    <p className="text-primary font-medium">₹{receipt.valuation?.toString() || "0"}</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div>
                  <p className="text-sm font-medium">Warehouse</p>
                  <p className="text-muted-foreground">{receipt.warehouseName || "Not available"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Issue Date</p>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(receipt.issuedDate || new Date())}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Expiry Date</p>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatExpiryDate(receipt.issuedDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                No receipt information available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          {receipt && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          )}
          
          <Link href="/">
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to TradeWiser
            </Button>
          </Link>
        </CardFooter>
      </Card>
      
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>TradeWiser © 2023 - Blockchain-secured commodity receipts</p>
      </div>
    </div>
  );
}