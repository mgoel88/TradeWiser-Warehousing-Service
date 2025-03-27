import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { WarehouseReceipt } from '@shared/schema';
import WarehouseReceiptCard from './WarehouseReceiptCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ReceiptWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch receipts for the current user
  const { data: receipts, isLoading, isError } = useQuery({
    queryKey: ['/api/receipts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/receipts');
      if (!res.ok) {
        throw new Error('Failed to fetch receipts');
      }
      return res.json();
    },
  });
  
  // Filter receipts based on search term and active tab
  const filteredReceipts = receipts
    ? receipts.filter((receipt: WarehouseReceipt) => {
        // Filter by search term (receipt number)
        const matchesSearch = !searchTerm || receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filter by tab status
        const matchesTab = 
          activeTab === 'all' || 
          (activeTab === 'active' && receipt.status === 'active') ||
          (activeTab === 'collateralized' && receipt.status === 'collateralized') ||
          (activeTab === 'others' && ['withdrawn', 'transferred', 'processing'].includes(receipt.status));
          
        return matchesSearch && matchesTab;
      })
    : [];
  
  // Handle using a receipt as collateral
  const handlePledgeReceipt = (receipt: WarehouseReceipt) => {
    toast({
      title: "Receipt Selected for Collateral",
      description: `Receipt ${receipt.receiptNumber} will be used as collateral for a loan application.`,
    });
    
    // Here, we would typically navigate to the loan application page with this receipt pre-selected
    // Or open a loan application modal
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Receipts</CardTitle>
          <CardDescription>Loading your electronic warehouse receipts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Receipts</CardTitle>
          <CardDescription>Your electronic warehouse receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium">Error Loading Receipts</h4>
              <p className="text-sm">There was an issue fetching your warehouse receipts. Please try again later.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Warehouse Receipts</CardTitle>
            <CardDescription>Your electronic warehouse receipts (eWR)</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 hover:bg-primary/15">
            {filteredReceipts.length} Receipt{filteredReceipts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search and filter */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search receipts by number..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" title="Filter options">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Receipt status tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="collateralized">Collateralized</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredReceipts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 bg-muted h-12 w-12 rounded-full flex items-center justify-center">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No receipts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm 
                ? "No receipts match your search criteria. Try clearing filters or searching for a different term."
                : activeTab !== 'all'
                  ? `You don't have any receipts with "${activeTab}" status.`
                  : "You don't have any warehouse receipts yet. Deposit a commodity to get started."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReceipts.map((receipt: WarehouseReceipt) => (
              <WarehouseReceiptCard
                key={receipt.id}
                receipt={receipt}
                onPledge={receipt.status === 'active' ? handlePledgeReceipt : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}