import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import BankPaymentForm, { BankPaymentFormValues } from '@/components/payment/BankPaymentForm';
import { BankPaymentStatus, BankType, BankPaymentMethod } from '@/lib/bankPaymentClient';
import { CalendarIcon, AlertCircle, CheckCircle2, CreditCard, Download } from 'lucide-react';
import { format } from 'date-fns';

type LoanDetailParams = {
  id?: string;
};

interface LoanRepayment {
  id: number;
  loanId: number;
  userId: number;
  amount: string;
  status: string;
  paymentMethod: string;
  transactionDate: string | null;
  interestAmount: string | null;
  principalAmount: string | null;
  transactionHash: string | null;
  externalTransactionId: string | null;
}

interface Loan {
  id: number;
  amount: string;
  outstandingAmount?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  interestRate?: string;
  lendingPartnerName?: string;
  userId?: number;
  lendingPartnerId?: number;
}

interface Payment {
  transactionId: string;
  referenceNumber: string;
  bankTransactionId?: string;
  amount: string;
  currency: string;
  description: string;
  status: BankPaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface Receipt {
  url: string;
  receiptNumber: string;
}

interface PaymentResponse {
  payment: Payment;
  loanRepayment: LoanRepayment;
  receipt?: Receipt;
}

function LoanRepaymentPage() {
  const [, setLocation] = useLocation();
  const params = useParams<LoanDetailParams>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentResponse | null>(null);

  // Handle form submission
  const handlePayment = async (data: BankPaymentFormValues) => {
    if (!params.id) {
      setErrorMessage('Loan ID is missing');
      return;
    }

    try {
      const paymentRequest = {
        loanId: parseInt(params.id),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        bankType: data.bankType,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        upiId: data.upiId
      };

      // Make the payment request
      mutation.mutate(paymentRequest);
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Failed to process payment. Please try again.');
    }
  };

  // Query loan details
  const { data: loan, isLoading, error: loanError } = useQuery({
    queryKey: [`/api/loans/${params.id}`],
    queryFn: async () => {
      if (!params.id) throw new Error('Loan ID is missing');
      const response = await apiRequest('GET', `/api/loans/${params.id}`);
      return response.json();
    },
    enabled: !!params.id,
  });

  // Mutation for making payment
  const mutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/bank/loan-repayment', paymentData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setPaymentSuccess(data);
      queryClient.invalidateQueries({ queryKey: [`/api/loans/${params.id}`] });
      toast({
        title: 'Payment Initiated',
        description: 'Your payment is being processed.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to process payment. Please try again.');
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // If loan ID is missing, show an error
  if (!params.id) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Loan ID is missing. Please go back to the loans page and try again.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setLocation('/loans')}>Back to Loans</Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  // Render error state
  if (loanError) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load loan details. Please try again.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setLocation('/loans')}>Back to Loans</Button>
        </div>
      </div>
    );
  }

  // Render payment success state
  if (paymentSuccess) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card className="overflow-hidden">
          <CardHeader className="bg-green-50 border-b">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Payment Initiated</CardTitle>
            </div>
            <CardDescription>Your payment is being processed</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
                <p className="mt-1 font-medium">{paymentSuccess.payment.transactionId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Reference Number</h3>
                <p className="mt-1 font-medium">{paymentSuccess.payment.referenceNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                <p className="mt-1 font-medium">₹{paymentSuccess.payment.amount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="mt-1">
                  <Badge className={paymentSuccess.payment.status === BankPaymentStatus.COMPLETED ? 'bg-green-500 hover:bg-green-600' : ''} variant="secondary">
                    {paymentSuccess.payment.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                <div className="mt-1 flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(paymentSuccess.payment.createdAt), 'PPP')}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Loan ID</h3>
                <p className="mt-1 font-medium">#{paymentSuccess.loanRepayment.loanId}</p>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle>Payment Processing</AlertTitle>
              <AlertDescription className="text-blue-700">
                Your payment is being processed by the bank. You can check the status in your payments history.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 flex justify-between">
            <Button variant="outline" onClick={() => setLocation('/loans')}>
              Back to Loans
            </Button>
            <div className="flex gap-2">
              {paymentSuccess.receipt?.url && (
                <Button 
                  variant="default"
                  onClick={() => window.open(paymentSuccess.receipt?.url, '_blank')}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              )}
              <Button variant="outline" onClick={() => setLocation('/payments')}>
                Payment History
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Format loan details if available
  const loanDetails = loan ? {
    id: loan.id,
    amount: loan.amount,
    outstandingAmount: loan.outstandingAmount || loan.amount,
    status: loan.status,
    startDate: loan.startDate ? new Date(loan.startDate) : null,
    endDate: loan.endDate ? new Date(loan.endDate) : null,
    interestRate: loan.interestRate,
    lendingPartnerName: loan.lendingPartnerName
  } : {};

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Loan Repayment</h1>
        <p className="text-muted-foreground mt-2">Make a payment towards your loan</p>
      </div>
      
      <div className="grid gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Review your loan information before making a payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Loan Amount</h3>
                <p className="mt-1 font-medium">₹{loanDetails.amount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Outstanding Amount</h3>
                <p className="mt-1 font-medium">₹{loanDetails.outstandingAmount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Interest Rate</h3>
                <p className="mt-1 font-medium">{loanDetails.interestRate}%</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                <div className="mt-1 flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{loanDetails.endDate ? format(loanDetails.endDate, 'PPP') : 'Not specified'}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Loan ID</h3>
                <p className="mt-1 font-medium">#{loanDetails.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="mt-1">
                  <Badge 
                    className={loanDetails.status === 'repaid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    variant={loanDetails.status === 'active' ? 'default' : 'secondary'}>
                    {loanDetails.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>Enter your payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <BankPaymentForm
              defaultAmount={loanDetails.outstandingAmount}
              onPaymentSubmit={handlePayment}
              isLoading={mutation.isPending}
              error={errorMessage}
              receiverDetails={{
                name: "TradeWiser Finance",
                accountNumber: "1122334455667788",
                ifscCode: "TWIS0001122",
                upiId: "finance@tradewiser"
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation('/loans')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default LoanRepaymentPage;