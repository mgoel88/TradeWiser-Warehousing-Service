import { WarehouseMap } from '@/components/map/WarehouseMap';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, MapPin } from 'lucide-react';

export function WarehouseMapWidget() {
  // Fetch warehouse count
  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ['/api/warehouses'],
    staleTime: 60000,
  });

  const warehouseCount = warehouses.length;

  return (
    <Card className="col-span-3 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Warehouse className="h-5 w-5 mr-2 text-primary" />
              Warehouses Near You
            </CardTitle>
            <CardDescription>
              Find verified warehouses in your area for commodity storage
            </CardDescription>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {warehouseCount} {warehouseCount === 1 ? 'Warehouse' : 'Warehouses'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WarehouseMap />
      </CardContent>
    </Card>
  );
}