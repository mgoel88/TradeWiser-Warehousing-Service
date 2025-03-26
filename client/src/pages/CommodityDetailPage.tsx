import React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import CommodityDetail from '@/components/commodities/CommodityDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, getStatusClass } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function CommodityDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // If id is undefined, redirect to commodities page
  if (!id) {
    setLocation('/commodities');
    return null;
  }
  
  const commodityId = parseInt(id);
  
  // Fetch related processes
  const { data: processes, isLoading: isLoadingProcesses } = useQuery({
    queryKey: ['/api/processes', 'commodity', commodityId],
    queryFn: async () => {
      const response = await apiRequest(`/api/processes?commodityId=${commodityId}`);
      if (!response.ok) return [];
      return response.json();
    }
  });
  
  // Fetch related warehouse receipts
  const { data: receipts, isLoading: isLoadingReceipts } = useQuery({
    queryKey: ['/api/receipts', 'commodity', commodityId],
    queryFn: async () => {
      const response = await apiRequest(`/api/receipts?commodityId=${commodityId}`);
      if (!response.ok) return [];
      return response.json();
    }
  });
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p>Please log in to view commodity details</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6 mx-auto">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/commodities')} className="mr-2">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Commodity Details</h1>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="receipts">Warehouse Receipts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <CommodityDetail commodityId={commodityId} />
        </TabsContent>
        
        <TabsContent value="processes">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Related Processes</h3>
            
            {isLoadingProcesses ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : processes && processes.length > 0 ? (
              <div className="space-y-4">
                {processes.map((process: any) => (
                  <div key={process.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium">{process.processType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                        <p className="text-sm text-muted-foreground">
                          Started: {formatDate(process.startTime)}
                        </p>
                      </div>
                      <Badge className={getStatusClass(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm">Current Stage: <span className="font-medium">{process.currentStage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</span></p>
                      
                      {process.estimatedCompletionTime && (
                        <p className="text-sm mt-1">
                          Est. Completion: {formatDate(process.estimatedCompletionTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No processes found for this commodity</p>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="receipts">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Warehouse Receipts</h3>
            
            {isLoadingReceipts ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : receipts && receipts.length > 0 ? (
              <div className="space-y-4">
                {receipts.map((receipt: any) => (
                  <div key={receipt.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium">Receipt #{receipt.receiptNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          Issued: {formatDate(receipt.issuedDate)}
                        </p>
                      </div>
                      <Badge className={getStatusClass(receipt.status)}>
                        {receipt.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="text-sm font-medium">{receipt.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Blockchain Hash</p>
                        <p className="text-sm font-medium truncate">{receipt.blockchainHash || 'Not recorded'}</p>
                      </div>
                    </div>
                    
                    {receipt.expiryDate && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className="text-sm font-medium">{formatDate(receipt.expiryDate)}</p>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <Link to={`/receipts/${receipt.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No warehouse receipts found for this commodity</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}