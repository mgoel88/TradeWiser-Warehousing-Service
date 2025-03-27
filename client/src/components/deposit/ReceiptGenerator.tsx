import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadReceiptPDF } from "@/lib/receiptGenerator";
import { Package, FileText, Download, CheckCircle, AlertTriangle } from "lucide-react";
import type { Process, Commodity, Warehouse } from "@shared/schema";

interface ReceiptGeneratorProps {
  process: Process;
  commodity: Commodity;
  warehouse: Warehouse;
  metrics: any;
  onComplete: () => void;
}

export default function ReceiptGenerator({ process, commodity, warehouse, metrics, onComplete }: ReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate a unique verification code based on the process ID
  const generateVerificationCode = (processId: number) => {
    const timestamp = Date.now().toString(16).toUpperCase();
    const randomStr = Math.random().toString(16).substring(2, 6).toUpperCase();
    return `WR-${processId}-${timestamp}-${randomStr}`;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateReceipt = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create a receipt number
      const receiptNumber = `WR${process.id}${Math.floor(Math.random() * 10000)}`;
      
      // Generate verification code
      const verificationCode = generateVerificationCode(process.id);
      
      // Parse valuation from metrics
      let valuationAmount = "0";
      try {
        // Extract numeric value from totalValuation (e.g., "₹ 101,850" -> "101850")
        valuationAmount = metrics.totalValuation.replace(/[^0-9.]/g, '');
      } catch (e) {
        console.warn("Could not parse valuation amount:", e);
      }
      
      // Create the receipt payload - omitting receiptType which doesn't exist in the database
      const payload = {
        receiptNumber,
        quantity: commodity.quantity.toString(),
        depositorKycId: `KYC${process.userId}${Date.now().toString(16).slice(-6)}`,
        warehouseLicenseNo: `WL-${warehouse.id}-${new Date().getFullYear()}`,
        commodityId: commodity.id,
        warehouseId: warehouse.id,
        ownerId: process.userId,
        status: "active", // Use enum value
        blockchainHash: `BH${Date.now().toString(16)}${Math.random().toString(16).substring(2, 6)}`,
        valuation: valuationAmount,
        commodityName: commodity.name,
        qualityGrade: metrics.gradeAssigned,
        warehouseName: warehouse.name,
        warehouseAddress: warehouse.address,
        qualityParameters: JSON.stringify({
          moisture: metrics.finalQuality.moisture,
          foreignMatter: metrics.finalQuality.foreignMatter,
          brokenGrains: metrics.finalQuality.brokenGrains
        }),
        // Use new Date objects instead of ISO strings for dates
        // expiryDate will be set by the server
        metadata: JSON.stringify({
          verificationCode,
          processId: process.id,
          generatedAt: new Date().toISOString(),
          metricSnapshot: {
            initialWeight: metrics.initialWeight,
            cleanedWeight: metrics.cleanedWeight,
            grade: metrics.gradeAssigned
          }
        })
      };
      
      console.log("Generating receipt with payload:", payload);
      
      // Call the API
      const response = await apiRequest("POST", "/api/receipts", payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate receipt");
      }
      
      const result = await response.json();
      console.log("Receipt generated:", result);
      
      // Update process status
      const processUpdate = {
        status: "completed",
        currentStage: "ewr_generation",
        stageProgress: {
          arrived_at_warehouse: "completed",
          pre_cleaning: "completed",
          quality_assessment: "completed",
          packaging: "completed",
          ewr_generation: "completed"
        }
      };
      
      const processResponse = await apiRequest(
        "PATCH",
        `/api/processes/${process.id}`,
        processUpdate
      );
      
      if (!processResponse.ok) {
        console.warn("Process update failed, but receipt was generated");
      }
      
      // Set receipt data for display
      const receiptDisplayData = {
        id: result.id,
        receiptNumber,
        issueDate: formatDate(new Date()),
        expiryDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() + 6))),
        depositorName: "Rajiv Farmer", // This should come from user data
        commodityName: commodity.name,
        quantity: `${commodity.quantity} ${commodity.measurementUnit}`,
        qualityGrade: metrics.gradeAssigned,
        warehouseName: warehouse.name,
        warehouseAddress: warehouse.address,
        valuationAmount: metrics.totalValuation,
        verificationCode
      };
      
      setReceiptData(receiptDisplayData);
      setIsComplete(true);
      
      toast({
        title: "Receipt Generated Successfully",
        description: "Your electronic warehouse receipt has been generated and added to your digital depository.",
      });
      
      // Notify parent component
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Receipt Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async () => {
    if (!receiptData) return;
    
    try {
      await downloadReceiptPDF(receiptData);
      
      toast({
        title: "Receipt Downloaded",
        description: "Your warehouse receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      
      toast({
        title: "Download Failed",
        description: "There was an error downloading the receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Electronic Warehouse Receipt
        </CardTitle>
        <CardDescription>
          Generate an electronic warehouse receipt (eWR) for your commodity
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isComplete ? (
          <>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Commodity Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {commodity.name}
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> {commodity.quantity} {commodity.measurementUnit}
                  </div>
                  <div>
                    <span className="font-medium">Quality Grade:</span> {metrics.gradeAssigned}
                  </div>
                  <div>
                    <span className="font-medium">Valuation:</span> {metrics.totalValuation}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Warehouse Information</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {warehouse.name}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {warehouse.address}, {warehouse.city}, {warehouse.state}, {warehouse.pincode}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Quality Parameters</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Moisture:</span> {metrics.finalQuality.moisture}
                  </div>
                  <div>
                    <span className="font-medium">Foreign Matter:</span> {metrics.finalQuality.foreignMatter}
                  </div>
                  <div>
                    <span className="font-medium">Broken Grains:</span> {metrics.finalQuality.brokenGrains}
                  </div>
                </div>
              </div>
            </div>
            
            <Alert className="mt-4">
              <Package className="h-4 w-4" />
              <AlertTitle>Ready to Generate</AlertTitle>
              <AlertDescription>
                Review the information above and click the button below to generate your electronic warehouse receipt.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <div className="space-y-6">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 dark:text-green-300">Receipt Generated Successfully</AlertTitle>
              <AlertDescription>
                Your electronic warehouse receipt has been generated and added to your digital depository.
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold text-center">Warehouse Receipt</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Receipt Number</p>
                  <p>{receiptData?.receiptNumber}</p>
                </div>
                <div>
                  <p className="font-medium">Date of Issue</p>
                  <p>{receiptData?.issueDate}</p>
                </div>
                <div>
                  <p className="font-medium">Expiry Date</p>
                  <p>{receiptData?.expiryDate}</p>
                </div>
                <div>
                  <p className="font-medium">Depositor</p>
                  <p>{receiptData?.depositorName}</p>
                </div>
                <div>
                  <p className="font-medium">Commodity</p>
                  <p>{receiptData?.commodityName}</p>
                </div>
                <div>
                  <p className="font-medium">Quantity</p>
                  <p>{receiptData?.quantity}</p>
                </div>
                <div>
                  <p className="font-medium">Quality Grade</p>
                  <p>{receiptData?.qualityGrade}</p>
                </div>
                <div>
                  <p className="font-medium">Valuation</p>
                  <p>{receiptData?.valuationAmount}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium">Warehouse</p>
                  <p>{receiptData?.warehouseName}, {receiptData?.warehouseAddress}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center gap-4">
        {!isComplete ? (
          <Button 
            size="lg" 
            onClick={generateReceipt} 
            disabled={isGenerating}
            className="w-full max-w-xs"
          >
            {isGenerating ? "Generating..." : "Generate Receipt"}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="flex gap-2"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}