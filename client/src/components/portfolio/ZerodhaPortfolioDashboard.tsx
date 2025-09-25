import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  Wallet,
  FileText,
  CreditCard,
  Plus,
  Activity,
  Loader2
} from 'lucide-react';
import { Link } from 'wouter';

const PortfolioDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fix broken query - add proper queryFn
  const { data: portfolioResponse, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      return response.json();
    },
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000
  });

  const { data: creditLineResponse } = useQuery({
    queryKey: ['credit-line'],
    queryFn: async () => {
      const response = await fetch('/api/credit-line/details', {
        credentials: 'include'
      });
      if (!response.ok) return { success: true, data: { totalLimit: 0, availableBalance: 0, outstandingAmount: 0 } };
      return response.json();
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load portfolio data</p>
        <Button onClick={() => queryClient.refetchQueries({ queryKey: ['portfolio'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  const portfolio = portfolioResponse?.data || {
    totalValue: 0,
    receiptsCount: 0,
    availableCredit: 0,
    receipts: [],
    commodities: []
  };

  const creditLine = creditLineResponse?.data || {
    totalLimit: 0,
    availableBalance: 0,
    outstandingAmount: 0
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your commodity holdings and financing</p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold">₹{portfolio.totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Available</p>
                <p className="text-2xl font-bold text-green-600">₹{creditLine.availableBalance.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₹{creditLine.outstandingAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Receipts</p>
                <p className="text-2xl font-bold">{portfolio.receiptsCount}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">New Deposit</h3>
            <p className="text-gray-600 mb-4">Add commodities to your portfolio</p>
            <Link href="/deposits/new">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Deposit Commodity
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Credit Line</h3>
            <p className="text-gray-600 mb-4">Withdraw funds against your holdings</p>
            <Link href="/credit/withdraw">
              <Button className="w-full" variant="outline" data-testid="button-withdraw-credit">
                <Wallet className="w-4 h-4 mr-2" />
                Withdraw Funds
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">View Receipts</h3>
            <p className="text-gray-600 mb-4">Manage warehouse receipts</p>
            <Link href="/receipts">
              <Button className="w-full" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings ({portfolio.receipts.length} positions)</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.receipts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No holdings yet</h3>
              <p className="text-gray-600 mb-4">Start by depositing your first commodity</p>
              <Link href="/deposits/new">
                <Button>Create First Deposit</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Commodity</th>
                    <th className="text-left p-2">Quantity</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{receipt.commodityName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{receipt.receiptNumber}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        {parseFloat(receipt.quantity).toFixed(2)} {receipt.measurementUnit}
                      </td>
                      <td className="p-2">₹{parseFloat(receipt.valuation || 0).toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant={receipt.status === 'active' ? 'default' : 'secondary'}>
                          {receipt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioDashboard;