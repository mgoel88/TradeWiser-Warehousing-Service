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
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// Define form validation schema
const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

type FormData = z.infer<typeof formSchema>;

interface LoanRepaymentDialogProps {
  loanId: number;
  loanAmount: string;
  outstandingAmount: string | null;
  trigger: React.ReactNode;
  onRepaymentSuccess?: () => void;
}

export function LoanRepaymentDialog({
  loanId,
  loanAmount,
  outstandingAmount,
  trigger,
  onRepaymentSuccess
}: LoanRepaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Calculate amount to show
  const amount = outstandingAmount || loanAmount;

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: amount,
      paymentMethod: '',
    }
  });

  // Create payment mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      setIsProcessing(true);
      return apiRequest('POST', `/api/loans/${loanId}/repay`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setIsProcessing(false);
      setIsSuccess(true);
      
      toast({
        title: 'Loan Repayment Successful',
        description: 'Your loan payment has been processed successfully.',
        variant: 'default',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: [`/api/loans/${loanId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
      
      // Wait a moment before closing dialog
      setTimeout(() => {
        setOpen(false);
        setIsSuccess(false);
        if (onRepaymentSuccess) {
          onRepaymentSuccess();
        }
      }, 1500);
    },
    onError: (error) => {
      setIsProcessing(false);
      
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your loan payment. Please try again.',
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
          <DialogTitle>Loan Repayment</DialogTitle>
          <DialogDescription>
            Make a payment towards your loan. The current outstanding amount is ₹{parseFloat(amount).toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      max={amount}
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
            
            <div className="pt-2 text-sm">
              {parseFloat(form.watch('amount') || '0') < parseFloat(amount) ? (
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  This is a partial payment. You will need to make additional payments to fully repay the loan.
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  This will fully repay your loan.
                </div>
              )}
            </div>
            
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