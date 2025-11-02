import { useState, useEffect } from 'react';
import { fetchWithAuth, isAuthenticated } from '../lib/auth';
// Navigation using window.location.href
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RevolvingCreditAccount {
  id: number;
  totalCreditLimit: number;
  utilizedAmount: number;
  availableCredit: number;
  annualInterestRate: number;
  status: string;
  lastInterestCalculationDate: string;
}

interface CollateralReceipt {
  id: number;
  warehouseReceiptId: number;
  pledgedAmount: number;
  currentMarketValue: number;
  creditLimit: number;
  isPledged: boolean;
  pledgedAt: string;
  receipt: any;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  date: string;
}

interface InterestRecord {
  id: number;
  date: string;
  principalAmount: number;
  interestAmount: number;
  status: string;
}

export default function RevolvingCreditPage() {
  // Navigation handled via window.location.href
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<RevolvingCreditAccount | null>(null);
  const [collateralReceipts, setCollateralReceipts] = useState<CollateralReceipt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [interestHistory, setInterestHistory] = useState<InterestRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      // Check if authenticated
      if (!isAuthenticated()) {
        window.location.href = '/';
        return;
      }
      
      const response = await fetchWithAuth('/api/revolving-credit/account');

      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      const data = await response.json();
      
      if (data.success) {
        setAccount(data.account);
        setCollateralReceipts(data.collateralReceipts || []);
        setTransactions(data.recentTransactions || []);
        setInterestHistory(data.recentInterest || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const utilizationPercentage = account 
    ? (account.utilizedAmount / account.totalCreditLimit) * 100 
    : 0;

  const dailyInterestRate = account ? account.annualInterestRate / 365 : 0;
  const dailyInterest = account ? (account.utilizedAmount * dailyInterestRate) / 100 : 0;
  const monthlyInterest = dailyInterest * 30;

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your credit account...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Revolving Credit Account</h1>
        <p className="text-muted-foreground">
          Manage your warehouse receipt-backed credit line
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Credit Limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(account?.totalCreditLimit || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              80% LTV on {collateralReceipts.length} receipt{collateralReceipts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Utilized Amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(account?.utilizedAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {utilizationPercentage.toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Available Credit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(account?.availableCredit || 0)}
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/credit/withdraw'}
                disabled={!account || account.availableCredit <= 0}
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/credit/repay'}
                disabled={!account || account.utilizedAmount <= 0}
              >
                <ArrowDownRight className="h-4 w-4 mr-1" />
                Repay
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Daily Interest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dailyInterest)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {account?.annualInterestRate}% p.a. • ₹{monthlyInterest.toFixed(0)}/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Bar */}
      {account && account.totalCreditLimit > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Credit Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilized: {formatCurrency(account.utilizedAmount)}</span>
                <span>Available: {formatCurrency(account.availableCredit)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    utilizationPercentage > 90 ? 'bg-red-500' :
                    utilizationPercentage > 70 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{utilizationPercentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Credit Line Message */}
      {account && account.totalCreditLimit === 0 && (
        <Alert className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have any active credit line yet. Pledge your warehouse receipts as collateral to activate your revolving credit account.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="collateral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collateral">
            <FileText className="h-4 w-4 mr-2" />
            Collateral ({collateralReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="interest">
            <TrendingDown className="h-4 w-4 mr-2" />
            Interest History
          </TabsTrigger>
        </TabsList>

        {/* Collateral Tab */}
        <TabsContent value="collateral" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pledged Warehouse Receipts</h3>
            <Button onClick={() => window.location.href = '/receipts'}>
              <Plus className="h-4 w-4 mr-2" />
              Pledge More Receipts
            </Button>
          </div>

          {collateralReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No warehouse receipts pledged yet
                </p>
                <Button onClick={() => window.location.href = '/receipts'}>
                  View Your Receipts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {collateralReceipts.map((collateral) => (
                <Card key={collateral.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            Receipt #{collateral.receipt?.receiptNumber || collateral.warehouseReceiptId}
                          </h4>
                          <Badge variant={collateral.isPledged ? "default" : "secondary"}>
                            {collateral.isPledged ? "Pledged" : "Unpledged"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Commodity Value</p>
                            <p className="font-medium">{formatCurrency(collateral.pledgedAmount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Market Value</p>
                            <p className="font-medium">{formatCurrency(collateral.currentMarketValue)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Credit Limit (80%)</p>
                            <p className="font-medium text-green-600">{formatCurrency(collateral.creditLimit)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pledged On</p>
                            <p className="font-medium">{formatDate(collateral.pledgedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/receipts/${collateral.warehouseReceiptId}`}
                      >
                        View Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tx.type === 'withdrawal' ? (
                          <div className="p-2 bg-orange-100 rounded-full">
                            <ArrowUpRight className="h-4 w-4 text-orange-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-green-100 rounded-full">
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-muted-foreground">{tx.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === 'withdrawal' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'withdrawal' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {formatCurrency(tx.balanceAfter)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Interest History Tab */}
        <TabsContent value="interest" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daily Interest Calculations</h3>
            <p className="text-sm text-muted-foreground">
              Last 30 days
            </p>
          </div>

          {interestHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No interest calculated yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {interestHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        <p className="text-sm text-muted-foreground">
                          Principal: {formatCurrency(record.principalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(record.interestAmount)}
                        </p>
                        <Badge variant={record.status === 'charged' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {interestHistory.length > 0 && (
                <Card className="bg-muted">
                  <CardContent className="py-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">Total Interest (Last 30 days)</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(
                          interestHistory.reduce((sum, r) => sum + r.interestAmount, 0)
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
