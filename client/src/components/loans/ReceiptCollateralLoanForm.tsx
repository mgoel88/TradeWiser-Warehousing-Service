import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckSquare2, DollarSign, AlertCircle, CreditCard } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
        description: `Your overdraft facility for ₹${data.maxLendingValue.toLocaleString()} is now available`,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Select Collateral</CardTitle>
              <CardDescription>
                Choose the warehouse receipts you want to use as collateral
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableCollateral.map((receipt: Receipt) => (
                  <motion.div
                    key={receipt.id}
                    whileHover={{ scale: 1.01 }}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      selectedReceipts[receipt.id] ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => toggleReceiptSelection(receipt.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-base">{receipt.receiptNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {receipt.quantity} of {receipt.commodityName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stored at: {receipt.warehouseName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{receipt.marketValue.toLocaleString()}</div>
                        <div className="text-sm text-primary">
                          Loan value: ₹{receipt.maxLendingValue.toLocaleString()}
                        </div>
                        {selectedReceipts[receipt.id] && (
                          <CheckSquare2 className="h-5 w-5 text-primary ml-auto mt-2" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="w-full sticky top-4">
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
              <CardDescription>Overdraft credit facility details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Collateral Value:</span>
                  <span className="font-medium">₹{totalCollateralValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span className="text-sm">Available Credit Limit:</span>
                  <span className="font-medium">₹{totalMaxLending.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Collateral Ratio:</span>
                  <span>80%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Interest Rate:</span>
                  <span>12.5% p.a.</span>
                </div>

                <Separator className="my-4" />

                <div>
                  <Label htmlFor="drawdown" className="mb-2 block">
                    Initial Drawdown Amount:
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="drawdown"
                      type="number"
                      min={0}
                      max={totalMaxLending}
                      value={initialDrawdown}
                      onChange={(e) => setInitialDrawdown(Number(e.target.value))}
                      className="w-full"
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

                <div className="mt-6 p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between font-medium">
                    <span>Initial Drawdown:</span>
                    <span>₹{initialDrawdown.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-muted-foreground text-sm">
                    <span>Remaining Credit:</span>
                    <span>₹{(totalMaxLending - initialDrawdown).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={selectedReceiptIds.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Create Overdraft Facility
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}