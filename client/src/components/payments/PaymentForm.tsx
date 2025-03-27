import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { useToast } from '@/hooks/use-toast';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle } from 'lucide-react';

// Define form validation schema
const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

type FormData = z.infer<typeof formSchema>;

interface PaymentFormProps {
  title?: string;
  description?: string;
  initialAmount?: string;
  initialDescription?: string;
  referenceId?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
  submitLabel?: string;
  metadata?: any;
}

export function PaymentForm({
  title = "Make a Payment",
  description = "Complete the form below to process your payment",
  initialAmount = '',
  initialDescription = '',
  referenceId,
  onSuccess,
  onError,
  submitLabel = "Pay Now",
  metadata = {}
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialAmount,
      description: initialDescription,
      paymentMethod: '',
    }
  });

  // Create payment mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      setIsProcessing(true);
      const payload = {
        ...data,
        referenceId,
        metadata
      };
      return apiRequest('POST', '/api/payment/create', payload);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setIsProcessing(false);
      setIsSuccess(true);
      
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully.',
        variant: 'default',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
      
      // Wait a moment before resetting form
      setTimeout(() => {
        form.reset({
          amount: '',
          description: '',
          paymentMethod: '',
        });
        setIsSuccess(false);
        
        if (onSuccess) {
          onSuccess(data);
        }
      }, 1500);
    },
    onError: (error) => {
      setIsProcessing(false);
      
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
      
      if (onError) {
        onError(error);
      }
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter payment description" 
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
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending || isSuccess}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Payment Complete
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}