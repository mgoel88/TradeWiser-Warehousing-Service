import { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CreditCard,
  CheckCircle,
  Receipt,
  IndianRupee,
  Shield,
  AlertCircle,
  PlusCircle,
  FileText,
  Calendar,
  User,
  Building2,
  Percent
} from "lucide-react";
import { format } from "date-fns";

interface EligibleReceipt {
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

interface LoanTerms {
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalAmount: number;
  totalInterest: number;
  processingFee: number;
}

interface BankDetails {
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
}

interface LoanApplication {
  selectedReceiptIds: number[];
  requestedAmount: number;
  bankDetails: BankDetails;
  loanTerms: LoanTerms;
}

const STEPS = [
  { id: 1, title: "Select Receipt", description: "Choose warehouse receipts as collateral" },
  { id: 2, title: "Enter Amount", description: "Calculate loan amount and terms" },
  { id: 3, title: "Bank Details", description: "Provide disbursement details" },
  { id: 4, title: "Confirmation", description: "Review and submit application" }
];

const INTEREST_RATE = 12; // 12% annual interest rate
const LTV_RATIO = 0.8; // 80% Loan-to-Value ratio
const MIN_LOAN_AMOUNT = 10000; // Minimum ₹10,000

// EMI calculation utility
const calculateEMI = (principal: number, rate: number, tenure: number): number => {
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi);
};

export default function LoansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<number[]>([]);
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [loanTerms, setLoanTerms] = useState<LoanTerms | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: ""
  });

  // Fetch eligible receipts
  const { data: eligibleReceiptsData, isLoading: isLoadingReceipts } = useQuery({
    queryKey: ['/api/loans/eligible-collateral'],
    retry: 1,
    staleTime: 30000
  });

  // Calculate loan terms when amount changes
  useEffect(() => {
    if (requestedAmount && parseFloat(requestedAmount) >= MIN_LOAN_AMOUNT) {
      const amount = parseFloat(requestedAmount);
      const monthlyEMI = calculateEMI(amount, INTEREST_RATE, 12);
      const totalAmount = monthlyEMI * 12;
      const totalInterest = totalAmount - amount;
      const processingFee = amount * 0.005; // 0.5% processing fee

      setLoanTerms({
        loanAmount: amount,
        interestRate: INTEREST_RATE,
        tenureMonths: 12,
        monthlyEMI,
        totalAmount,
        totalInterest,
        processingFee
      });
    } else {
      setLoanTerms(null);
    }
  }, [requestedAmount]);

  // Calculate maximum available loan amount
  const maxAvailableLoan = useMemo(() => {
    if (!eligibleReceiptsData?.eligibleCollateral) return 0;
    
    return selectedReceiptIds.reduce((total, receiptId) => {
      const receipt = eligibleReceiptsData.eligibleCollateral.find((r: EligibleReceipt) => r.id === receiptId);
      return total + (receipt?.maxLoanAmount || 0);
    }, 0);
  }, [selectedReceiptIds, eligibleReceiptsData]);

  // Submit loan application
  const submitLoanMutation = useMutation({
    mutationFn: async (application: LoanApplication) => {
      const response = await apiRequest("/api/loans/apply", "POST", {
        receiptIds: application.selectedReceiptIds,
        requestedAmount: application.requestedAmount,
        tenureMonths: 12,
        purpose: "Working Capital",
        bankDetails: application.bankDetails,
        loanTerms: application.loanTerms
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Loan application failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Loan Approved! 🎉",
        description: `Your loan of ₹${requestedAmount} has been approved and will be disbursed within 24 hours.`,
      });
      
      // Reset form
      setCurrentStep(1);
      setSelectedReceiptIds([]);
      setRequestedAmount("");
      setBankDetails({
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: ""
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Step navigation
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle receipt selection
  const handleReceiptToggle = (receiptId: number, checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds(prev => [...prev, receiptId]);
    } else {
      setSelectedReceiptIds(prev => prev.filter(id => id !== receiptId));
    }
  };

  // Validation functions
  const isStep1Valid = () => selectedReceiptIds.length > 0;
  const isStep2Valid = () => {
    const amount = parseFloat(requestedAmount);
    return amount >= MIN_LOAN_AMOUNT && amount <= maxAvailableLoan && loanTerms !== null;
  };
  const isStep3Valid = () => {
    return bankDetails.accountNumber &&
           bankDetails.confirmAccountNumber &&
           bankDetails.accountNumber === bankDetails.confirmAccountNumber &&
           bankDetails.ifscCode &&
           bankDetails.ifscCode.length === 11 &&
           bankDetails.accountHolderName &&
           bankDetails.bankName;
  };

  // Handle bank details change
  const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  // Submit application
  const handleSubmit = () => {
    if (!isStep3Valid() || !loanTerms) return;
    
    const application: LoanApplication = {
      selectedReceiptIds,
      requestedAmount: parseFloat(requestedAmount),
      bankDetails,
      loanTerms
    };
    
    submitLoanMutation.mutate(application);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Commodity-Backed Loans</h1>
          <p className="text-gray-600 mt-2">
            Get instant loans using your warehouse receipts as collateral with competitive rates
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-20 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-medium">{STEPS[currentStep - 1].title}</h3>
            <p className="text-sm text-gray-600">{STEPS[currentStep - 1].description}</p>
          </div>
          <Progress value={(currentStep / 4) * 100} className="mt-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Receipts */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Select Warehouse Receipts
                </CardTitle>
                <CardDescription>
                  Choose eligible warehouse receipts to use as collateral. Up to 80% of receipt value available as loan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReceipts ? (
                  <div className="text-center py-8">Loading eligible receipts...</div>
                ) : !eligibleReceiptsData?.eligibleCollateral?.length ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Eligible Receipts</h3>
                    <p className="text-gray-600 mb-4">
                      You need active warehouse receipts to apply for loans. Create a deposit first.
                    </p>
                    <Button onClick={() => window.location.href = '/deposits/new'}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New Deposit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedReceiptIds.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">Selected Receipts Summary</h4>
                            <p className="text-sm text-blue-700">
                              {selectedReceiptIds.length} receipts selected • 
                              Max loan available: ₹{maxAvailableLoan.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {LTV_RATIO * 100}% LTV
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {eligibleReceiptsData.eligibleCollateral.map((receipt: EligibleReceipt) => (
                        <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedReceiptIds.includes(receipt.id)}
                              onCheckedChange={(checked) => handleReceiptToggle(receipt.id, !!checked)}
                              data-testid={`checkbox-receipt-${receipt.id}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium" data-testid={`receipt-number-${receipt.id}`}>
                                    {receipt.receiptNumber}
                                  </h4>
                                  {receipt.blockchainVerified && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600" data-testid={`max-loan-${receipt.id}`}>
                                    ₹{receipt.maxLoanAmount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">Max loan amount</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Commodity</p>
                                  <p className="font-medium">{receipt.commodityName}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Quantity</p>
                                  <p className="font-medium">{receipt.quantity} {receipt.measurementUnit}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Quality Grade</p>
                                  <p className="font-medium">{receipt.qualityGrade}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Receipt Value</p>
                                  <p className="font-medium">₹{receipt.receiptValue.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Enter Amount */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Loan Amount & Terms
                  </CardTitle>
                  <CardDescription>
                    Enter your desired loan amount and review the calculated terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="loan-amount">Requested Loan Amount (₹)</Label>
                        <Input
                          id="loan-amount"
                          type="number"
                          value={requestedAmount}
                          onChange={(e) => setRequestedAmount(e.target.value)}
                          placeholder="Enter amount"
                          min={MIN_LOAN_AMOUNT}
                          max={maxAvailableLoan}
                          data-testid="input-loan-amount"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>Min: ₹{MIN_LOAN_AMOUNT.toLocaleString()}</span>
                          <span>Max: ₹{maxAvailableLoan.toLocaleString()}</span>
                        </div>
                      </div>

                      {parseFloat(requestedAmount) > 0 && parseFloat(requestedAmount) < MIN_LOAN_AMOUNT && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Minimum loan amount is ₹{MIN_LOAN_AMOUNT.toLocaleString()}
                        </div>
                      )}

                      {parseFloat(requestedAmount) > maxAvailableLoan && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Amount exceeds maximum available loan
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Loan Parameters</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Interest Rate</p>
                          <p className="font-medium flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            {INTEREST_RATE}% per annum
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Loan Tenure</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            12 months
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">LTV Ratio</p>
                          <p className="font-medium">{LTV_RATIO * 100}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Processing Fee</p>
                          <p className="font-medium">0.5%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Terms Summary */}
              {loanTerms && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">Loan Terms Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-700" data-testid="monthly-emi">
                          ₹{loanTerms.monthlyEMI.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">Monthly EMI</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium">₹{loanTerms.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Amount</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium">₹{loanTerms.totalInterest.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Interest</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium">₹{Math.round(loanTerms.processingFee).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Processing Fee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Bank Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Bank Details for Disbursement
                </CardTitle>
                <CardDescription>
                  Provide your bank account details for loan disbursement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="account-holder-name">Account Holder Name *</Label>
                      <Input
                        id="account-holder-name"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                        placeholder="Enter full name as per bank records"
                        data-testid="input-account-holder-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bank-name">Bank Name *</Label>
                      <Select value={bankDetails.bankName} onValueChange={(value) => handleBankDetailsChange('bankName', value)}>
                        <SelectTrigger data-testid="select-bank-name">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SBI">State Bank of India</SelectItem>
                          <SelectItem value="HDFC">HDFC Bank</SelectItem>
                          <SelectItem value="ICICI">ICICI Bank</SelectItem>
                          <SelectItem value="AXIS">Axis Bank</SelectItem>
                          <SelectItem value="BOI">Bank of India</SelectItem>
                          <SelectItem value="PNB">Punjab National Bank</SelectItem>
                          <SelectItem value="BOB">Bank of Baroda</SelectItem>
                          <SelectItem value="CANARA">Canara Bank</SelectItem>
                          <SelectItem value="UNION">Union Bank of India</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ifsc-code">IFSC Code *</Label>
                      <Input
                        id="ifsc-code"
                        value={bankDetails.ifscCode}
                        onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value.toUpperCase())}
                        placeholder="e.g., SBIN0001234"
                        maxLength={11}
                        data-testid="input-ifsc-code"
                      />
                      {bankDetails.ifscCode && bankDetails.ifscCode.length !== 11 && (
                        <p className="text-red-600 text-sm mt-1">IFSC code must be 11 characters</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="account-number">Account Number *</Label>
                      <Input
                        id="account-number"
                        type="number"
                        value={bankDetails.accountNumber}
                        onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                        placeholder="Enter account number"
                        data-testid="input-account-number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-account-number">Confirm Account Number *</Label>
                      <Input
                        id="confirm-account-number"
                        type="number"
                        value={bankDetails.confirmAccountNumber}
                        onChange={(e) => handleBankDetailsChange('confirmAccountNumber', e.target.value)}
                        placeholder="Re-enter account number"
                        data-testid="input-confirm-account-number"
                      />
                      {bankDetails.confirmAccountNumber && bankDetails.accountNumber !== bankDetails.confirmAccountNumber && (
                        <p className="text-red-600 text-sm mt-1">Account numbers do not match</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Important Notes:</h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Ensure account holder name matches your KYC documents</li>
                        <li>• Account should be active and operational</li>
                        <li>• Loan will be disbursed within 24 hours of approval</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && loanTerms && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Review Application
                  </CardTitle>
                  <CardDescription>
                    Please review all details before submitting your loan application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Receipts */}
                  <div>
                    <h4 className="font-medium mb-3">Selected Collateral</h4>
                    <div className="grid gap-2">
                      {selectedReceiptIds.map(receiptId => {
                        const receipt = eligibleReceiptsData?.eligibleCollateral?.find((r: EligibleReceipt) => r.id === receiptId);
                        return receipt ? (
                          <div key={receiptId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{receipt.receiptNumber}</span>
                            <span className="text-sm font-medium">₹{receipt.maxLoanAmount.toLocaleString()}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Loan Terms */}
                  <div>
                    <h4 className="font-medium mb-3">Loan Terms</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Loan Amount:</span>
                        <span className="font-medium">₹{loanTerms.loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Rate:</span>
                        <span className="font-medium">{loanTerms.interestRate}% p.a.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tenure:</span>
                        <span className="font-medium">{loanTerms.tenureMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span className="font-medium">₹{Math.round(loanTerms.processingFee).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between col-span-2 text-lg font-bold border-t pt-2">
                        <span>Monthly EMI:</span>
                        <span>₹{loanTerms.monthlyEMI.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Bank Details */}
                  <div>
                    <h4 className="font-medium mb-3">Disbursement Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Account Holder:</span>
                        <span className="font-medium">{bankDetails.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bank:</span>
                        <span className="font-medium">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account Number:</span>
                        <span className="font-medium">***{bankDetails.accountNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IFSC Code:</span>
                        <span className="font-medium">{bankDetails.ifscCode}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-2">Terms & Conditions:</p>
                      <ul className="text-yellow-800 space-y-1">
                        <li>• I agree to the loan terms and conditions</li>
                        <li>• The selected warehouse receipts will be pledged as collateral</li>
                        <li>• EMI will be auto-debited from the provided account</li>
                        <li>• Loan will be disbursed within 24 hours of approval</li>
                        <li>• Interest rate is fixed for the entire tenure</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 && !isStep2Valid()) ||
                    (currentStep === 3 && !isStep3Valid())
                  }
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid() || submitLoanMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-submit"
                >
                  {submitLoanMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}