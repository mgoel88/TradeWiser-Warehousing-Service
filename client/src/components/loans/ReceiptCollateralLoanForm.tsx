import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckSquare2, DollarSign, AlertCircle, CreditCard, BadgeIndianRupee } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Receipt {
  id: number;
  receiptNumber: string;
  quantity: string;
  commodityName: string;
  warehouseName: string;
  marketValue: number;
  maxLendingValue: number;
  isSelected?: boolean;
}

interface ReceiptCollateralLoanFormProps {
  onSuccess?: () => void;
}

export function ReceiptCollateralLoanForm({ onSuccess }: ReceiptCollateralLoanFormProps) {
  const [selectedReceipts, setSelectedReceipts] = useState<Record<number, boolean>>({});
  const [initialDrawdown, setInitialDrawdown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch available collateral receipts
  const { data: availableCollateral = [], isLoading } = useQuery({
    queryKey: ['/api/receipts/available-collateral'],
  });

  // Calculate totals for selected receipts
  const selectedReceiptIds = Object.entries(selectedReceipts)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => parseInt(id));

  const selectedCollateral = availableCollateral.filter(
    (receipt: Receipt) => selectedReceiptIds.includes(receipt.id)
  );

  const totalCollateralValue = selectedCollateral.reduce(
    (sum: number, receipt: Receipt) => sum + receipt.marketValue,
    0
  );

  const totalMaxLending = selectedCollateral.reduce(
    (sum: number, receipt: Receipt) => sum + receipt.maxLendingValue,
    0
  );

  // Handle receipt selection
  const toggleReceiptSelection = (receiptId: number) => {
    setSelectedReceipts(prev => ({
      ...prev,
      [receiptId]: !prev[receiptId]
    }));
    
    // Reset drawdown if it exceeds new max after deselection
    if (selectedReceipts[receiptId] && initialDrawdown > totalMaxLending) {
      setInitialDrawdown(0);
    }
  };

  // Handle initial drawdown slider
  const handleDrawdownChange = (value: number[]) => {
    setInitialDrawdown(value[0]);
  };

  // Create overdraft loan mutation
  const createLoanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/loans/overdraft', {
        receiptIds: selectedReceiptIds,
        withdrawAmount: initialDrawdown > 0 ? initialDrawdown.toString() : undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts/available-collateral'] });
      
      toast({
        title: "Loan created successfully",
        description: data && data.maxLendingValue ? 
          `Your overdraft facility for ₹${Number(data.maxLendingValue).toLocaleString()} is now available` :
          "Your loan application has been submitted successfully",
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating loan",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReceiptIds.length === 0) {
      toast({
        title: "No receipts selected",
        description: "Please select at least one warehouse receipt as collateral",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    createLoanMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (availableCollateral.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-4">
        <CardHeader>
          <CardTitle>Loan Application</CardTitle>
          <CardDescription>Use your warehouse receipts as collateral</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No eligible collateral available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You don't have any active warehouse receipts that can be used as collateral. 
            Deposit commodities in a warehouse to get a receipt, or free up receipts that are 
            already being used as collateral.
          </p>
          <Button
            variant="outline" 
            className="mt-6"
            onClick={() => navigate('/green-channel')}
          >
            Create New Deposit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeIndianRupee className="h-5 w-5 text-primary" />
            Apply for a Loan
          </CardTitle>
          <CardDescription>
            Use your warehouse receipts as collateral to get a flexible credit line
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Step 1: Select collateral */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-2">Step 1: Select Your Collateral</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose one or more receipts to use as collateral for your loan
              </p>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto rounded-md border p-4">
                {availableCollateral.map((receipt: Receipt) => (
                  <motion.div
                    key={receipt.id}
                    whileHover={{ scale: 1.01 }}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedReceipts[receipt.id] ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => toggleReceiptSelection(receipt.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={!!selectedReceipts[receipt.id]} 
                          onCheckedChange={() => toggleReceiptSelection(receipt.id)}
                        />
                        <div>
                          <h4 className="font-medium">{receipt.receiptNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {receipt.quantity} of {receipt.commodityName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ₹{typeof receipt.maxLendingValue === 'number' ? 
                            receipt.maxLendingValue.toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Available credit</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Step 2: Configure loan */}
            <div className="md:col-span-2 pt-4">
              <h3 className="text-lg font-medium mb-2">Step 2: Set Loan Amount</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Decide how much of your available credit line you want to use now
              </p>
              
              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Total Collateral Value</h4>
                    <p className="text-xl font-semibold">₹{totalCollateralValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Available Credit Line</h4>
                    <p className="text-xl font-semibold text-primary">₹{totalMaxLending.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collateral Ratio:</span>
                    <span>80%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span>12.5% p.a.</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="drawdown" className="mb-2 block">
                    Initial Drawdown Amount:
                  </Label>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="drawdown"
                      type="number"
                      min={0}
                      max={totalMaxLending}
                      value={initialDrawdown}
                      onChange={(e) => setInitialDrawdown(Number(e.target.value))}
                      className="w-full text-lg"
                      placeholder="Enter amount to withdraw now"
                      disabled={selectedReceiptIds.length === 0}
                    />
                  </div>
                  
                  <Slider
                    value={[initialDrawdown]}
                    max={totalMaxLending}
                    step={1000}
                    onValueChange={handleDrawdownChange}
                    disabled={selectedReceiptIds.length === 0}
                    className="my-4"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹0</span>
                    <span>₹{totalMaxLending.toLocaleString()}</span>
                  </div>
                </div>
                
                <Alert variant="outline" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Flexible Credit Line</AlertTitle>
                  <AlertDescription>
                    You only pay interest on the amount you withdraw. The remaining credit is available anytime.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="p-3 rounded-lg bg-muted/50 w-full sm:w-auto">
            <div className="flex justify-between font-medium">
              <span className="mr-4">Initial Drawdown:</span>
              <span>₹{initialDrawdown.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1 text-muted-foreground text-sm">
              <span className="mr-4">Available Credit:</span>
              <span>₹{(totalMaxLending - initialDrawdown).toLocaleString()}</span>
            </div>
          </div>
          
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={selectedReceiptIds.length === 0 || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Apply for Loan
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}