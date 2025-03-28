import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, Camera, FileUp, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadReceiptDialog({ isOpen, onClose }: UploadReceiptDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadMethod, setUploadMethod] = useState<"file" | "photo" | "manual">("file");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<string>("wdra");
  const [manualInputs, setManualInputs] = useState({
    receiptNumber: "",
    warehouseName: "",
    warehouseLocation: "",
    commodityName: "",
    quantity: "",
    qualityGrade: "",
    issuedDate: "",
    expiryDate: "",
    externalId: "",
    externalSource: ""
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // For file upload
      if (uploadMethod === "file" || uploadMethod === "photo") {
        if (!file) {
          toast({
            title: "Missing File",
            description: uploadMethod === "file" 
              ? "Please select a receipt file to upload" 
              : "Please take or select a photo of the receipt",
            variant: "destructive",
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("sourceType", sourceType);

        const response = await fetch("/api/receipts/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload receipt");
        }

        const result = await response.json();
        
        toast({
          title: "Receipt Uploaded",
          description: "The external warehouse receipt has been successfully processed.",
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
        onClose();
      } 
      // For manual entry
      else if (uploadMethod === "manual") {
        // Validate required fields
        if (!manualInputs.receiptNumber || !manualInputs.warehouseName || 
            !manualInputs.commodityName || !manualInputs.quantity) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields",
            variant: "destructive",
          });
          return;
        }

        const response = await apiRequest("POST", "/api/receipts/manual", {
          ...manualInputs,
          externalSource: sourceType,
          channelType: "orange"
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create external receipt");
        }

        const result = await response.json();
        
        toast({
          title: "Receipt Created",
          description: "The external warehouse receipt has been successfully added.",
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
        onClose();
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process the receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close - reset state
  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadMethod("file");
    setSourceType("wdra");
    setManualInputs({
      receiptNumber: "",
      warehouseName: "",
      warehouseLocation: "",
      commodityName: "",
      quantity: "",
      qualityGrade: "",
      issuedDate: "",
      expiryDate: "",
      externalId: "",
      externalSource: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload External Warehouse Receipt</DialogTitle>
          <DialogDescription>
            Upload receipts from other warehouses to integrate with TradeWiser
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={uploadMethod} 
          onValueChange={(value) => setUploadMethod(value as "file" | "photo" | "manual")}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="photo">Photo Scan</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Label>Receipt Source</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wdra">WDRA Regulated</SelectItem>
                <SelectItem value="cma">CMA Accredited</SelectItem>
                <SelectItem value="fci">FCI Storage</SelectItem>
                <SelectItem value="nafed">NAFED</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
              <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload PDF or image of the warehouse receipt
              </p>
              <Input
                id="receipt-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => document.getElementById("receipt-file")?.click()}
              >
                Select File
              </Button>
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Take a photo or upload an image of the receipt
              </p>
              <Input
                id="receipt-photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex space-x-2 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById("receipt-photo")?.click()}
                >
                  Take Photo
                </Button>
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-40 mx-auto rounded border"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number *</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  value={manualInputs.receiptNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. WH123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalId">External ID</Label>
                <Input
                  id="externalId"
                  name="externalId"
                  value={manualInputs.externalId}
                  onChange={handleInputChange}
                  placeholder="Original receipt ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseName">Warehouse Name *</Label>
                <Input
                  id="warehouseName"
                  name="warehouseName"
                  value={manualInputs.warehouseName}
                  onChange={handleInputChange}
                  placeholder="e.g. Central Storage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseLocation">Location</Label>
                <Input
                  id="warehouseLocation"
                  name="warehouseLocation"
                  value={manualInputs.warehouseLocation}
                  onChange={handleInputChange}
                  placeholder="City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commodityName">Commodity *</Label>
                <Input
                  id="commodityName"
                  name="commodityName"
                  value={manualInputs.commodityName}
                  onChange={handleInputChange}
                  placeholder="e.g. Wheat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (MT) *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={manualInputs.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g. 10.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualityGrade">Quality Grade</Label>
                <Input
                  id="qualityGrade"
                  name="qualityGrade"
                  value={manualInputs.qualityGrade}
                  onChange={handleInputChange}
                  placeholder="e.g. Grade A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuedDate">Issue Date</Label>
                <Input
                  id="issuedDate"
                  name="issuedDate"
                  type="date"
                  value={manualInputs.issuedDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 sm:mt-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMethod === "manual" ? "Create Receipt" : "Upload Receipt"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}