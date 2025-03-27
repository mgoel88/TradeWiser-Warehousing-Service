import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";
import PaymentDialog from "@/components/payments/PaymentDialog";
import { queryClient } from "@/lib/queryClient";

interface LoanRepaymentButtonProps {
  loanId: number;
  amount: number;
  outstandingAmount: string | null;
  status: "active" | "pending" | "repaid" | "defaulted";
}

export default function LoanRepaymentButton({
  loanId,
  amount,
  outstandingAmount,
  status
}: LoanRepaymentButtonProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Only allow repayment for active or pending loans
  const isRepayable = status === "active" || status === "pending";
  
  // Calculate repayment amount (use outstanding amount if available)
  const repaymentAmount = outstandingAmount 
    ? parseFloat(outstandingAmount) 
    : parseFloat(String(amount));
  
  const handleRepaymentSuccess = (transactionId: string) => {
    toast({
      title: "Loan Repayment Successful",
      description: `Your loan repayment of ₹${repaymentAmount.toLocaleString()} has been processed. Transaction ID: ${transactionId}`,
    });
    
    // Invalidate loans cache to refresh the list
    queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
  };
  
  if (!isRepayable) {
    return null;
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1"
        onClick={() => setIsDialogOpen(true)}
      >
        <CreditCard className="h-4 w-4" />
        Repay Loan
      </Button>
      
      <PaymentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleRepaymentSuccess}
        amount={repaymentAmount}
        description={`Loan Repayment - Loan #${loanId}`}
        paymentType="loan_repayment"
        referenceId={loanId}
      />
    </>
  );
}