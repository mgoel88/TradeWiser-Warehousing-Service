import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loan, WarehouseReceipt } from "@shared/schema";
import { CreditCard, ArrowUpRight, PiggyBank, Calendar, Clock, CircleDollarSign } from "lucide-react";

export default function Loans() {
  // Fetch loans
  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['/api/loans'],
  });
  
  // Fetch receipts for eligible collateral
  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
  });
  
  // Calculate loan stats
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
    
    // Sum up the total value of all active receipts
    const totalCollateralValue = receipts
      .filter((receipt: WarehouseReceipt) => receipt.status === 'active')
      .reduce((sum: number, receipt: WarehouseReceipt) => {
        return sum + (receipt.valuation || 0);
      }, 0);
    
    // Maximum eligible loan is 70% of the collateral value
    const maxEligibleLoan = totalCollateralValue * 0.7;
    
    // Sum up the outstanding amount of all active loans
    const currentLoanBalance = loans
      .filter((loan: Loan) => loan.status === 'active')
      .reduce((sum: number, loan: Loan) => {
        return sum + (loan.outstandingAmount || 0);
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
  
  const loanStats = calculateLoanStats();
  
  // Filter eligible collateral (active receipts not already used)
  const eligibleCollateral = receipts 
    ? receipts.filter((receipt: WarehouseReceipt) => {
        // Check if receipt is active and not already used as collateral
        const isActive = receipt.status === 'active';
        const isNotCollateralized = !receipt.liens || Object.keys(receipt.liens).length === 0;
        return isActive && isNotCollateralized;
      })
    : [];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Loans</h1>
        <p className="text-gray-600">Access flexible financing backed by your warehouse receipts</p>
      </div>
      
      {/* Loan Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loan Availability</CardTitle>
        </CardHeader>
        <CardContent>
          {loansLoading || receiptsLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500 mb-4"></div>
              <p className="text-gray-500">Loading data...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div 
                    className="h-2 rounded-full bg-accent-500" 
                    style={{ width: `${Math.min(100, loanStats.percentUsed)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>₹0</span>
                  <span>Available: {formatCurrency(loanStats.availableCredit)}</span>
                  <span>{formatCurrency(loanStats.maxEligibleLoan)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-2">
                      <PiggyBank size={18} />
                    </div>
                    <h3 className="font-medium">Total Collateral</h3>
                  </div>
                  <p className="text-2xl font-bold mono">{formatCurrency(loanStats.totalCollateralValue)}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-500 flex items-center justify-center mr-2">
                      <CircleDollarSign size={18} />
                    </div>
                    <h3 className="font-medium">Maximum Eligible</h3>
                  </div>
                  <p className="text-2xl font-bold mono">{formatCurrency(loanStats.maxEligibleLoan)}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-2">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="font-medium">Current Balance</h3>
                  </div>
                  <p className="text-2xl font-bold mono">{formatCurrency(loanStats.currentLoanBalance)}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-500 flex items-center justify-center mr-2">
                      <ArrowUpRight size={18} />
                    </div>
                    <h3 className="font-medium">Available Credit</h3>
                  </div>
                  <p className="text-2xl font-bold mono">{formatCurrency(loanStats.availableCredit)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full bg-accent-500 hover:bg-accent-600" disabled={loanStats.availableCredit <= 0}>
                  Apply for Loan
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Loan Management Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="collateral">Eligible Collateral</TabsTrigger>
          <TabsTrigger value="history">Loan History</TabsTrigger>
        </TabsList>
        
        {/* Active Loans Tab */}
        <TabsContent value="active">
          {loansLoading ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500 mb-4"></div>
              <p className="text-gray-500">Loading loans...</p>
            </div>
          ) : !loans || loans.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <CreditCard size={40} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No active loans</h3>
              <p className="text-gray-500 mb-4">You don't have any active loans at the moment</p>
              <Button className="bg-accent-500 hover:bg-accent-600">Apply for a Loan</Button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan: Loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">LOAN-{10000 + loan.id}</TableCell>
                      <TableCell>{formatCurrency(loan.amount)}</TableCell>
                      <TableCell>{formatCurrency(loan.outstandingAmount || 0)}</TableCell>
                      <TableCell>{loan.interestRate}%</TableCell>
                      <TableCell>{formatDate(loan.startDate)}</TableCell>
                      <TableCell>{formatDate(loan.endDate)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${loan.status === 'active' ? 'bg-green-100 text-green-800' :
                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              loan.status === 'repaid' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Eligible Collateral Tab */}
        <TabsContent value="collateral">
          {receiptsLoading ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-500">Loading collateral...</p>
            </div>
          ) : !eligibleCollateral || eligibleCollateral.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <Clock size={40} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No eligible collateral</h3>
              <p className="text-gray-500 mb-4">You don't have any active warehouse receipts to use as collateral</p>
              <Button className="bg-primary-500 hover:bg-primary-600">Book Warehouse</Button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Eligible Loan Amount</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligibleCollateral.map((receipt: WarehouseReceipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                      <TableCell>Commodity ID: {receipt.commodityId}</TableCell>
                      <TableCell>{receipt.quantity} MT</TableCell>
                      <TableCell>{formatCurrency(receipt.valuation || 0)}</TableCell>
                      <TableCell>{formatCurrency((receipt.valuation || 0) * 0.7)}</TableCell>
                      <TableCell>{formatDate(receipt.expiryDate)}</TableCell>
                      <TableCell>
                        <Button size="sm" className="bg-accent-500 hover:bg-accent-600">Use as Collateral</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Loan History Tab */}
        <TabsContent value="history">
          {loansLoading ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500 mb-4"></div>
              <p className="text-gray-500">Loading loan history...</p>
            </div>
          ) : !loans || loans.filter((loan: Loan) => loan.status === 'repaid').length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <Calendar size={40} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No loan history</h3>
              <p className="text-gray-500">You don't have any completed loans yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans
                    .filter((loan: Loan) => loan.status === 'repaid')
                    .map((loan: Loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">LOAN-{10000 + loan.id}</TableCell>
                        <TableCell>{formatCurrency(loan.amount)}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>{formatDate(loan.startDate)}</TableCell>
                        <TableCell>{formatDate(loan.endDate)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Repaid
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
