import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  BadgeIndianRupee, 
  FileCheck, 
  Percent, 
  Calendar, 
  Link, 
  FileText,
  ShieldCheck,
  LockKeyhole,
  Clock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { recordLoanCollateralization } from "@/lib/blockchainUtils";
import { WarehouseReceipt, Loan } from "@shared/schema";
import { format, addMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReceiptCollateralLoanFormProps {
  onLoanCreated?: (loan: Loan) => void;
}

export default function ReceiptCollateralLoanForm({
  onLoanCreated
}: ReceiptCollateralLoanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for loan details
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("12");
  const [loanDuration, setLoanDuration] = useState(6); // months
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loanSummary, setLoanSummary] = useState<{
    principal: string;
    totalInterest: string;
    monthlyPayment: string;
    totalPayment: string;
    endDate: Date;
  } | null>(null);

  // Query to fetch the user's receipts that can be used as collateral
  const { data: receipts, isLoading: isLoadingReceipts } = useQuery({
    queryKey: ['/api/receipts/available-collateral'],
    retry: 1, 
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Calculate total value of selected receipts
  const calculateTotalCollateralValue = () => {
    if (!receipts) return 0;
    
    return receipts
      .filter((receipt: WarehouseReceipt) => selectedReceipts.includes(receipt.id))
      .reduce((sum: number, receipt: WarehouseReceipt) => sum + Number(receipt.valuation || 0), 0);
  };

  // Calculate maximum available loan amount (typically 70-80% of collateral value)
  const maxLoanAmount = calculateTotalCollateralValue() * 0.7;

  // Calculate loan summary when inputs change
  useEffect(() => {
    if (loanAmount && !isNaN(parseFloat(loanAmount)) && parseFloat(loanAmount) > 0) {
      const principal = parseFloat(loanAmount);
      const monthlyInterestRate = parseFloat(interestRate) / 100 / 12;
      const numberOfPayments = loanDuration;
      
      // Calculate monthly payment using standard loan formula
      const monthlyPayment = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) /
                            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      
      const totalPayment = monthlyPayment * numberOfPayments;
      const totalInterest = totalPayment - principal;
      
      // Calculate end date
      const endDate = addMonths(new Date(), loanDuration);
      
      setLoanSummary({
        principal: principal.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        monthlyPayment: monthlyPayment.toFixed(2),
        totalPayment: totalPayment.toFixed(2),
        endDate
      });
    } else {
      setLoanSummary(null);
    }
  }, [loanAmount, interestRate, loanDuration]);

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: async (loanData: any) => {
      setIsProcessing(true);
      
      try {
        // First record on blockchain
        const blockchainRecord = await recordLoanCollateralization(
          0, // Temporary ID, will be replaced with actual ID from response
          loanData.userId,
          loanData.collateralReceiptIds,
          loanData.amount
        );
        
        // Then create loan in our system
        const response = await apiRequest("POST", "/api/loans", {
          ...loanData,
          blockchainHash: blockchainRecord.transactionHash
        });
        
        if (!response.ok) {
          throw new Error("Failed to create loan");
        }
        
        return await response.json();
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Loan Created",
        description: `Your loan of ₹${loanAmount} has been created successfully.`,
      });
      
      if (onLoanCreated) {
        onLoanCreated(data);
      }
      
      // Reset form
      setLoanAmount("");
      setInterestRate("12");
      setLoanDuration(6);
      setSelectedReceipts([]);
      setTermsAccepted(false);
    },
    onError: (error) => {
      toast({
        title: "Loan Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create loan",
        variant: "destructive",
      });
    }
  });

  const handleCreateLoan = async () => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (selectedReceipts.length === 0) {
      toast({
        title: "Collateral Required",
        description: "Please select at least one warehouse receipt as collateral.",
        variant: "destructive",
      });
      return;
    }

    if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
      toast({
        title: "Invalid Loan Amount",
        description: "Please enter a valid loan amount.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(loanAmount) > maxLoanAmount) {
      toast({
        title: "Loan Amount Too High",
        description: `The maximum loan amount based on your collateral is ₹${maxLoanAmount.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    // Create repayment schedule
    const repaymentSchedule = [];
    if (loanSummary) {
      const monthlyPayment = parseFloat(loanSummary.monthlyPayment);
      let remainingPrincipal = parseFloat(loanSummary.principal);
      const monthlyInterestRate = parseFloat(interestRate) / 100 / 12;
      
      for (let i = 1; i <= loanDuration; i++) {
        const interestPayment = remainingPrincipal * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingPrincipal -= principalPayment;
        
        repaymentSchedule.push({
          paymentNumber: i,
          dueDate: format(addMonths(new Date(), i), 'yyyy-MM-dd'),
          paymentAmount: monthlyPayment.toFixed(2),
          principalPayment: principalPayment.toFixed(2),
          interestPayment: interestPayment.toFixed(2),
          remainingPrincipal: Math.max(0, remainingPrincipal).toFixed(2),
          status: 'pending'
        });
      }
    }

    // Prepare loan data
    const loanData = {
      amount: loanAmount,
      interestRate,
      collateralReceiptIds: selectedReceipts,
      endDate: loanSummary ? loanSummary.endDate.toISOString() : addMonths(new Date(), loanDuration).toISOString(),
      repaymentSchedule,
      outstandingAmount: loanAmount,
      status: "pending"
    };

    // Create loan
    createLoanMutation.mutate(loanData);
  };

  // Toggle receipt selection
  const toggleReceiptSelection = (receiptId: number) => {
    if (selectedReceipts.includes(receiptId)) {
      setSelectedReceipts(selectedReceipts.filter(id => id !== receiptId));
    } else {
      setSelectedReceipts([...selectedReceipts, receiptId]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeIndianRupee className="h-5 w-5 text-primary" />
          Apply for Commodity-Backed Loan
        </CardTitle>
        <CardDescription>
          Use your warehouse receipts as collateral to get a low-interest loan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collateral Selection */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select Collateral</h3>
          <p className="text-sm text-muted-foreground">
            Choose warehouse receipts to use as collateral for your loan.
          </p>
          
          {isLoadingReceipts ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : receipts && receipts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Valuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt: WarehouseReceipt) => (
                    <TableRow key={receipt.id} className={selectedReceipts.includes(receipt.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReceipts.includes(receipt.id)}
                          onCheckedChange={() => toggleReceiptSelection(receipt.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                      <TableCell>{receipt.commodityName || "Commodity"}</TableCell>
                      <TableCell>{receipt.quantity} MT</TableCell>
                      <TableCell className="text-right">₹{Number(receipt.valuation).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Eligible Receipts</AlertTitle>
              <AlertDescription>
                You don't have any warehouse receipts available to use as collateral. 
                Deposit commodities to get warehouse receipts.
              </AlertDescription>
            </Alert>
          )}
          
          {selectedReceipts.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Collateral Value:</span>
                <span className="font-semibold">₹{calculateTotalCollateralValue().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium">Maximum Loan Amount (70%):</span>
                <span className="font-semibold text-primary">₹{maxLoanAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Loan Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Loan Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount (₹)</Label>
              <div className="relative">
                <BadgeIndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="Enter loan amount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="pl-10"
                  min={1000}
                  max={maxLoanAmount}
                  disabled={selectedReceipts.length === 0}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum loan amount is 70% of collateral value.
              </p>
            </div>
            
            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="interestRate"
                  type="number"
                  placeholder="Interest rate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="pl-10"
                  min={6}
                  max={18}
                  step={0.5}
                  disabled={selectedReceipts.length === 0}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Annual interest rate (APR).
              </p>
            </div>
          </div>
          
          {/* Loan Duration Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="loanDuration">Loan Duration</Label>
              <span className="text-sm font-medium">{loanDuration} months</span>
            </div>
            <Slider
              id="loanDuration"
              min={1}
              max={24}
              step={1}
              value={[loanDuration]}
              onValueChange={(value) => setLoanDuration(value[0])}
              disabled={selectedReceipts.length === 0}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 month</span>
              <span>12 months</span>
              <span>24 months</span>
            </div>
          </div>
        </div>
        
        {/* Loan Summary */}
        {loanSummary && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Loan Summary</TabsTrigger>
              <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Principal Amount</p>
                  <p className="text-lg font-semibold">₹{parseFloat(loanSummary.principal).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Interest</p>
                  <p className="text-lg font-semibold">₹{parseFloat(loanSummary.totalInterest).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Payment</p>
                  <p className="text-lg font-semibold">₹{parseFloat(loanSummary.monthlyPayment).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Repayment</p>
                  <p className="text-lg font-semibold">₹{parseFloat(loanSummary.totalPayment).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Loan End Date</span>
                </div>
                <span className="font-medium">{format(loanSummary.endDate, 'MMMM d, yyyy')}</span>
              </div>
            </TabsContent>
            <TabsContent value="schedule" className="pt-4">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: loanDuration }).map((_, index) => {
                      const month = index + 1;
                      const date = format(addMonths(new Date(), month), 'MMM d, yyyy');
                      const payment = parseFloat(loanSummary.monthlyPayment);
                      const totalInterest = parseFloat(loanSummary.totalInterest) / loanDuration;
                      const principal = payment - totalInterest;
                      const balance = parseFloat(loanSummary.principal) - (principal * month);
                      
                      return (
                        <TableRow key={month}>
                          <TableCell>{month}</TableCell>
                          <TableCell>{date}</TableCell>
                          <TableCell className="text-right">₹{payment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{principal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{totalInterest.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{Math.max(0, balance).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Blockchain Security Information */}
        <div className="rounded-lg border p-4 bg-muted/20">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Blockchain Security Protection
          </h4>
          <p className="text-sm text-muted-foreground">
            This loan will be secured on blockchain technology, providing tamper-proof records 
            of collateralization and ownership. All transactions are cryptographically signed 
            and permanently recorded.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <LockKeyhole className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Funds are released after blockchain verification (typically &lt; 2 minutes)
            </p>
          </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="space-y-2">
          <div className="flex items-top space-x-2">
            <Checkbox 
              id="terms"
              checked={termsAccepted}
              onCheckedChange={() => setTermsAccepted(!termsAccepted)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept terms and conditions
              </label>
              <p className="text-xs text-muted-foreground">
                I agree to the terms of service, including collateral forfeiture in case of loan default.
                I understand that my warehouse receipt will be locked until the loan is fully repaid.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button 
          onClick={handleCreateLoan} 
          disabled={
            isProcessing || 
            selectedReceipts.length === 0 || 
            !loanAmount || 
            !termsAccepted ||
            parseFloat(loanAmount) > maxLoanAmount
          }
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              Apply for Loan
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}