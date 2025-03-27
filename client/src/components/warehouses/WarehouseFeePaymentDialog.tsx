import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PaymentMethodSelector } from '../payments/PaymentMethodSelector';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle, Warehouse } from 'lucide-react';

// Define form validation schema
const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

type FormData = z.infer<typeof formSchema>;

interface WarehouseFeePaymentDialogProps {
  warehouseId: number;
  warehouseName: string;
  suggestedAmount?: string;
  trigger: React.ReactNode;
  onPaymentSuccess?: () => void;
}

export function WarehouseFeePaymentDialog({
  warehouseId,
  warehouseName,
  suggestedAmount = '500',
  trigger,
  onPaymentSuccess
}: WarehouseFeePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: suggestedAmount,
      paymentMethod: '',
    }
  });

  // Create payment mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      setIsProcessing(true);
      return apiRequest('POST', `/api/warehouses/${warehouseId}/pay-fees`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setIsProcessing(false);
      setIsSuccess(true);
      
      toast({
        title: 'Payment Successful',
        description: 'Your warehouse storage fee payment has been processed successfully.',
        variant: 'default',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/warehouses/${warehouseId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
      
      // Wait a moment before closing dialog
      setTimeout(() => {
        setOpen(false);
        setIsSuccess(false);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }, 1500);
    },
    onError: (error) => {
      setIsProcessing(false);
      
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your warehouse fee payment. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    mutate(data);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (methodId: string) => {
    form.setValue('paymentMethod', methodId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Warehouse Storage Fee</DialogTitle>
          <DialogDescription>
            Pay storage fees for {warehouseName}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="flex items-center space-x-2 p-3 rounded-md bg-muted">
              <Warehouse className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-sm">{warehouseName}</h4>
                <p className="text-xs text-muted-foreground">Warehouse ID: {warehouseId}</p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01" 
                      min="1"
                      placeholder="Enter amount" 
                      disabled={isPending || isSuccess}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PaymentMethodSelector
                      onMethodChange={handlePaymentMethodChange}
                      selectedMethod={field.value}
                      disabled={isPending || isSuccess}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isPending || isSuccess}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || isSuccess}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Paid
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}