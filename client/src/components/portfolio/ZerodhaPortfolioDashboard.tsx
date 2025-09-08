import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Wallet, 
  FileText, 
  CreditCard, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Banknote,
  Target,
  Activity
} from 'lucide-react';
import { Link } from 'wouter';

interface PortfolioData {
  totalValue: number;
  receiptsCount: number;
  availableCredit: number;
  receipts: any[];
  commodities: any[];
}

const ZerodhaPortfolioDashboard = () => {
  const { toast } = useToast();

  const { data: portfolioData, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ['/api/portfolio'],
    refetchInterval: 30000 // Refresh every 30 seconds like Zerodha
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
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
        <p className="text-red-600">Failed to load portfolio data. Please try again.</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const portfolio = portfolioData || {
    totalValue: 0,
    receiptsCount: 0,
    availableCredit: 0,
    receipts: [],
    commodities: []
  };

  const utilizationPercent = portfolio.totalValue > 0 ? 
    ((portfolio.totalValue - portfolio.availableCredit) / portfolio.totalValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Zerodha-Style Portfolio Summary */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Portfolio Value */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{portfolio.totalValue.toLocaleString()}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+2.3% today</span>
              </div>
            </div>

            {/* Available Credit */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Available Credit</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{portfolio.availableCredit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                80% of portfolio value
              </div>
            </div>

            {/* Active Receipts */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Active Receipts</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {portfolio.receiptsCount}
              </div>
              <div className="text-sm text-gray-500">
                Warehouse receipts
              </div>
            </div>

            {/* Utilization */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Utilization</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {utilizationPercent.toFixed(1)}%
              </div>
              <Progress value={utilizationPercent} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Zerodha Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/deposits/new">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200 hover:border-green-300">
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Deposit Commodity</h3>
              <p className="text-sm text-gray-600">Add new commodities to your portfolio</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/loans">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 hover:border-blue-300">
            <CardContent className="p-6 text-center">
              <Banknote className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Apply for Loan</h3>
              <p className="text-sm text-gray-600">Get instant loans against your receipts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portfolio">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 hover:border-purple-300">
            <CardContent className="p-6 text-center">
              <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">View Receipts</h3>
              <p className="text-sm text-gray-600">Manage your warehouse receipts</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Holdings - Zerodha Style Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Holdings</CardTitle>
          <Badge variant="secondary">{portfolio.receipts.length} positions</Badge>
        </CardHeader>
        <CardContent>
          {portfolio.receipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
              <p className="text-gray-600 mb-6">Start by depositing your first commodity</p>
              <Link href="/deposits/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit Commodity
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3 text-sm font-medium text-gray-600">Commodity</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Market Value</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Available Credit</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.receipts.map((receipt, index) => {
                    const marketValue = parseFloat(receipt.valuation || '0');
                    const availableCredit = (marketValue - parseFloat(receipt.collateralUsed || '0')) * 0.8;
                    const pnlPercent = Math.random() * 10 - 5; // Mock P&L for demo
                    
                    return (
                      <tr key={receipt.id} className="border-b hover:bg-gray-50">
                        <td className="py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {receipt.commodityName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {receipt.receiptNumber}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm">
                            {parseFloat(receipt.quantity).toFixed(2)} {receipt.measurementUnit}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-medium">
                            ₹{marketValue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-green-600 font-medium">
                            ₹{Math.max(0, availableCredit).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <Badge 
                            variant={receipt.status === 'active' ? 'default' : 'secondary'}
                            className={receipt.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {receipt.status}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className={`flex items-center gap-1 ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlPercent >= 0 ? 
                              <ArrowUpRight className="w-4 h-4" /> : 
                              <ArrowDownRight className="w-4 h-4" />
                            }
                            <span className="font-medium">
                              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ZerodhaPortfolioDashboard;