import { useState } from 'react';
import { WarehouseMap } from '@/components/map/WarehouseMap';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Warehouse, MapPin, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export function WarehouseMapWidget() {
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [quantity, setQuantity] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch warehouse count
  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ['/api/warehouses'],
    staleTime: 60000,
  });

  // Fetch commodities for the dropdown
  const { data: commodities = [] } = useQuery<any[]>({
    queryKey: ['/api/commodities'],
    staleTime: 60000,
  });

  const warehouseCount = warehouses.length;

  const handleQuickDeposit = () => {
    if (!selectedCommodity || !quantity) {
      toast({
        title: 'Missing information',
        description: 'Please select a commodity and enter a quantity',
        variant: 'destructive',
      });
      return;
    }

    setLocation('/green-channel?commodity=' + selectedCommodity + '&quantity=' + quantity);
  };

  return (
    <Card className="col-span-12 shadow-sm">
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
      <CardFooter className="border-t pt-4 pb-3 bg-muted/10">
        <div className="w-full">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Plus className="h-4 w-4 mr-1 text-primary" />
            Quick Deposit to Green Channel
          </h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <Label htmlFor="commodity" className="text-xs mb-1 block">Commodity Type</Label>
              <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                <SelectTrigger id="commodity" className="h-9">
                  <SelectValue placeholder="Select commodity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="corn">Corn</SelectItem>
                  <SelectItem value="soybean">Soybean</SelectItem>
                  <SelectItem value="sugarcane">Sugarcane</SelectItem>
                  {commodities.map((commodity: any) => (
                    <SelectItem key={commodity.id} value={commodity.name.toLowerCase()}>
                      {commodity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Label htmlFor="quantity" className="text-xs mb-1 block">Approx. Quantity (kg)</Label>
              <Input
                id="quantity"
                className="h-9"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="col-span-3 flex items-end">
              <Button 
                className="w-full h-9" 
                onClick={handleQuickDeposit}
                disabled={!selectedCommodity || !quantity}
              >
                <span>Go to Deposit</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}