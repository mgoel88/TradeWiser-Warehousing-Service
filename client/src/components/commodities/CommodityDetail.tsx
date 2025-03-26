import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Commodity, Warehouse } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, getChannelClass, getStatusClass } from '@/lib/utils';
import CommodityActions from './CommodityActions';
import { apiRequest } from '@/lib/queryClient';
import { 
  RefreshCw, 
  Calendar, 
  Package, 
  Scale, 
  Table, 
  Tag, 
  Truck, 
  UserIcon,
  Wheat,
  Leaf,
  Cog
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CommodityDetailProps {
  commodityId: number;
}

export default function CommodityDetail({ commodityId }: CommodityDetailProps) {
  const queryClient = useQueryClient();
  
  // Fetch commodity details
  const { data: commodity, isLoading: isLoadingCommodity } = useQuery({
    queryKey: ['/api/commodities', commodityId],
    queryFn: async () => {
      const response = await apiRequest(`/api/commodities/${commodityId}`);
      if (!response.ok) throw new Error('Failed to fetch commodity');
      return response.json();
    }
  });
  
  // Fetch users for ownership transfer dropdown
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/users');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!commodity
  });
  
  // Fetch warehouses for warehouse transfer dropdown
  const { data: warehouses } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await apiRequest('/api/warehouses');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!commodity
  });
  
  // Handle action completion
  const handleActionComplete = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/commodities'] });
    queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
  };
  
  // Get warehouse name
  const getWarehouseName = (warehouseId: number | null) => {
    if (!warehouseId || !warehouses) return 'Unknown';
    const warehouse = warehouses.find((w: Warehouse) => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown';
  };
  
  // Loading state
  if (isLoadingCommodity) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  // Error state
  if (!commodity) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium">Commodity not found</h3>
        <p className="text-sm text-muted-foreground mt-1">The commodity you are looking for does not exist or you do not have permission to view it.</p>
      </div>
    );
  }
  
  // Commodity icon based on type
  const CommodityIcon = () => {
    switch(commodity.type.toLowerCase()) {
      case 'grain':
        return <Wheat />;
      case 'produce':
      case 'vegetable':
      case 'fruit':
        return <Leaf />;
      default:
        return <Package />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{commodity.name}</h2>
        <div className="flex space-x-2">
          <Badge className={getChannelClass(commodity.channelType)}>
            {commodity.channelType.toUpperCase()} Channel
          </Badge>
          <Badge className={getStatusClass(commodity.status)}>
            {commodity.status}
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 mr-2">
              <CommodityIcon />
            </div>
            <div>
              <CardTitle>{commodity.name}</CardTitle>
              <CardDescription>Type: {commodity.type}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <p className="text-lg">{commodity.quantity} {commodity.measurementUnit}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Valuation</p>
                  <p className="text-lg">{formatCurrency(commodity.valuation)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Table className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Grade</p>
                  <p className="text-lg">{commodity.gradeAssigned || 'Not Assigned'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Deposit Date</p>
                  <p className="text-base">{formatDate(commodity.depositDate)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Stored At</p>
                  <p className="text-lg">{getWarehouseName(commodity.warehouseId)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Owner ID</p>
                  <p className="text-lg">{commodity.ownerId}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-base">{formatDate(commodity.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {commodity.qualityParameters && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="text-sm font-medium mb-2">Quality Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Object.entries(commodity.qualityParameters).map(([key, value]) => (
                    <div key={key} className="bg-muted p-3 rounded-md">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex-col items-start">
          <Separator className="my-2" />
          <CommodityActions 
            commodity={commodity} 
            users={users} 
            warehouses={warehouses}
            onActionComplete={handleActionComplete}
          />
        </CardFooter>
      </Card>
    </div>
  );
}