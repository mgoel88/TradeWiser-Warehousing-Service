import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, AlertCircle, CircleX, Loader2, FileText, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema for the form
const receiptFormSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required'),
  commodityName: z.string().min(1, 'Commodity name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  measurementUnit: z.string().default('MT'),
  qualityGrade: z.string().optional(),
  warehouseName: z.string().min(1, 'Warehouse name is required'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
  externalSource: z.string().min(1, 'Source is required'),
  valuation: z.string().optional()
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

type Stage = 'uploading' | 'processing' | 'extracting' | 'form' | 'error' | 'success';

interface DocumentProcessingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadData?: {
    file: File;
    fileName: string;
    fileType: string;
    fileUrl?: string;
  };
  channelType: 'orange' | 'red';
}

export function DocumentProcessingDialog({ isOpen, onClose, uploadData, channelType }: DocumentProcessingDialogProps) {
  const [stage, setStage] = useState<Stage>('uploading');
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  // Form handling
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNumber: '',
      commodityName: '',
      quantity: '',
      measurementUnit: 'MT',
      qualityGrade: '',
      warehouseName: '',
      warehouseLocation: '',
      externalSource: channelType === 'orange' ? 'wdra' : '',
      valuation: ''
    }
  });

  // Simulate the document processing pipeline
  useEffect(() => {
    if (isOpen && uploadData) {
      // Reset state
      setStage('uploading');
      setProgress(0);
      setExtractedText('');
      setErrorMessage('');

      // Simulate file upload (would normally happen via API)
      const uploadTimer = setTimeout(() => {
        setStage('processing');
        setProgress(25);
        
        // Simulate document processing
        const processingTimer = setTimeout(() => {
          setStage('extracting');
          setProgress(50);
          
          // Simulate text extraction
          const extractionTimer = setTimeout(() => {
            setProgress(75);
            
            // In a real implementation, the text would be extracted from the file
            // Here we're simulating that the text extraction was successful
            if (channelType === 'orange') {
              try {
                // Mock extraction results based on document type
                const mockExtractedData = {
                  receiptNumber: `EXT-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                  commodityName: 'wheat',
                  quantity: '100',
                  measurementUnit: 'MT',
                  qualityGrade: 'Standard',
                  warehouseName: `${form.getValues().externalSource || 'External'} Warehouse`,
                  warehouseLocation: 'External Location',
                  externalSource: form.getValues().externalSource || 'wdra',
                  valuation: '50000'
                };
                
                // Update form with extracted data
                Object.entries(mockExtractedData).forEach(([key, value]) => {
                  form.setValue(key as keyof ReceiptFormValues, value);
                });
                
                // Show extracted text
                setExtractedText(`Receipt: ${mockExtractedData.receiptNumber}
Commodity: ${mockExtractedData.commodityName}
Quantity: ${mockExtractedData.quantity} ${mockExtractedData.measurementUnit}
Quality: ${mockExtractedData.qualityGrade}
Warehouse: ${mockExtractedData.warehouseName}
Location: ${mockExtractedData.warehouseLocation}
Source: ${mockExtractedData.externalSource}
Value: ₹${mockExtractedData.valuation}`);
                
                // Update form stage
                setStage('form');
                setProgress(90);
              } catch (error) {
                console.error("Error extracting data:", error);
                setStage('error');
                setErrorMessage("Failed to extract data from the document. Please input the information manually.");
              }
            } else {
              // For red channel, skip extraction and go directly to form
              setStage('form');
              setProgress(90);
            }
          }, 2000);
          
          return () => clearTimeout(extractionTimer);
        }, 2000);
        
        return () => clearTimeout(processingTimer);
      }, 1500);
      
      return () => clearTimeout(uploadTimer);
    }
  }, [isOpen, uploadData, channelType, form]);

  // Handle form submission
  const onSubmit = async (values: ReceiptFormValues) => {
    try {
      setProgress(95);
      
      // Create receipt data with channel type
      const receiptData = {
        ...values,
        channelType: channelType
      };
      
      // Submit to API
      const response = await apiRequest('POST', '/api/receipts/manual', receiptData);
      
      if (response.ok) {
        setStage('success');
        setProgress(100);
        toast({
          title: 'Receipt Created',
          description: `${channelType === 'orange' ? 'External' : 'Self-certified'} receipt successfully created`,
        });
        
        // Close dialog after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create receipt');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStage('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Render stage-specific content
  const renderStageContent = () => {
    switch (stage) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary-600 mb-4" />
            <h3 className="text-lg font-medium">Uploading Document</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Uploading your {uploadData?.fileType.split('/')[1]} file...
            </p>
            <div className="w-full mt-6 bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary-600 mb-4" />
            <h3 className="text-lg font-medium">Processing Document</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Preparing your document for information extraction...
            </p>
            <div className="w-full mt-6 bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        );
        
      case 'extracting':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary-600 mb-4" />
            <h3 className="text-lg font-medium">Extracting Information</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Using OCR to extract receipt details...
            </p>
            <div className="w-full mt-6 bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        );
        
      case 'form':
        return (
          <div className="py-4">
            <div className="flex items-center mb-4">
              {channelType === 'orange' && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Information Extracted</h3>
                    <p className="text-xs text-muted-foreground">
                      Review and edit the extracted information below
                    </p>
                  </div>
                </>
              )}
              {channelType === 'red' && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 mr-3">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Self-Certification</h3>
                    <p className="text-xs text-muted-foreground">
                      Please fill in the receipt details
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {channelType === 'orange' && extractedText && (
              <div className="mb-6 p-3 bg-gray-50 rounded-md border text-xs font-mono">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Extracted Information:</div>
                <pre className="whitespace-pre-wrap overflow-auto max-h-[100px]">{extractedText}</pre>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Number*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="EXT-12345-6789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="externalSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {channelType === 'orange' ? (
                              <>
                                <SelectItem value="wdra">WDRA</SelectItem>
                                <SelectItem value="cma">CMA</SelectItem>
                                <SelectItem value="fci">FCI</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="self-certified">Self-Certified</SelectItem>
                                <SelectItem value="private">Private Storage</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commodityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Wheat, Rice, Cotton" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity*</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" placeholder="e.g. 100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="measurementUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                              <SelectItem value="KG">Kilograms (KG)</SelectItem>
                              <SelectItem value="Quintals">Quintals</SelectItem>
                              <SelectItem value="Bales">Bales</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="qualityGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Grade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Grade A, Premium" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="warehouseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={channelType === 'orange' ? "e.g. WDRA Warehouse" : "e.g. Self Storage"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warehouseLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Location*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Delhi, Private Farm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="e.g. 50000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className={channelType === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}>
                    Create Receipt
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <CircleX className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-medium">Processing Error</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {errorMessage || "We couldn't process your document. Please try again."}
            </p>
            <div className="mt-6">
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Receipt Created</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Your {channelType === 'orange' ? 'external warehouse' : 'self-certified'} receipt has been successfully created.
            </p>
            <div className="mt-6">
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {channelType === 'orange' ? (
              <div className="flex items-center text-orange-800">
                <ExternalLink className="h-5 w-5 mr-2 text-orange-600" />
                Process External Receipt
              </div>
            ) : (
              <div className="flex items-center text-red-800">
                <FileText className="h-5 w-5 mr-2 text-red-600" />
                Self-Certified Storage
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {channelType === 'orange'
              ? "We'll extract information from your document and create a warehouse receipt"
              : "Enter details about your privately stored commodity"
            }
          </DialogDescription>
        </DialogHeader>
        
        {renderStageContent()}
      </DialogContent>
    </Dialog>
  );
}