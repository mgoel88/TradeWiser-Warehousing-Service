import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Package, 
  ExternalLink, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  FileText,
  Warehouse,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export default function NewDashboardPage() {
  const [, navigate] = useLocation();
  
  // Data queries
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<any[]>({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  const { data: processes = [], isLoading: processesLoading } = useQuery<any[]>({
    queryKey: ['/api/processes'],
    retry: 1,
    staleTime: 30000
  });

  // Analytics
  const totalValue = receipts.reduce((sum, r) => sum + (parseFloat(r.valuation || 0)), 0);
  const activeProcesses = processes.filter(p => p.status === 'active').length;
  const availableCredit = totalValue * 0.8;

  // Recent receipts by type
  const recentReceipts = receipts.slice(0, 3);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your commodities, receipts, and financing
            </p>
          </div>
          <Button onClick={() => navigate('/deposit')} className="gap-2">
            <Plus className="h-4 w-4" />
            Store Commodities
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">
                Across {receipts.length} warehouse receipts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{availableCredit.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">
                80% of portfolio value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProcesses}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouse Receipts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receipts.length}</div>
              <p className="text-xs text-muted-foreground">
                Active storage receipts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/deposit')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Store Commodities</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    In verified TradeWiser warehouses
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Quality assured storage
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/import-receipts')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Import Receipts</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    From external warehouses
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Third-party integration
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/loans')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Get Financing</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Against your warehouse receipts
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Competitive rates from 12% p.a.
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Receipts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Warehouse Receipts</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/receipts')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {receiptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentReceipts.length > 0 ? (
                <div className="space-y-3">
                  {recentReceipts.map((receipt) => (
                    <div 
                      key={receipt.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/receipts`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-primary/10 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{receipt.receiptNumber}</p>
                          <p className="text-xs text-muted-foreground">{receipt.commodityName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{receipt.quantity} MT</p>
                        <Badge variant="outline" className="text-xs">
                          {receipt.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No warehouse receipts yet</p>
                  <Button size="sm" onClick={() => navigate('/deposit')}>
                    Store Your First Commodity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3" 
                  onClick={() => navigate('/warehouses')}
                >
                  <Warehouse className="h-4 w-4" />
                  Find Warehouses Near Me
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3" 
                  onClick={() => navigate('/private-storage')}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Self-Certified Storage
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3" 
                  onClick={() => navigate('/receipts')}
                >
                  <FileText className="h-4 w-4" />
                  View All Receipts
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3" 
                  onClick={() => navigate('/payments')}
                >
                  <DollarSign className="h-4 w-4" />
                  Payment History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Status (if any active) */}
        {activeProcesses > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Processes ({activeProcesses})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processes.filter(p => p.status === 'active').slice(0, 3).map((process) => (
                  <div 
                    key={process.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-sm">
                          {process.processType === 'deposit' ? 'Commodity Storage' : 'Process'} 
                          #{process.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stage: {process.currentStage || 'In Progress'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}