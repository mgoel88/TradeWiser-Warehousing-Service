import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, AlertCircle, FileText, Info, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

// Schema for the form
const selfCertFormSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required'),
  commodityName: z.string().min(1, 'Commodity name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  measurementUnit: z.string().default('MT'),
  qualityGrade: z.string().optional(),
  location: z.string().min(1, 'Storage location is required'),
  description: z.string().optional(),
  valuation: z.string().optional()
});

type SelfCertFormValues = z.infer<typeof selfCertFormSchema>;

type Stage = 'form' | 'submitting' | 'success' | 'error';

interface RedChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RedChannelDialog({ isOpen, onClose }: RedChannelDialogProps) {
  const [stage, setStage] = useState<Stage>('form');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form handling
  const form = useForm<SelfCertFormValues>({
    resolver: zodResolver(selfCertFormSchema),
    defaultValues: {
      receiptNumber: `SELF-${Math.floor(Math.random() * 10000)}`,
      commodityName: '',
      quantity: '',
      measurementUnit: 'MT',
      qualityGrade: 'Standard',
      location: '',
      description: '',
      valuation: ''
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStage('form');
      setErrorMessage('');
      form.reset({
        receiptNumber: `SELF-${Math.floor(Math.random() * 10000)}`,
        commodityName: '',
        quantity: '',
        measurementUnit: 'MT',
        qualityGrade: 'Standard',
        location: '',
        description: '',
        valuation: ''
      });
    }
  }, [isOpen, form]);

  // Handle form submission
  const onSubmit = async (values: SelfCertFormValues) => {
    try {
      setStage('submitting');
      
      // Add channel and self-certification metadata
      const receiptData = {
        ...values,
        channelType: 'red',
        metadata: {
          isSelfCertified: true,
          certificationDate: new Date().toISOString(),
          storageLocation: values.location
        }
      };
      
      // Submit to API
      const response = await apiRequest('POST', '/api/receipts/manual', receiptData);
      
      if (response.ok) {
        setStage('success');
        toast({
          title: 'Self-Certified Receipt Created',
          description: 'Your commodity has been successfully registered in the system.',
        });
        
        // Refresh receipts data
        queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
        
        // Close dialog after success with delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create self-certified receipt');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStage('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create self-certified receipt',
        variant: 'destructive',
      });
    }
  };

  // Render stage-specific content
  const renderStageContent = () => {
    switch (stage) {
      case 'form':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
                <div className="flex">
                  <Shield className="h-5 w-5 text-red-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Red Channel - Self-Certified</p>
                    <p className="text-xs text-red-700">
                      By submitting this form, you certify that you own the specified commodity. 
                      Self-certified receipts have limited collateral value compared to verified receipts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SELF-12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Home Farm, Village Storehouse" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional details about your stored commodity" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valuation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value (₹)</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="e.g. 50000" />
                    </FormControl>
                    <FormDescription>
                      Approximate market value of the commodity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Create Self-Certified Receipt
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );
        
      case 'submitting':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse mb-4">
              <FileText className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-medium">Creating Self-Certified Receipt</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Please wait while we register your commodity...
            </p>
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
              Your self-certified storage receipt has been successfully created.
            </p>
            <div className="mt-6">
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-medium">Creation Failed</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {errorMessage || "We couldn't create your receipt. Please try again."}
            </p>
            <div className="mt-6 space-x-2">
              <Button onClick={() => setStage('form')} variant="outline">Try Again</Button>
              <Button onClick={onClose} variant="ghost">Close</Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center text-red-800">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Self-Certified Commodity Registration
            </div>
          </DialogTitle>
          <DialogDescription>
            Register commodities stored in your personal facility or farm storage
          </DialogDescription>
        </DialogHeader>
        
        {renderStageContent()}
      </DialogContent>
    </Dialog>
  );
}