import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  Receipt, 
  CreditCard, 
  Calculator, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Percent
} from 'lucide-react';

interface EligibleReceipt {
  id: number;
  receiptNumber: string;
  commodityName: string;
  quantity: string;
  measurementUnit: string;
  valuation: string;
  collateralUsed: string;
  availableLoanAmount: number;
}

interface LoanFormData {
  receiptId: string;
  amount: string;
  durationMonths: string;
}

const StreamlinedLoanApplication = () => {
  const { toast } = useToast();
  const [selectedReceipt, setSelectedReceipt] = useState<EligibleReceipt | null>(null);
  const [loanForm, setLoanForm] = useState<LoanFormData>({
    receiptId: '',
    amount: '',
    durationMonths: '12'
  });
  const [calculatedEMI, setCalculatedEMI] = useState(0);

  // Fetch eligible receipts
  const { data: eligibleReceipts, isLoading: receiptsLoading, error } = useQuery<EligibleReceipt[]>({
    queryKey: ['/api/receipts/eligible-for-loans'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Loan application mutation
  const loanMutation = useMutation({
    mutationFn: async (loanData: LoanFormData) => {
      const response = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiptId: parseInt(loanData.receiptId),
          amount: loanData.amount,
          durationMonths: parseInt(loanData.durationMonths)
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Loan Approved!",
          description: data.data.message,
          duration: 5000
        });
        
        // Reset form and refresh data
        setLoanForm({ receiptId: '', amount: '', durationMonths: '12' });
        setSelectedReceipt(null);
        queryClient.invalidateQueries({ queryKey: ['/api/receipts/eligible-for-loans'] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      } else {
        toast({
          title: "❌ Loan Application Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "❌ Application Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate EMI when form changes
  useEffect(() => {
    if (loanForm.amount && loanForm.durationMonths) {
      const principal = parseFloat(loanForm.amount);
      const months = parseInt(loanForm.durationMonths);
      const monthlyRate = 0.12 / 12; // 12% annual rate
      
      if (principal > 0 && months > 0) {
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                   (Math.pow(1 + monthlyRate, months) - 1);
        setCalculatedEMI(emi);
      } else {
        setCalculatedEMI(0);
      }
    }
  }, [loanForm.amount, loanForm.durationMonths]);

  // Handle receipt selection
  const handleReceiptSelect = (receiptId: string) => {
    const receipt = eligibleReceipts?.find(r => r.id.toString() === receiptId);
    setSelectedReceipt(receipt || null);
    setLoanForm(prev => ({
      ...prev,
      receiptId,
      amount: receipt ? Math.floor(receipt.availableLoanAmount).toString() : ''
    }));
  };

  // Handle loan application
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || !loanForm.amount || !loanForm.durationMonths) {
      toast({
        title: "❌ Invalid Form",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    loanMutation.mutate(loanForm);
  };

  if (receiptsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load receipts</h3>
        <p className="text-gray-600 mb-6">Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const receipts = eligibleReceipts || [];

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Eligible Receipts</h3>
        <p className="text-gray-600 mb-6">
          You need active warehouse receipts to apply for loans. Deposit commodities first.
        </p>
        <Button className="bg-green-600 hover:bg-green-700">
          <Receipt className="w-4 h-4 mr-2" />
          Deposit Commodity
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loan Application Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apply for Loan</h2>
              <p className="text-gray-600">Get instant loans against your commodity receipts</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Interest Rate</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">12%</div>
              <div className="text-sm text-blue-700">per annum</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">LTV Ratio</span>
              </div>
              <div className="text-2xl font-bold text-green-600">80%</div>
              <div className="text-sm text-green-700">of commodity value</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Processing</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">Instant</div>
              <div className="text-sm text-purple-700">approval</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Select Receipt ({receipts.length} available)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={loanForm.receiptId} onValueChange={handleReceiptSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a receipt to use as collateral" />
              </SelectTrigger>
              <SelectContent>
                {receipts.map((receipt) => (
                  <SelectItem key={receipt.id} value={receipt.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{receipt.commodityName}</div>
                        <div className="text-sm text-gray-500">
                          {parseFloat(receipt.quantity).toFixed(2)} {receipt.measurementUnit} • {receipt.receiptNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          ₹{receipt.availableLoanAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">available</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedReceipt && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Selected Receipt Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commodity Value:</span>
                    <span className="font-medium">₹{parseFloat(selectedReceipt.valuation).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Already Used:</span>
                    <span className="font-medium">₹{parseFloat(selectedReceipt.collateralUsed || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Available:</span>
                    <span className="font-medium text-green-600">₹{selectedReceipt.availableLoanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LTV Ratio:</span>
                    <span className="font-medium">80%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount *
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={loanForm.amount}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, amount: e.target.value }))}
                  max={selectedReceipt?.availableLoanAmount || undefined}
                  min="1000"
                  step="100"
                  required
                />
                {selectedReceipt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum: ₹{selectedReceipt.availableLoanAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <Select 
                  value={loanForm.durationMonths} 
                  onValueChange={(value) => setLoanForm(prev => ({ ...prev, durationMonths: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months (Recommended)</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calculatedEMI > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Loan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Monthly EMI:</span>
                      <span className="font-medium text-blue-900">₹{Math.round(calculatedEMI).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Interest:</span>
                      <span className="font-medium text-blue-900">
                        ₹{Math.round((calculatedEMI * parseInt(loanForm.durationMonths)) - parseFloat(loanForm.amount)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Payable:</span>
                      <span className="font-medium text-blue-900">
                        ₹{Math.round(calculatedEMI * parseInt(loanForm.durationMonths)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loanMutation.isPending || !selectedReceipt || !loanForm.amount}
              >
                {loanMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Application...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Apply for Loan
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamlinedLoanApplication;