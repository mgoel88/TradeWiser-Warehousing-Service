import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function LoanWidget() {
  const [, navigate] = useLocation();
  
  const { data: loans, isLoading } = useQuery({
    queryKey: ['/api/loans'],
  });
  
  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
  });
  
  if (isLoading || receiptsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-headings font-medium text-lg">Loan Availability</h2>
        </div>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading loan data...</p>
        </div>
      </div>
    );
  }
  
  // Calculate loan stats from data
  const calculateLoanStats = () => {
    if (!receipts || !loans) {
      return {
        totalCollateralValue: 0,
        maxEligibleLoan: 0,
        currentLoanBalance: 0,
        availableCredit: 0,
        percentUsed: 0
      };
    }
    
    // Sum up the total value of all receipts
    const totalCollateralValue = receipts.reduce((sum: number, receipt: any) => {
      return sum + (receipt.valuation || 0);
    }, 0);
    
    // Maximum eligible loan is 70% of the collateral value
    const maxEligibleLoan = totalCollateralValue * 0.7;
    
    // Sum up the outstanding amount of all active loans
    const currentLoanBalance = loans.reduce((sum: number, loan: any) => {
      return sum + (loan.status === 'active' ? (loan.outstandingAmount || 0) : 0);
    }, 0);
    
    // Available credit is the difference
    const availableCredit = Math.max(0, maxEligibleLoan - currentLoanBalance);
    
    // Calculate percentage of maximum loan used
    const percentUsed = maxEligibleLoan > 0 ? (currentLoanBalance / maxEligibleLoan) * 100 : 0;
    
    return {
      totalCollateralValue,
      maxEligibleLoan,
      currentLoanBalance,
      availableCredit,
      percentUsed
    };
  };
  
  const stats = calculateLoanStats();
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4 border-b">
        <h2 className="font-headings font-medium text-lg">Loan Availability</h2>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full">
            <div 
              className="h-2 rounded-full bg-accent-500" 
              style={{ width: `${Math.min(100, stats.percentUsed)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>₹0</span>
            <span>Available: {formatCurrency(stats.availableCredit)}</span>
            <span>{formatCurrency(stats.maxEligibleLoan)}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Collateral Value</span>
            <span className="font-medium mono">{formatCurrency(stats.totalCollateralValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Maximum Eligible Loan</span>
            <span className="font-medium mono">{formatCurrency(stats.maxEligibleLoan)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Loan Balance</span>
            <span className="font-medium mono">{formatCurrency(stats.currentLoanBalance)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center font-medium">
            <span className="text-accent-600">Available Credit</span>
            <span className="text-accent-600 mono">{formatCurrency(stats.availableCredit)}</span>
          </div>
        </div>
        
        <Button 
          className="mt-4 w-full py-2 bg-accent-500 hover:bg-accent-600"
          onClick={() => navigate('/loans')}
        >
          Apply for Loan
        </Button>
      </div>
    </div>
  );
}
