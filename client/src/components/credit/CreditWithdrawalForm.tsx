import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  CreditCard, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Building,
  User,
  Hash,
  IndianRupee,
  Plus
} from 'lucide-react';

interface CreditInfo {
  totalCollateralValue: number;
  maxEligibleCredit: number;
  outstandingBalance: number;
  availableCredit: number;
  utilizationPercentage: number;
  interestRate: number;
  processingTime: string;
  minimumWithdrawal: number;
  maximumWithdrawal: number;
}

interface BankAccount {
  id: number;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  isDefault: boolean;
  isVerified: boolean;
}

const withdrawalSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    }, 'Please enter a valid positive amount')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 1000;
    }, 'Minimum withdrawal amount is ₹1,000'),
  bankAccountId: z.string()
    .min(1, 'Please select a bank account')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    }, 'Please select a valid bank account'),
  purpose: z.string().optional()
});

const bankAccountSchema = z.object({
  accountNumber: z.string()
    .min(8, 'Account number must be at least 8 characters')
    .max(18, 'Account number must be at most 18 characters'),
  ifscCode: z.string()
    .min(11, 'IFSC code must be 11 characters')
    .max(11, 'IFSC code must be 11 characters')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  accountHolderName: z.string()
    .min(2, 'Account holder name is required')
    .max(100, 'Account holder name is too long'),
  bankName: z.string()
    .min(2, 'Bank name is required')
    .max(100, 'Bank name is too long'),
  branchName: z.string().optional(),
  accountType: z.enum(['savings', 'current']).default('savings')
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
type BankAccountFormData = z.infer<typeof bankAccountSchema>;

const CreditWithdrawalForm = () => {
  const { toast } = useToast();
  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

  // Forms
  const withdrawalForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '',
      bankAccountId: '',
      purpose: 'Working Capital'
    }
  });

  const bankAccountForm = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: '',
      branchName: '',
      accountType: 'savings'
    }
  });

  // Fetch available credit
  const { data: creditInfo, isLoading: creditLoading, error: creditError } = useQuery<{success: boolean; data: CreditInfo}>({
    queryKey: ['/api/credit/available']
  });

  // Fetch bank accounts
  const { data: bankAccountsResponse, isLoading: bankAccountsLoading, refetch: refetchBankAccounts } = useQuery<{success: boolean; data: BankAccount[]}>({
    queryKey: ['/api/credit/bank-accounts']
  });

  const bankAccounts = bankAccountsResponse?.data || [];

  // Create bank account mutation
  const createBankAccountMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      const response = await fetch('/api/credit/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Bank Account Added",
        description: "Your bank account has been added successfully!",
      });
      setShowBankForm(false);
      bankAccountForm.reset();
      refetchBankAccounts();
      queryClient.invalidateQueries({ queryKey: ['/api/credit/bank-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account",
        variant: "destructive",
      });
    }
  });

  // Withdrawal mutation with enhanced validation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      // Additional client-side validation before submission
      const amount = parseFloat(data.amount);
      const bankAccountId = parseInt(data.bankAccountId);
      
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }
      
      if (isNaN(bankAccountId) || !isFinite(bankAccountId) || bankAccountId <= 0) {
        throw new Error('Invalid bank account selection');
      }
      
      // Verify bank account exists in current list
      const selectedAccount = bankAccounts.find(acc => acc.id === bankAccountId);
      if (!selectedAccount) {
        throw new Error('Selected bank account is no longer available');
      }
      
      if (!selectedAccount.isVerified) {
        throw new Error('Selected bank account is not verified');
      }
      
      // Check if amount exceeds available credit (client-side pre-check)
      if (creditInfo?.data && amount > creditInfo.data.availableCredit) {
        throw new Error(`Amount exceeds available credit limit of ₹${creditInfo.data.availableCredit.toLocaleString()}`);
      }
      
      const response = await fetch('/api/credit/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          bankAccountId,
          purpose: data.purpose
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Successful!",
        description: data.data.message,
      });
      withdrawalForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/credit/available'] });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  });

  const onBankAccountSubmit = (data: BankAccountFormData) => {
    createBankAccountMutation.mutate(data);
  };

  const onWithdrawalSubmit = (data: WithdrawalFormData) => {
    // Final validation before submission
    if (bankAccounts.length === 0) {
      toast({
        title: "No Bank Accounts",
        description: "Please add a bank account before making a withdrawal.",
        variant: "destructive"
      });
      return;
    }
    
    const selectedAccountId = parseInt(data.bankAccountId);
    const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);
    
    if (!selectedAccount) {
      toast({
        title: "Invalid Selection",
        description: "Please select a valid bank account.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedAccount.isVerified) {
      toast({
        title: "Account Not Verified",
        description: "The selected bank account is not verified. Please choose a verified account.",
        variant: "destructive"
      });
      return;
    }
    
    withdrawalMutation.mutate(data);
  };

  if (creditLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading credit information...</span>
        </CardContent>
      </Card>
    );
  }

  if (creditError || !creditInfo?.success) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-red-600">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Failed to load credit information</span>
        </CardContent>
      </Card>
    );
  }

  const credit = creditInfo.data;

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <Card data-testid="credit-overview-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Credit Line Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg" data-testid="available-credit">
              <div className="text-3xl font-bold text-green-600">
                ₹{credit.availableCredit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Available Credit</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-semibold text-blue-600">
                ₹{credit.maxEligibleCredit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Credit Limit</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-semibold text-orange-600">
                {credit.utilizationPercentage}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Utilization</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-medium">{credit.interestRate}% per annum</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Time:</span>
              <span className="font-medium">{credit.processingTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum Withdrawal:</span>
              <span className="font-medium">₹{credit.minimumWithdrawal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collateral Value:</span>
              <span className="font-medium">₹{credit.totalCollateralValue.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts Section */}
      <Card data-testid="bank-accounts-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Bank Accounts
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBankForm(!showBankForm)}
              data-testid="button-add-bank-account"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Account
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading bank accounts...
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bank accounts added yet. Add one to proceed with withdrawal.
            </div>
          ) : (
            <div className="grid gap-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBankAccount?.id === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedBankAccount(account);
                    withdrawalForm.setValue('bankAccountId', account.id.toString());
                  }}
                  data-testid={`bank-account-${account.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{account.bankName}</div>
                      <div className="text-sm text-gray-600">
                        {account.accountHolderName} • ****{account.accountNumber.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {account.ifscCode} • {account.accountType}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {account.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {account.isVerified ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Bank Account Form */}
          {showBankForm && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-4">Add New Bank Account</h4>
              <Form {...bankAccountForm}>
                <form onSubmit={bankAccountForm.handleSubmit(onBankAccountSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={bankAccountForm.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter account holder name"
                              data-testid="input-account-holder-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankAccountForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter bank name"
                              data-testid="input-bank-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankAccountForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter account number"
                              data-testid="input-account-number"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankAccountForm.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter IFSC code"
                              data-testid="input-ifsc-code"
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankAccountForm.control}
                      name="branchName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Name (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter branch name"
                              data-testid="input-branch-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankAccountForm.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-account-type">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="current">Current</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createBankAccountMutation.isPending}
                      data-testid="button-submit-bank-account"
                    >
                      {createBankAccountMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Add Bank Account
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBankForm(false)}
                      data-testid="button-cancel-bank-account"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card data-testid="withdrawal-form-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Withdraw Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...withdrawalForm}>
            <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-6">
              <FormField
                control={withdrawalForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdrawal Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          type="number"
                          placeholder="Enter amount"
                          className="pl-10"
                          data-testid="input-withdrawal-amount"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-gray-500">
                      Minimum: ₹{credit.minimumWithdrawal.toLocaleString()} • 
                      Maximum: ₹{credit.availableCredit.toLocaleString()}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Bank Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bank-account">
                          <SelectValue placeholder="Choose bank account for transfer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.length === 0 ? (
                          <div className="p-2 text-center text-gray-500">
                            <p>No bank accounts found</p>
                            <p className="text-xs mt-1">Add a bank account to continue</p>
                          </div>
                        ) : (
                          bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {account.bankName} - ****{account.accountNumber.slice(-4)} ({account.accountHolderName})
                                </span>
                                <div className="flex gap-1 ml-2">
                                  {account.isVerified && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  )}
                                  {account.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Working Capital, Business Expansion"
                        data-testid="input-purpose"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms and Processing Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <h4 className="font-medium text-blue-900 mb-2">Processing Terms</h4>
                    <ul className="text-blue-800 space-y-1">
                      <li>• Withdrawal will be processed within {credit.processingTime}</li>
                      <li>• Funds will be credited to your account within 1 business day</li>
                      <li>• Interest will be charged at {credit.interestRate}% per annum</li>
                      <li>• No processing fees for this withdrawal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={withdrawalMutation.isPending || bankAccounts.length === 0}
                data-testid="button-submit-withdrawal"
              >
                {withdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Withdraw Funds
                  </>
                )}
              </Button>

              {/* Enhanced guidance when no bank accounts exist */}
              {bankAccounts.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-testid="no-bank-accounts-warning">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-2">No Bank Accounts Found</h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        You need to add at least one verified bank account before you can withdraw funds. 
                        This ensures secure transfer of your credit line funds.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBankForm(true)}
                        data-testid="button-add-first-bank-account"
                        className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Your First Bank Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditWithdrawalForm;