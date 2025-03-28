import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, BadgeCheck } from 'lucide-react';

interface LoanRepaymentButtonProps {
  loanId: number;
  amount: number;
  outstandingAmount: string | null;
  status: string;
}

export default function LoanRepaymentButton({
  loanId,
  amount,
  outstandingAmount,
  status
}: LoanRepaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>(outstandingAmount || amount.toString());
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Repayment mutation
  const repayLoanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/loans/${loanId}/repay`, {
        amount: paymentAmount
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      toast({
        title: "Payment Successful",
        description: `You have successfully repaid ₹${Number(paymentAmount).toLocaleString()} of your loan.`,
      });
      
      // Reset and close after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setPaymentSuccess(false);
      }, 2000);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleRepayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid repayment amount",
        variant: "destructive",
      });
      return;
    }
    
    // If amount is greater than outstanding, show warning but allow
    if (outstandingAmount && Number(paymentAmount) > Number(outstandingAmount)) {
      toast({
        title: "Amount Exceeds Outstanding",
        description: "You're paying more than the outstanding amount. The excess will be recorded as an advance payment.",
      });
    }
    
    setIsProcessing(true);
    repayLoanMutation.mutate();
  };
  
  const buttonLabel = status === "active" ? "Make Payment" : "Process Approval";
  
  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <DollarSign className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentSuccess ? "Payment Successful" : `${status === "active" ? "Loan Repayment" : "Process Application"}`}
            </DialogTitle>
            <DialogDescription>
              {paymentSuccess 
                ? "Your payment has been processed successfully" 
                : `${status === "active" 
                    ? "Enter the amount you want to repay" 
                    : "Process your loan application"}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {paymentSuccess ? (
            <div className="py-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <BadgeCheck className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center">Your payment of ₹{Number(paymentAmount).toLocaleString()} has been processed successfully.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                {status === "active" ? (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="loan-amount" className="text-right">
                        Loan Amount
                      </Label>
                      <div className="col-span-3">
                        <p className="px-3 py-2 border rounded-md bg-muted/10">
                          ₹{amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="outstanding" className="text-right">
                        Outstanding
                      </Label>
                      <div className="col-span-3">
                        <p className="px-3 py-2 border rounded-md bg-muted/10 text-primary">
                          ₹{outstandingAmount ? Number(outstandingAmount).toLocaleString() : amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="payment-amount" className="text-right">
                        Payment Amount
                      </Label>
                      <div className="col-span-3 relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="payment-amount"
                          className="pl-9"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter payment amount"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <p>Your loan application for ₹{amount.toLocaleString()} is currently pending approval. 
                    Once approved, you'll be able to access the funds.</p>
                    <div className="mt-4 p-3 bg-muted/20 rounded-md">
                      <h4 className="font-medium">Application Details:</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>Amount: ₹{amount.toLocaleString()}</li>
                        <li>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</li>
                        <li>ID: #{loanId}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                {status === "active" && (
                  <Button 
                    onClick={handleRepayment} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Processing...
                      </>
                    ) : (
                      "Make Payment"
                    )}
                  </Button>
                )}
                {status === "pending" && (
                  <Button disabled>
                    Awaiting Approval
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}