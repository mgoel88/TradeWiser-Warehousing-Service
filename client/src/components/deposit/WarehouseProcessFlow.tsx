import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileCheck, ClipboardList, Scale, Droplets, FileText, Package, Truck, RefreshCw, Download, 
  AlertTriangle, ThumbsUp, Clipboard, CheckCircle2, Printer, Clock, Ban
} from "lucide-react";
import { downloadReceiptPDF } from "@/lib/receiptGenerator";

import { Process, Commodity, Warehouse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from '@/lib/utils';

interface WarehouseProcessFlowProps {
  process: Process;
  commodity: Commodity;
  warehouse: Warehouse;
  onComplete: () => void;
}

// Define the quality parameter interface
interface QualityParameters {
  moisture: string;
  foreignMatter: string;
  brokenGrains: string;
  [key: string]: string;
}

// Define the process metrics interface that gets updated at each stage
interface ProcessMetrics {
  initialWeight: string;
  cleanedWeight: string;
  weightLoss: string;
  initialQuality: QualityParameters;
  finalQuality: QualityParameters;
  gradeAssigned: string;
  packagingType: string;
  bagCount: string;
  valuationPerUnit: string;
  totalValuation: string;
}

// Define the receipt data interface
interface ReceiptData {
  receiptNumber: string;
  issueDate: string;
  expiryDate: string;
  depositorName: string;
  commodityName: string;
  quantity: string;
  qualityGrade: string;
  warehouseName: string;
  warehouseAddress: string;
  valuationAmount: string;
}

export default function WarehouseProcessFlow({ process, commodity, warehouse, onComplete }: WarehouseProcessFlowProps) {
  const { toast } = useToast();
  
  // Generate a unique verification code for receipts
  const generateVerificationCode = (processId: number) => {
    const timestamp = Date.now().toString(16).toUpperCase();
    const randomStr = Math.random().toString(16).substring(2, 6).toUpperCase();
    return `WR-${processId}-${timestamp}-${randomStr}`;
  };
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<ProcessMetrics>({
    initialWeight: "0.00",
    cleanedWeight: "0.00",
    weightLoss: "0.00",
    initialQuality: {
      moisture: "0.0%",
      foreignMatter: "0.0%",
      brokenGrains: "0.0%"
    },
    finalQuality: {
      moisture: "0.0%",
      foreignMatter: "0.0%",
      brokenGrains: "0.0%"
    },
    gradeAssigned: "Pending",
    packagingType: "Standard Jute Bags",
    bagCount: "0",
    valuationPerUnit: "₹0.00",
    totalValuation: "₹0.00"
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<"grievance" | "feedback">("feedback");
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processingStage, setProcessingStage] = useState<string>(process.currentStage || "arrived_at_warehouse");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showReprocessRequest, setShowReprocessRequest] = useState(false);

  // Process stages and their details
  const processStages = [
    { 
      id: "arrived_at_warehouse", 
      label: "Arrival & Weighing", 
      description: "Initial weight measurement and check-in",
      icon: <Truck className="h-5 w-5" />,
      progress: 20,
      updateType: "weight"
    },
    { 
      id: "pre_cleaning", 
      label: "Pre-Cleaning", 
      description: "Removal of foreign matter and impurities",
      icon: <RefreshCw className="h-5 w-5" />,
      progress: 40,
      updateType: "cleaning"
    },
    { 
      id: "quality_assessment", 
      label: "Quality Assessment", 
      description: "Detailed quality analysis and grading",
      icon: <ClipboardList className="h-5 w-5" />,
      progress: 60,
      updateType: "quality"
    },
    { 
      id: "packaging", 
      label: "Packaging", 
      description: "Bagging and preparation for storage",
      icon: <Package className="h-5 w-5" />,
      progress: 80,
      updateType: "packaging"
    },
    { 
      id: "ewr_generation", 
      label: "Receipt Generation", 
      description: "Electronic Warehouse Receipt issuance",
      icon: <FileText className="h-5 w-5" />,
      progress: 100,
      updateType: "receipt"
    }
  ];

  // Mock metrics updates based on process stage (would normally come from backend)
  useEffect(() => {
    // Simulate updates to metrics based on current process stage
    if (processingStage === "arrived_at_warehouse" || processingStage === "pre_cleaning") {
      setMetrics(prev => ({
        ...prev,
        initialWeight: commodity.quantity.toString(),
        initialQuality: {
          moisture: "14.2%",
          foreignMatter: "2.1%",
          brokenGrains: "3.5%"
        },
      }));
    }

    if (processingStage === "pre_cleaning" || processingStage === "quality_assessment") {
      setMetrics(prev => {
        const initialWeight = parseFloat(commodity.quantity.toString());
        const cleanedWeight = (initialWeight * 0.97).toFixed(2); // 3% loss
        return {
          ...prev,
          cleanedWeight,
          weightLoss: (initialWeight - parseFloat(cleanedWeight)).toFixed(2),
          finalQuality: {
            moisture: "12.5%",
            foreignMatter: "0.8%",
            brokenGrains: "2.1%"
          }
        };
      });
    }

    if (processingStage === "quality_assessment" || processingStage === "packaging" || processingStage === "ewr_generation") {
      setMetrics(prev => {
        const cleanedWeight = parseFloat(prev.cleanedWeight);
        const basePrice = commodity.type === "Grain" ? 2100 : 
                          commodity.type === "Pulses" ? 6500 : 
                          commodity.type === "Oilseeds" ? 5500 : 3800;
        
        return {
          ...prev,
          gradeAssigned: "Grade A",
          valuationPerUnit: `₹${basePrice.toLocaleString('en-IN')}`,
          totalValuation: `₹${(cleanedWeight * basePrice).toLocaleString('en-IN')}`
        };
      });
    }

    if (processingStage === "packaging" || processingStage === "ewr_generation") {
      setMetrics(prev => {
        const cleanedWeight = parseFloat(prev.cleanedWeight);
        const bagSize = 50; // 50 kg per bag
        const bagCount = Math.ceil((cleanedWeight * 1000) / bagSize); // convert MT to kg
        
        return {
          ...prev,
          packagingType: "Premium Jute Bags",
          bagCount: bagCount.toString()
        };
      });
    }

    if (processingStage === "ewr_generation" && 
        process.stageProgress && 
        typeof process.stageProgress === 'object' && 
        'ewr_generation' in process.stageProgress && 
        process.stageProgress.ewr_generation === "completed" && 
        !receiptGenerated) {
      // Create receipt data for display only if receipt is already generated in the database
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months validity
      
      const receiptNumber = `WR${String(Date.now()).substring(7)}-${process.id}`;
      
      setReceiptData({
        receiptNumber,
        issueDate: formatDate(currentDate),
        expiryDate: formatDate(expiryDate),
        depositorName: "Rajiv Farmer", // This should come from user data
        commodityName: commodity.name,
        quantity: metrics.cleanedWeight + " " + commodity.measurementUnit,
        qualityGrade: metrics.gradeAssigned,
        warehouseName: warehouse.name,
        warehouseAddress: `${warehouse.address}, ${warehouse.city}, ${warehouse.state} - ${warehouse.pincode}`,
        valuationAmount: metrics.totalValuation
      });
      
      // Only set receipt as generated if it's completed in the process data
      setReceiptGenerated(true);
    }
  }, [processingStage, commodity, warehouse, process.id]);

  // Watch for process updates from the parent component
  useEffect(() => {
    if (process.currentStage) {
      setProcessingStage(process.currentStage);
      
      // Check if the eWR is already generated and completed in the database
      if (process.currentStage === "ewr_generation" && 
          process.stageProgress && 
          typeof process.stageProgress === 'object' && 
          'ewr_generation' in process.stageProgress && 
          process.stageProgress.ewr_generation === "completed") {
        setReceiptGenerated(true);
      }
    }
  }, [process.currentStage, process.stageProgress]);

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Empty feedback",
        description: "Please enter your feedback before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSendingFeedback(true);

    try {
      // API call to submit feedback
      const response = await apiRequest(
        "POST",
        "/api/processes/feedback",
        {
          processId: process.id,
          feedbackType,
          feedbackText,
          stage: processingStage
        }
      );

      if (response.ok) {
        toast({
          title: feedbackType === "feedback" ? "Feedback Submitted" : "Grievance Reported",
          description: "Thank you for your input. Our team will review it promptly.",
        });
        setFeedbackOpen(false);
        setFeedbackText("");
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Handle request for reprocessing
  const handleReprocessRequest = async () => {
    try {
      // API call to request reprocessing
      const response = await apiRequest(
        "POST",
        `/api/processes/${process.id}/reprocess`,
        {
          stage: processingStage,
          reason: feedbackText
        }
      );

      if (response.ok) {
        toast({
          title: "Reprocessing Requested",
          description: "Your request has been sent to the warehouse manager for review.",
        });
        setShowReprocessRequest(false);
        setFeedbackText("");
      } else {
        throw new Error("Failed to request reprocessing");
      }
    } catch (error) {
      console.error("Error requesting reprocessing:", error);
      toast({
        title: "Request Failed",
        description: "Unable to submit your reprocessing request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle user confirmation of process
  const handleConfirmProcess = async () => {
    try {
      setUserConfirmed(true);
      
      // Create receipt number
      const receiptNumber = `WR${String(Date.now()).substring(7)}-${process.id}`;
      
      // Calculate expiry date (6 months from now)
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      // Generate a verification code for QR codes and public verification
      const verificationCode = generateVerificationCode(process.id);
      
      // Create valuation values for the receipt
      const valuationAmount = parseFloat(metrics.totalValuation.replace(/[^0-9.]/g, ''));
      
      // Create a complete receipt payload that matches the server-side schema
      // Note: receiptType is deliberately omitted as it doesn't exist in the database
      const receiptPayload = {
        // Required string fields
        receiptNumber,
        // Convert quantitative values to strings as required by the schema
        quantity: commodity.quantity.toString(),
        // Required fields per schema 
        depositorKycId: "KYC" + process.userId + Date.now().toString(16).slice(-6),
        warehouseLicenseNo: `WL-${warehouse.id}-${new Date().getFullYear()}`,
        // References to other entities
        commodityId: commodity.id,
        warehouseId: warehouse.id,
        // Status as defined in the enum
        status: "active",
        // Simple blockchain hash with no special characters 
        blockchainHash: Math.random().toString(16).substring(2) + Date.now().toString(16),
        // Additional data
        expiryDate: expiryDate.toISOString(),
        valuation: valuationAmount.toString(),
        commodityName: commodity.name,
        qualityGrade: metrics.gradeAssigned,
        qualityParameters: {
          moisture: metrics.finalQuality.moisture,
          foreignMatter: metrics.finalQuality.foreignMatter,
          brokenGrains: metrics.finalQuality.brokenGrains
        },
        // Add verification code as metadata - should be a JSON object, not a string
        metadata: { 
          verificationCode: verificationCode,
          process: process.id
        }
      };
      
      // Call API to create warehouse receipt
      const receiptResponse = await apiRequest('POST', '/api/receipts', receiptPayload);
      
      if (!receiptResponse.ok) {
        throw new Error('Failed to generate warehouse receipt');
      }
      
      const receiptResult = await receiptResponse.json();
      
      // Then update the process to mark receipt as generated
      const processResponse = await apiRequest(
        "PATCH",
        `/api/processes/${process.id}`,
        { 
          status: "completed",
          currentStage: "ewr_generation",
          stageProgress: {
            arrived_at_warehouse: "completed",
            pre_cleaning: "completed",
            quality_assessment: "completed",
            packaging: "completed",
            ewr_generation: "completed"
          },
          completedTime: new Date().toISOString(),
          updateType: "receipt"
        }
      );

      if (!processResponse.ok) {
        throw new Error('Failed to update process status');
      }
      
      // Set receipt data for display
      const newReceiptData = {
        receiptNumber,
        issueDate: formatDate(new Date()),
        expiryDate: formatDate(expiryDate),
        depositorName: "Rajiv Farmer", // This should come from user data
        commodityName: commodity.name,
        quantity: `${commodity.quantity} ${commodity.measurementUnit}`,
        qualityGrade: metrics.gradeAssigned,
        warehouseName: warehouse.name,
        warehouseAddress: warehouse.address,
        valuationAmount: metrics.totalValuation
      };
      
      setReceiptData(newReceiptData);
      setReceiptGenerated(true);
      
      toast({
        title: "Receipt Generated",
        description: "Your electronic warehouse receipt has been generated successfully.",
      });
      
      // Call the onComplete callback to refresh parent component
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error confirming process:", error);
      setUserConfirmed(false);
      toast({
        title: "Receipt Generation Failed",
        description: "Unable to generate the warehouse receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = async () => {
    if (!receiptData) return;
    
    try {
      // Use the verification code we generated earlier for the PDF
      const verificationCode = generateVerificationCode(process.id);
      
      // Generate and download the receipt PDF
      await downloadReceiptPDF({
        ...receiptData,
        verificationCode: verificationCode
      });
      
      toast({
        title: "Receipt Downloaded",
        description: `Warehouse Receipt ${receiptData.receiptNumber} has been downloaded successfully.`,
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

  // Get current stage index
  const getCurrentStageIndex = () => {
    const index = processStages.findIndex(stage => stage.id === processingStage);
    return index >= 0 ? index : 0;
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const stageIndex = getCurrentStageIndex();
    const stage = processStages[stageIndex];
    return stage ? stage.progress : 0;
  };

  // Determine if a stage is completed
  const isStageCompleted = (stageId: string) => {
    const stageIndex = processStages.findIndex(stage => stage.id === stageId);
    const currentIndex = getCurrentStageIndex();
    return stageIndex < currentIndex;
  };

  // Determine if a stage is current
  const isCurrentStage = (stageId: string) => {
    return stageId === processingStage;
  };

  // Render metrics based on stage
  const renderMetrics = () => {
    switch (processingStage) {
      case "arrived_at_warehouse":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Initial Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Initial Weight"
                value={metrics.initialWeight + " " + commodity.measurementUnit}
                description="Raw weight at arrival"
              />
              <MetricCard 
                icon={<Droplets className="h-5 w-5" />}
                title="Initial Moisture"
                value={metrics.initialQuality.moisture}
                description="Moisture content at arrival"
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Initial Assessment</AlertTitle>
              <AlertDescription>
                The commodity has been weighed and preliminary quality checks performed. Pre-cleaning will begin shortly.
              </AlertDescription>
            </Alert>
          </div>
        );
        
      case "pre_cleaning":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pre-Cleaning Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Initial Weight"
                value={metrics.initialWeight + " " + commodity.measurementUnit}
                description="Raw weight at arrival"
              />
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Cleaned Weight"
                value={metrics.cleanedWeight + " " + commodity.measurementUnit}
                description="Weight after cleaning"
              />
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Weight Loss"
                value={metrics.weightLoss + " " + commodity.measurementUnit}
                description="Removed foreign matter"
                highlight={true}
              />
            </div>
            
            <h3 className="text-lg font-medium mt-6">Quality Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QualityComparisonCard 
                parameter="Moisture"
                initialValue={metrics.initialQuality.moisture}
                finalValue={metrics.finalQuality.moisture}
                improvement={(parseFloat(metrics.initialQuality.moisture) - parseFloat(metrics.finalQuality.moisture)).toFixed(1) + "%"}
              />
              <QualityComparisonCard 
                parameter="Foreign Matter"
                initialValue={metrics.initialQuality.foreignMatter}
                finalValue={metrics.finalQuality.foreignMatter}
                improvement={(parseFloat(metrics.initialQuality.foreignMatter) - parseFloat(metrics.finalQuality.foreignMatter)).toFixed(1) + "%"}
              />
              <QualityComparisonCard 
                parameter="Broken Grains"
                initialValue={metrics.initialQuality.brokenGrains}
                finalValue={metrics.finalQuality.brokenGrains}
                improvement={(parseFloat(metrics.initialQuality.brokenGrains) - parseFloat(metrics.finalQuality.brokenGrains)).toFixed(1) + "%"}
              />
            </div>
            
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertTitle>Pre-Cleaning Completed</AlertTitle>
              <AlertDescription>
                The commodity has been cleaned to remove foreign matter and impurities. Quality assessment will begin next.
              </AlertDescription>
            </Alert>
          </div>
        );
        
      case "quality_assessment":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quality Assessment Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                icon={<FileCheck className="h-5 w-5" />}
                title="Quality Grade"
                value={metrics.gradeAssigned}
                description="Based on industry standards"
                highlight={true}
              />
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Final Weight"
                value={metrics.cleanedWeight + " " + commodity.measurementUnit}
                description="After cleaning and processing"
              />
            </div>
            
            <h3 className="text-lg font-medium mt-6">Detailed Quality Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QualityParameterCard parameter="Moisture" value={metrics.finalQuality.moisture} standard="Max 13.0%" />
              <QualityParameterCard parameter="Foreign Matter" value={metrics.finalQuality.foreignMatter} standard="Max 1.0%" />
              <QualityParameterCard parameter="Broken Grains" value={metrics.finalQuality.brokenGrains} standard="Max 3.0%" />
            </div>
            
            <h3 className="text-lg font-medium mt-6">Valuation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                icon={<FileText className="h-5 w-5" />}
                title="Rate Per MT"
                value={metrics.valuationPerUnit}
                description="Based on quality grade and market rates"
              />
              <MetricCard 
                icon={<FileText className="h-5 w-5" />}
                title="Total Valuation"
                value={metrics.totalValuation}
                description="For the entire lot"
                highlight={true}
              />
            </div>
          </div>
        );
        
      case "packaging":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Packaging Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                icon={<Package className="h-5 w-5" />}
                title="Packaging Type"
                value={metrics.packagingType}
                description="Industry standard packaging"
              />
              <MetricCard 
                icon={<Package className="h-5 w-5" />}
                title="Number of Bags"
                value={metrics.bagCount}
                description="50 kg per bag"
              />
              <MetricCard 
                icon={<Scale className="h-5 w-5" />}
                title="Total Weight"
                value={metrics.cleanedWeight + " " + commodity.measurementUnit}
                description="Final packaged weight"
              />
            </div>
            
            <h3 className="text-lg font-medium mt-6">Valuation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                icon={<FileCheck className="h-5 w-5" />}
                title="Quality Grade"
                value={metrics.gradeAssigned}
                description="Based on industry standards"
              />
              <MetricCard 
                icon={<FileText className="h-5 w-5" />}
                title="Total Valuation"
                value={metrics.totalValuation}
                description="For the entire lot"
                highlight={true}
              />
            </div>
            
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>Packaging Complete</AlertTitle>
              <AlertDescription>
                Your commodity has been packaged and is ready for storage. An electronic warehouse receipt will be generated once you confirm the process.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleConfirmProcess} 
                className="w-full max-w-md"
                disabled={userConfirmed}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {userConfirmed ? "Process Confirmed" : "Confirm Processing & Generate Receipt"}
              </Button>
            </div>
          </div>
        );
        
      case "ewr_generation":
        return (
          <div className="space-y-6">
            {!receiptGenerated ? (
              <>
                <Alert>
                  <FileCheck className="h-4 w-4" />
                  <AlertTitle>Ready to Generate eWR</AlertTitle>
                  <AlertDescription>
                    All quality, packaging, and valuation parameters have been finalized. 
                    Review the details above and click the button below to accept these parameters and 
                    generate your electronic Warehouse Receipt (eWR).
                  </AlertDescription>
                </Alert>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium mb-2">Parameters Summary</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Quality Grade</p>
                      <p className="text-sm">{metrics.gradeAssigned}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Final Quantity</p>
                      <p className="text-sm">{metrics.cleanedWeight} {commodity.measurementUnit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Packaging</p>
                      <p className="text-sm">{metrics.packagingType}, {metrics.bagCount} bags</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Valuation</p>
                      <p className="text-sm text-primary font-medium">{metrics.totalValuation}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By generating this receipt, you confirm that these parameters are accurate and acceptable.
                  </p>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={handleConfirmProcess}
                    className="w-full max-w-md py-6 text-lg"
                    disabled={userConfirmed}
                    size="lg"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {userConfirmed ? "Generating Receipt..." : "Accept Parameters & Generate eWR"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Receipt Generated Successfully</AlertTitle>
                  <AlertDescription>
                    Your electronic Warehouse Receipt (eWR) has been generated. You can download it or view it in the Receipts section.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Receipt Number</div>
                      <div className="font-medium">{receiptData?.receiptNumber}</div>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Valuation</div>
                      <div className="font-medium">{receiptData?.valuationAmount}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleDownloadReceipt}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                    <Button onClick={() => window.location.href = '/receipts'}>
                      <FileText className="h-4 w-4 mr-2" />
                      View in Receipts
                    </Button>
                  </div>
                </div>
                
                {receiptData && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Electronic Warehouse Receipt</CardTitle>
                          <CardDescription>
                            Receipt Number: {receiptData.receiptNumber}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Issue Date</p>
                            <p className="text-sm text-muted-foreground">{receiptData.issueDate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Expiry Date</p>
                            <p className="text-sm text-muted-foreground">{receiptData.expiryDate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Depositor</p>
                            <p className="text-sm text-muted-foreground">{receiptData.depositorName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Warehouse</p>
                            <p className="text-sm text-muted-foreground">{receiptData.warehouseName}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Commodity</p>
                            <p className="text-sm text-muted-foreground">{receiptData.commodityName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Quantity</p>
                            <p className="text-sm text-muted-foreground">{receiptData.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Quality Grade</p>
                            <p className="text-sm text-muted-foreground">{receiptData.qualityGrade}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Valuation</p>
                            <p className="text-sm font-medium text-primary">{receiptData.valuationAmount}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <p className="text-sm font-medium">Storage Location</p>
                          <p className="text-sm text-muted-foreground">{receiptData.warehouseAddress}</p>
                        </div>
                        
                        <div className="bg-background rounded-md p-3 mt-4 border">
                          <div className="flex items-center">
                            <Clipboard className="h-4 w-4 mr-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Receipt Verification</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            This eWR is secured by blockchain technology and can be verified using the following code:
                          </p>
                          <div className="bg-muted p-2 rounded mt-1 text-center font-mono text-xs">
                            WR-{process.id}-{Math.floor(Date.now()/1000).toString(16).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-center mt-4 space-x-4">
                  <Button onClick={onComplete}>
                    View All Receipts
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("funding")}>
                    Apply for Financing
                  </Button>
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Process header and progress */}
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Warehouse Processing</h2>
            <p className="text-muted-foreground">
              Tracking the processing of your {commodity.name} at {warehouse.name}
            </p>
          </div>
          <div>
            <Badge variant={process.status === "completed" ? "default" : "outline"}>
              {process.status === "completed" ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>
        
        <Progress value={calculateProgress()} className="h-2 mb-2" />
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
          {processStages.map((stage) => (
            <div key={stage.id} className="relative">
              <div className={`flex flex-col items-center ${isStageCompleted(stage.id) ? 'text-primary' : isCurrentStage(stage.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  isStageCompleted(stage.id) 
                    ? 'bg-primary text-primary-foreground' 
                    : isCurrentStage(stage.id)
                    ? 'bg-primary/20 text-primary border-2 border-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stage.icon}
                </div>
                <span className="text-xs font-medium text-center">{stage.label}</span>
                {isCurrentStage(stage.id) && (
                  <span className="text-xs mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full">In Progress</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="details" className="flex-1">Process Details</TabsTrigger>
          <TabsTrigger value="funding" className="flex-1">Funding Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {renderMetrics()}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setFeedbackType("feedback");
                  setFeedbackOpen(true);
                }}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Provide Feedback
              </Button>
              
              <Button 
                variant="outline"
                className="text-amber-600 border-amber-200 hover:text-amber-700"
                onClick={() => {
                  setFeedbackType("grievance");
                  setShowReprocessRequest(true);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue / Request Reprocessing
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Processing Information</CardTitle>
              <CardDescription>
                Comprehensive details about each processing step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-8">
                  {processStages.map((stage, index) => {
                    const isCompleted = isStageCompleted(stage.id);
                    const isCurrent = isCurrentStage(stage.id);
                    
                    return (
                      <div key={stage.id} className="relative">
                        {/* Connector line */}
                        {index < processStages.length - 1 && (
                          <div className="absolute top-10 bottom-0 left-5 w-0.5 bg-muted" />
                        )}
                        
                        <div className="relative flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                            isCompleted 
                              ? 'bg-primary text-primary-foreground' 
                              : isCurrent
                              ? 'bg-primary/20 text-primary border-2 border-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {stage.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium">{stage.label}</h3>
                              {isCompleted && <Badge className="ml-2 bg-green-500">Completed</Badge>}
                              {isCurrent && <Badge className="ml-2" variant="outline">In Progress</Badge>}
                            </div>
                            
                            <p className="text-muted-foreground">{stage.description}</p>
                            
                            {(isCompleted || isCurrent) && (
                              <div className="mt-2 space-y-3">
                                {stage.id === "arrived_at_warehouse" && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <p className="text-sm font-medium">Initial Weight</p>
                                    <p className="text-sm">{metrics.initialWeight} {commodity.measurementUnit}</p>
                                    
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      <div>
                                        <p className="text-xs font-medium">Moisture</p>
                                        <p className="text-xs text-muted-foreground">{metrics.initialQuality.moisture}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium">Foreign Matter</p>
                                        <p className="text-xs text-muted-foreground">{metrics.initialQuality.foreignMatter}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium">Broken Grains</p>
                                        <p className="text-xs text-muted-foreground">{metrics.initialQuality.brokenGrains}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {stage.id === "pre_cleaning" && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Initial Weight</p>
                                        <p className="text-sm">{metrics.initialWeight} {commodity.measurementUnit}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Final Weight</p>
                                        <p className="text-sm">{metrics.cleanedWeight} {commodity.measurementUnit}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                      <p className="text-sm font-medium">Weight Loss</p>
                                      <p className="text-sm text-amber-600">{metrics.weightLoss} {commodity.measurementUnit} ({((parseFloat(metrics.weightLoss) / parseFloat(metrics.initialWeight)) * 100).toFixed(1)}%)</p>
                                    </div>
                                  </div>
                                )}
                                
                                {stage.id === "quality_assessment" && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <p className="text-sm font-medium">Quality Grade Assigned</p>
                                    <p className="text-sm">{metrics.gradeAssigned}</p>
                                    
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      <div>
                                        <p className="text-xs font-medium">Moisture</p>
                                        <p className="text-xs text-muted-foreground">{metrics.finalQuality.moisture}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium">Foreign Matter</p>
                                        <p className="text-xs text-muted-foreground">{metrics.finalQuality.foreignMatter}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium">Broken Grains</p>
                                        <p className="text-xs text-muted-foreground">{metrics.finalQuality.brokenGrains}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                      <p className="text-sm font-medium">Valuation</p>
                                      <p className="text-sm text-green-600">{metrics.totalValuation}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {stage.id === "packaging" && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-sm font-medium">Packaging Type</p>
                                        <p className="text-sm">{metrics.packagingType}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Number of Bags</p>
                                        <p className="text-sm">{metrics.bagCount} bags (50 kg each)</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {stage.id === "ewr_generation" && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="text-sm font-medium">Receipt Number</p>
                                        <p className="text-sm">{receiptData?.receiptNumber || 'Pending'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Issue Date</p>
                                        <p className="text-sm">{receiptData?.issueDate || 'Pending'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Timestamp */}
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {isCompleted ? 'Completed on ' : 'Started on '}
                                    {formatDate(new Date())}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="funding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Receipt Financing</CardTitle>
              <CardDescription>
                Leverage your warehouse receipt to get financing at competitive rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receiptGenerated ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="font-medium text-green-800 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      You are eligible for financing
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Based on your warehouse receipt, you can avail financing up to {metrics.totalValuation.replace('₹', '₹ ')}
                    </p>
                  </div>
                  
                  <div className="grid gap-4 mt-6">
                    <h3 className="font-medium">Available Financing Options</h3>
                    
                    <Card className="bg-background">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Agri Bank</h4>
                            <p className="text-sm text-muted-foreground">
                              Up to 80% of valuation
                            </p>
                          </div>
                          <Badge>10.5% p.a.</Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Available Amount</p>
                            <p className="text-muted-foreground">₹ {(parseFloat(metrics.totalValuation.replace(/[^\d.]/g, '')) * 0.8).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="font-medium">Tenure</p>
                            <p className="text-muted-foreground">Up to 6 months</p>
                          </div>
                        </div>
                        <Button className="w-full mt-3">Apply Now</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Rural Finance Ltd</h4>
                            <p className="text-sm text-muted-foreground">
                              Up to 70% of valuation
                            </p>
                          </div>
                          <Badge>9.75% p.a.</Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Available Amount</p>
                            <p className="text-muted-foreground">₹ {(parseFloat(metrics.totalValuation.replace(/[^\d.]/g, '')) * 0.7).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="font-medium">Tenure</p>
                            <p className="text-muted-foreground">Up to 4 months</p>
                          </div>
                        </div>
                        <Button className="w-full mt-3">Apply Now</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Ban className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Receipt Not Generated Yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Once your warehouse receipt is generated, you'll be able to explore financing options based on your commodity valuation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Share your feedback on the warehouse processing experience. We value your input to improve our services.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Current Process Stage</h4>
              <Badge variant="outline">
                {processStages.find(stage => stage.id === processingStage)?.label || processingStage}
              </Badge>
            </div>
            
            <Textarea
              placeholder="Enter your feedback here..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button onClick={handleFeedbackSubmit} disabled={isSendingFeedback}>
              {isSendingFeedback ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Submitting...
                </>
              ) : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reprocess Request Dialog */}
      <Dialog open={showReprocessRequest} onOpenChange={setShowReprocessRequest}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Reprocessing</DialogTitle>
            <DialogDescription>
              If you're not satisfied with the processing results, you can request the warehouse to repeat a specific process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Current Process Stage</h4>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {processStages.find(stage => stage.id === processingStage)?.label || processingStage}
              </Badge>
            </div>
            
            <Textarea
              placeholder="Please explain why you want this stage to be reprocessed..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReprocessRequest(false)}>Cancel</Button>
            <Button 
              variant="default" 
              className="bg-amber-600 hover:bg-amber-700" 
              onClick={handleReprocessRequest}
            >
              Request Reprocessing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for metrics display
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}

function MetricCard({ icon, title, value, description, highlight = false }: MetricCardProps) {
  return (
    <Card className={highlight ? "bg-primary/5 border-primary/20" : "bg-muted"}>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className={`p-1.5 rounded-full ${highlight ? "bg-primary/10" : "bg-background"} mr-2`}>
            {icon}
          </div>
          <h4 className="font-medium">{title}</h4>
        </div>
        <p className={`text-lg font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Helper component for quality comparison display
interface QualityComparisonCardProps {
  parameter: string;
  initialValue: string;
  finalValue: string;
  improvement: string;
}

function QualityComparisonCard({ parameter, initialValue, finalValue, improvement }: QualityComparisonCardProps) {
  return (
    <Card className="bg-muted">
      <CardContent className="p-4">
        <h4 className="font-medium mb-2">{parameter}</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Initial</p>
            <p>{initialValue}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">After Cleaning</p>
            <p className="text-green-600">{finalValue}</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Improvement</p>
          <p className="text-green-600 font-medium">{improvement}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for quality parameter display
interface QualityParameterCardProps {
  parameter: string;
  value: string;
  standard: string;
}

function QualityParameterCard({ parameter, value, standard }: QualityParameterCardProps) {
  // Determine if the parameter meets the standard
  const isWithinStandard = () => {
    const numValue = parseFloat(value);
    const numStandard = parseFloat(standard.replace(/[^\d.]/g, ''));
    
    if (standard.includes('Max')) {
      return numValue <= numStandard;
    } else if (standard.includes('Min')) {
      return numValue >= numStandard;
    }
    
    return true;
  };
  
  const meetsStandard = isWithinStandard();
  
  return (
    <Card className={meetsStandard ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
      <CardContent className="p-4">
        <h4 className="font-medium mb-2">{parameter}</h4>
        <p className={`text-lg font-semibold ${meetsStandard ? "text-green-600" : "text-amber-600"}`}>{value}</p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">Standard: {standard}</p>
          <Badge variant="outline" className={meetsStandard ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
            {meetsStandard ? "Meets Standard" : "Outside Range"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}