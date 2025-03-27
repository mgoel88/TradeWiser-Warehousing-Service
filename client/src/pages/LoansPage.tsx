import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReceiptCollateralLoanForm from "@/components/loans/ReceiptCollateralLoanForm";
import LoanRepaymentButton from "@/components/loans/LoanRepaymentButton";
import { PlusCircle, CreditCard, CircleDollarSign, Clock, Check, AlertCircle, BadgeIndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loan } from "@shared/schema";

export default function LoansPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("active");
  const [showNewLoanForm, setShowNewLoanForm] = useState(false);
  
  // Query to fetch loans
  const { data: loans, isLoading } = useQuery({
    queryKey: ['/api/loans'],
    retry: 1,
    staleTime: 30000
  });
  
  // Handle loan creation
  const handleLoanCreated = (loan: Loan) => {
    setShowNewLoanForm(false);
    toast({
      title: "Loan Application Submitted",
      description: `Your loan application for ₹${Number(loan.amount).toLocaleString()} has been submitted successfully.`,
    });
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
            onClick={() => setShowNewLoanForm(!showNewLoanForm)}
            className="gap-2"
          >
            {showNewLoanForm ? (
              "Cancel New Loan"
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Apply for New Loan
              </>
            )}
          </Button>
        </div>
        
        {showNewLoanForm ? (
          <div className="mb-8">
            <ReceiptCollateralLoanForm onLoanCreated={handleLoanCreated} />
          </div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeIndianRupee className="h-5 w-5 text-primary" />
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
              <TabsList>
                <TabsTrigger value="active">Active Loans</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="repaid">Repaid</TabsTrigger>
                <TabsTrigger value="all">All Loans</TabsTrigger>
              </TabsList>
              
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
