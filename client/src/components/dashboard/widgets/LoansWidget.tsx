import { useQuery } from "@tanstack/react-query";
import { WidgetBase } from "./WidgetBase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CircleDollarSign, ExternalLink } from "lucide-react";
import { Loan } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface LoansWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
    filter?: "all" | "active" | "pending" | "repaid";
  };
}

export function LoansWidget({ id, title, config }: LoansWidgetProps) {
  const [, navigate] = useLocation();
  const count = config?.count || 3;
  const filter = config?.filter || "active";
  
  const { data: loans, isLoading } = useQuery({
    queryKey: ['/api/loans'],
    retry: 1,
    staleTime: 60000
  });

  // Filter and limit the loans
  const filteredLoans = loans 
    ? loans
        .filter((loan: Loan) => filter === "all" || loan.status === filter)
        .slice(0, count)
    : [];

  // Function to calculate loan progress
  const calculateLoanProgress = (loan: Loan) => {
    if (!loan.outstandingAmount || !loan.amount) return 0;
    const amountPaid = Number(loan.amount) - Number(loan.outstandingAmount);
    return Math.min(100, Math.max(0, (amountPaid / Number(loan.amount)) * 100));
  };

  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-full mt-1" />
            </div>
          ))}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <CircleDollarSign className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No loans found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map((loan: Loan) => (
            <div key={loan.id} className="p-2 border rounded-md bg-muted/10 hover:bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">₹{Number(loan.amount).toLocaleString()}</h4>
                  <p className="text-xs text-muted-foreground">
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)} • {loan.interestRate}% interest
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="sr-only">View details</span>
                </Button>
              </div>
              
              {loan.status === "active" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{Math.round(calculateLoanProgress(loan))}%</span>
                  </div>
                  <Progress value={calculateLoanProgress(loan)} className="h-1.5" />
                </div>
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => navigate("/loans")}
          >
            View All Loans
          </Button>
        </div>
      )}
    </WidgetBase>
  );
}