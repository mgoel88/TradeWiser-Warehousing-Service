import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, CreditCard, IndianRupee, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bankPaymentClient, BankType, BankPaymentMethod, Bank, BankVerificationResult } from '@/lib/bankPaymentClient';

// Form schema
const bankPaymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  bankType: z.nativeEnum(BankType, {
    required_error: 'Please select a bank',
  }),
  paymentMethod: z.nativeEnum(BankPaymentMethod, {
    required_error: 'Please select a payment method',
  }),
  customerName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number is required').max(15, 'Phone number is too long'),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  receiverName: z.string().optional(),
  receiverAccountNumber: z.string().optional(),
  receiverIfscCode: z.string().optional(),
  receiverUpiId: z.string().optional(),
});

// Add conditional validation
const getConditionalSchema = (paymentMethod: BankPaymentMethod | null) => {
  if (!paymentMethod) return bankPaymentSchema;

  if (paymentMethod === BankPaymentMethod.UPI) {
    return bankPaymentSchema.extend({
      upiId: z.string().min(1, 'UPI ID is required'),
    });
  } else if (paymentMethod === BankPaymentMethod.NEFT || paymentMethod === BankPaymentMethod.RTGS || paymentMethod === BankPaymentMethod.IMPS) {
    return bankPaymentSchema.extend({
      accountNumber: z.string().min(1, 'Account number is required'),
      ifscCode: z.string().min(1, 'IFSC code is required'),
    });
  }

  return bankPaymentSchema;
};

// Form values type
export type BankPaymentFormValues = z.infer<typeof bankPaymentSchema>;

// Form props
interface BankPaymentFormProps {
  defaultAmount?: string;
  onPaymentSubmit: (data: BankPaymentFormValues) => void;
  isLoading?: boolean;
  receiverDetails?: {
    name: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  error?: string | null;
}

export default function BankPaymentForm({
  defaultAmount = '',
  onPaymentSubmit,
  isLoading = false,
  receiverDetails,
  error
}: BankPaymentFormProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<BankPaymentMethod | null>(null);
  const [bankAccountVerified, setBankAccountVerified] = useState<BankVerificationResult | null>(null);
  const [upiVerified, setUpiVerified] = useState<BankVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<{id: BankPaymentMethod, name: string}[]>([]);
  
  // Fetch the list of supported banks
  const { data: banks, isLoading: isLoadingBanks } = useQuery({
    queryKey: ['/api/bank/supported-banks'],
    queryFn: async () => {
      return await bankPaymentClient.getSupportedBanks();
    }
  });
  
  // Initialize the form
  const form = useForm<BankPaymentFormValues>({
    resolver: zodResolver(getConditionalSchema(selectedPaymentMethod)),
    defaultValues: {
      amount: defaultAmount || '',
      customerName: '',
      email: '',
      phone: '',
      receiverName: receiverDetails?.name || 'TradeWiser Finance',
      receiverAccountNumber: receiverDetails?.accountNumber || '',
      receiverIfscCode: receiverDetails?.ifscCode || '',
      receiverUpiId: receiverDetails?.upiId || '',
    },
  });
  
  // Watch for form value changes
  const watchBankType = form.watch('bankType');
  const watchPaymentMethod = form.watch('paymentMethod');
  const watchAccountNumber = form.watch('accountNumber');
  const watchIfscCode = form.watch('ifscCode');
  const watchUpiId = form.watch('upiId');
  
  // Update available payment methods when bank changes
  useEffect(() => {
    if (watchBankType && banks) {
      const selectedBank = banks.find(bank => bank.id === watchBankType);
      if (selectedBank) {
        setAvailableMethods(selectedBank.supportedMethods.map(method => ({
          id: method.id,
          name: method.name
        })));
        
        // Reset payment method if not available for this bank
        if (watchPaymentMethod && !selectedBank.supportedMethods.some(m => m.id === watchPaymentMethod)) {
          form.setValue('paymentMethod', undefined as any);
          setSelectedPaymentMethod(null);
        }
      }
    }
  }, [watchBankType, banks, form, watchPaymentMethod]);
  
  // Update selected payment method
  useEffect(() => {
    setSelectedPaymentMethod(watchPaymentMethod || null);
  }, [watchPaymentMethod]);
  
  // Update resolver when payment method changes
  useEffect(() => {
    form.clearErrors();
  }, [selectedPaymentMethod, form]);
  
  // Handle form submission
  const handleSubmit = (data: BankPaymentFormValues) => {
    onPaymentSubmit(data);
  };
  
  // Verify bank account
  const verifyBankAccount = async () => {
    if (!watchAccountNumber || !watchIfscCode) return;
    
    setIsVerifying(true);
    try {
      const result = await bankPaymentClient.verifyBankAccount(watchAccountNumber, watchIfscCode);
      setBankAccountVerified(result);
    } catch (error) {
      setBankAccountVerified({
        isVerified: false,
        accountExists: false,
        message: 'Failed to verify account'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Verify UPI ID
  const verifyUpiId = async () => {
    if (!watchUpiId) return;
    
    setIsVerifying(true);
    try {
      const result = await bankPaymentClient.verifyUpiId(watchUpiId);
      setUpiVerified(result);
    } catch (error) {
      setUpiVerified({
        isVerified: false,
        accountExists: false,
        message: 'Failed to verify UPI ID'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Clear verification when input changes
  useEffect(() => {
    setBankAccountVerified(null);
  }, [watchAccountNumber, watchIfscCode]);
  
  useEffect(() => {
    setUpiVerified(null);
  }, [watchUpiId]);
  
  // Format payment methods for display
  const getPaymentMethodName = (method: BankPaymentMethod) => {
    switch (method) {
      case BankPaymentMethod.NEFT: return 'NEFT';
      case BankPaymentMethod.RTGS: return 'RTGS';
      case BankPaymentMethod.IMPS: return 'IMPS';
      case BankPaymentMethod.UPI: return 'UPI';
      case BankPaymentMethod.NETBANKING: return 'Net Banking';
      default: return method;
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Details</h3>
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      className="pl-9"
                      placeholder="Enter amount"
                      readOnly={!!defaultAmount}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Bank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingBanks ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading banks...</span>
                      </div>
                    ) : (
                      banks?.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            {bank.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watchBankType && availableMethods.length > 0 && (
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value as BankPaymentMethod)}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {availableMethods.map((method) => (
                        <FormItem key={method.id} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={method.id} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {getPaymentMethodName(method.id)}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Information</h3>
          
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your full name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Enter your email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {selectedPaymentMethod === BankPaymentMethod.UPI && (
            <div>
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} placeholder="username@bank" />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={verifyUpiId}
                        disabled={!watchUpiId || isVerifying}
                        className="flex-shrink-0"
                      >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    <FormMessage />
                    
                    {upiVerified && (
                      <div className={`mt-2 p-2 text-sm rounded-md ${upiVerified.isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="flex items-center">
                          {upiVerified.isVerified ? (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mr-2" />
                          )}
                          <span>{upiVerified.message || (upiVerified.isVerified ? 'UPI ID verified' : 'Invalid UPI ID')}</span>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {(selectedPaymentMethod === BankPaymentMethod.NEFT || 
            selectedPaymentMethod === BankPaymentMethod.RTGS || 
            selectedPaymentMethod === BankPaymentMethod.IMPS) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} placeholder="BANK0000123" />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={verifyBankAccount}
                          disabled={!watchAccountNumber || !watchIfscCode || isVerifying}
                          className="flex-shrink-0"
                        >
                          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {bankAccountVerified && (
                <div className={`p-3 text-sm rounded-md ${bankAccountVerified.isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center">
                    {bankAccountVerified.isVerified ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    <span>
                      {bankAccountVerified.message || (bankAccountVerified.isVerified 
                        ? `Verified account for ${bankAccountVerified.accountName || 'account holder'}`
                        : 'Invalid account details')}
                    </span>
                  </div>
                  {bankAccountVerified.isVerified && (
                    <div className="mt-1 ml-6 text-xs">
                      {bankAccountVerified.bankName && <div>Bank: {bankAccountVerified.bankName}</div>}
                      {bankAccountVerified.branch && <div>Branch: {bankAccountVerified.branch}</div>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Receiver Information</h3>
          
          <Card className="p-4 bg-muted/10">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Receiver Name:</span>
                <span>{receiverDetails?.name || "TradeWiser Finance"}</span>
              </div>
              
              {selectedPaymentMethod === BankPaymentMethod.UPI && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">UPI ID:</span>
                  <span>{receiverDetails?.upiId || "tradewiser@sbi"}</span>
                </div>
              )}
              
              {(selectedPaymentMethod === BankPaymentMethod.NEFT || 
                selectedPaymentMethod === BankPaymentMethod.RTGS || 
                selectedPaymentMethod === BankPaymentMethod.IMPS) && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Account Number:</span>
                    <span>{receiverDetails?.accountNumber || "12345678901"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">IFSC Code:</span>
                    <span>{receiverDetails?.ifscCode || "SBIN0001234"}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || isVerifying} 
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Make Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}