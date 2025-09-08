import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptCollateralLoanForm } from "@/components/loans/ReceiptCollateralLoanForm";
import LoanRepaymentButton from "@/components/loans/LoanRepaymentButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CreditCard, CircleDollarSign, Clock, Check, AlertCircle, IndianRupee, Receipt, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loan } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EligibleCollateral {
  id: number;
  receiptNumber: string;
  commodityName: string;
  commodityType: string;
  quantity: string;
  measurementUnit: string;
  warehouseName: string;
  receiptValue: number;
  maxLoanAmount: number;
  collateralRatio: number;
  issuedDate: string;
  status: string;
  qualityGrade: string;
  blockchainVerified: boolean;
}

export default function LoansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("collateral");
  const [showNewLoanForm, setShowNewLoanForm] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [isApplyingLoan, setIsApplyingLoan] = useState(false);
  
  // Query to fetch loans
  const { data: loans, isLoading } = useQuery({
    queryKey: ['/api/loans'],
    retry: 1,
    staleTime: 30000
  });
  
  // Query to fetch eligible collateral
  const { data: eligibleCollateralData, isLoading: isLoadingCollateral, refetch: refetchCollateral } = useQuery({
    queryKey: ['/api/loans/eligible-collateral'],
    retry: 1,
    staleTime: 30000
  });
  
  // Close loan form handler
  const handleCloseLoanForm = () => {
    setShowNewLoanForm(false);
    // Refresh the loans data
    queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
  };
  
  // Handle apply for loan button click
  const handleApplyForLoan = () => {
    setShowNewLoanForm(true);
    // Scroll to top for better visibility of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle receipt selection
  const handleReceiptSelection = (receiptId: number, checked: boolean) => {
    if (checked) {
      setSelectedReceipts(prev => [...prev, receiptId]);
    } else {
      setSelectedReceipts(prev => prev.filter(id => id !== receiptId));
    }
  };

  // Calculate total loan amount for selected receipts
  const calculateTotalLoanAmount = () => {
    if (!eligibleCollateralData?.eligibleCollateral) return 0;
    return selectedReceipts.reduce((total, receiptId) => {
      const receipt = eligibleCollateralData.eligibleCollateral.find((r: EligibleCollateral) => r.id === receiptId);
      return total + (receipt?.maxLoanAmount || 0);
    }, 0);
  };

  // Apply for loan with selected receipts
  const handleApplyForLoanWithReceipts = async () => {
    if (selectedReceipts.length === 0) {
      toast({
        title: "No receipts selected",
        description: "Please select at least one receipt as collateral",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(requestedAmount) || calculateTotalLoanAmount();
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid loan amount",
        variant: "destructive"
      });
      return;
    }

    setIsApplyingLoan(true);
    try {
      await apiRequest("/loans/apply-with-collateral", "POST", {
        receiptIds: selectedReceipts,
        requestedAmount: amount,
        tenureMonths: 12,
        purpose: "Working Capital"
      });

      toast({
        title: "Loan application successful!",
        description: "Your loan has been approved and will be disbursed shortly",
      });

      // Reset form and refresh data
      setSelectedReceipts([]);
      setRequestedAmount("");
      setShowLoanDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      refetchCollateral();
      
    } catch (error: any) {
      toast({
        title: "Application failed",
        description: error.message || "Failed to process loan application",
        variant: "destructive"
      });
    } finally {
      setIsApplyingLoan(false);
    }
  };
  
  // Filter loans by status
  const getFilteredLoans = () => {
    if (!loans) return [];
    
    return loans.filter((loan: Loan) => {
      if (selectedTab === "active") return loan.status === "active";
      if (selectedTab === "pending") return loan.status === "pending";
      if (selectedTab === "repaid") return loan.status === "repaid";
      return true; // all
    });
  };
  
  // Get loan status badge color
  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-blue-100 text-blue-800";
      case "repaid": return "bg-gray-100 text-gray-800";
      case "defaulted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get loan status icon
  const getLoanStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CreditCard className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "repaid": return <Check className="h-4 w-4" />;
      case "defaulted": return <AlertCircle className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loans & Financing</h1>
          <Button 
            onClick={() => {
              if (showNewLoanForm) {
                handleCloseLoanForm();
              } else {
                handleApplyForLoan();
              }
            }}
            className="gap-2"
            variant={showNewLoanForm ? "outline" : "default"}
          >
            {showNewLoanForm ? (
              "Cancel Application"
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Apply for Loan
              </>
            )}
          </Button>
        </div>
        
        {showNewLoanForm ? (
          <div className="mb-8">
            <ReceiptCollateralLoanForm onSuccess={handleCloseLoanForm} />
          </div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Receipt Collateral Loans
                </CardTitle>
                <CardDescription>
                  Use your warehouse receipts as collateral to get quick, low-interest loans
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-1">Fast Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Get loans approved in as little as 24 hours with quick blockchain verification
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-1">Competitive Rates</h3>
                  <p className="text-sm text-muted-foreground">
                    Collateral-backed loans with interest rates as low as 8% per annum
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-1">Flexible Terms</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose loan durations from 1 to 24 months with simple repayment options
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="collateral">Eligible Collateral</TabsTrigger>
                <TabsTrigger value="active">Active Loans</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="repaid">Repaid</TabsTrigger>
                <TabsTrigger value="all">All Loans</TabsTrigger>
              </TabsList>
              
              <TabsContent value="collateral" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Eligible Warehouse Receipts
                    </CardTitle>
                    <CardDescription>
                      Use your warehouse receipts as collateral to secure loans. 
                      Up to 80% of receipt value available as loan amount.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCollateral ? (
                      <div className="text-center py-8">Loading eligible receipts...</div>
                    ) : !eligibleCollateralData?.eligibleCollateral?.length ? (
                      <div className="text-center py-8 border rounded-lg bg-muted/10">
                        <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-muted-foreground">No Eligible Receipts</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          You need active warehouse receipts to apply for loans. Complete a commodity deposit first.
                        </p>
                        <Button 
                          className="mt-4 gap-2"
                          onClick={() => window.location.href = '/deposit'}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Make a Deposit
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                          <div>
                            <h4 className="font-medium text-blue-900">Available Collateral Summary</h4>
                            <p className="text-sm text-blue-700">
                              Total Value: ₹{eligibleCollateralData.totalEligibleValue?.toLocaleString()} • 
                              Max Loan: ₹{eligibleCollateralData.totalMaxLoanAmount?.toLocaleString()} • 
                              {eligibleCollateralData.count} receipts
                            </p>
                          </div>
                          <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
                            <DialogTrigger asChild>
                              <Button className="gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Apply for Loan
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Apply for Loan</DialogTitle>
                                <DialogDescription>
                                  Configure your loan application with selected receipts
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Requested Amount (₹)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    value={requestedAmount}
                                    onChange={(e) => setRequestedAmount(e.target.value)}
                                    placeholder={calculateTotalLoanAmount().toString()}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max available: ₹{calculateTotalLoanAmount().toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Interest Rate:</span>
                                    <span>12% per annum</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tenure:</span>
                                    <span>12 months</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Selected Receipts:</span>
                                    <span>{selectedReceipts.length}</span>
                                  </div>
                                </div>
                                <Button 
                                  onClick={handleApplyForLoanWithReceipts}
                                  disabled={isApplyingLoan || selectedReceipts.length === 0}
                                  className="w-full"
                                >
                                  {isApplyingLoan ? "Processing..." : "Submit Application"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="grid gap-4">
                          {eligibleCollateralData.eligibleCollateral.map((receipt: EligibleCollateral) => (
                            <div key={receipt.id} className="border rounded-lg p-4">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={selectedReceipts.includes(receipt.id)}
                                  onCheckedChange={(checked) => handleReceiptSelection(receipt.id, !!checked)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{receipt.receiptNumber}</h4>
                                      {receipt.blockchainVerified && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Shield className="h-3 w-3 mr-1" />
                                          Blockchain Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">
                                        ₹{receipt.maxLoanAmount.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Max loan amount</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Commodity</p>
                                      <p className="font-medium">{receipt.commodityName}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Quantity</p>
                                      <p className="font-medium">{receipt.quantity} {receipt.measurementUnit}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Quality Grade</p>
                                      <p className="font-medium">{receipt.qualityGrade}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Receipt Value</p>
                                      <p className="font-medium">₹{receipt.receiptValue.toLocaleString()}</p>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                      Warehouse: {receipt.warehouseName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {receipt.collateralRatio}% LTV
                                      </Badge>
                                      <Badge variant="default" className="text-xs">
                                        {receipt.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  {selectedReceipts.includes(receipt.id) && (
                                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                      <CheckCircle className="h-4 w-4 inline mr-2" />
                                      Selected for loan application
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedReceipts.length > 0 && (
                          <div className="sticky bottom-4 p-4 bg-white border rounded-lg shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {selectedReceipts.length} receipts selected
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Total available loan: ₹{calculateTotalLoanAmount().toLocaleString()}
                                </p>
                              </div>
                              <Button onClick={() => setShowLoanDialog(true)} className="gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Apply for ₹{calculateTotalLoanAmount().toLocaleString()}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value={selectedTab} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedTab === "active" && "Active Loans"}
                      {selectedTab === "pending" && "Pending Loan Applications"}
                      {selectedTab === "repaid" && "Repaid Loans"}
                      {selectedTab === "all" && "All Loans"}
                    </CardTitle>
                    <CardDescription>
                      Showing {getFilteredLoans().length} {getFilteredLoans().length === 1 ? "loan" : "loans"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">Loading loans...</div>
                    ) : getFilteredLoans().length === 0 ? (
                      <div className="text-center py-8 border rounded-lg bg-muted/10">
                        <CircleDollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-muted-foreground">No Loans Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          You don't have any {selectedTab !== "all" && selectedTab} loans.
                        </p>
                        <Button 
                          className="mt-4 gap-2"
                          onClick={() => setShowNewLoanForm(true)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Apply for a Loan
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredLoans().map((loan: Loan) => (
                          <div key={loan.id} className="border rounded-lg p-4">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${getLoanStatusColor(loan.status)}`}>
                                    {getLoanStatusIcon(loan.status)}
                                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                  </span>
                                </div>
                                <h3 className="text-lg font-medium">
                                  ₹{Number(loan.amount).toLocaleString()}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {loan.interestRate}% interest • {format(new Date(loan.startDate || new Date()), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="md:text-right mt-3 md:mt-0">
                                <div className="flex md:flex-col md:items-end gap-2">
                                  <p className="text-sm font-medium">
                                    Outstanding: ₹{Number(loan.outstandingAmount || 0).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Due by: {format(new Date(loan.endDate), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 text-sm">
                              <p className="text-muted-foreground">
                                Collateral: {
                                  (loan.collateralReceiptIds as any[])?.length || 0
                                } warehouse receipt{(loan.collateralReceiptIds as any[])?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {(loan.status === "active" || loan.status === "pending") && (
                                <LoanRepaymentButton
                                  loanId={loan.id}
                                  amount={Number(loan.amount)}
                                  outstandingAmount={loan.outstandingAmount}
                                  status={loan.status}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
