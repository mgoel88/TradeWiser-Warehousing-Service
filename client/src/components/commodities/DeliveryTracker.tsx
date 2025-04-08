
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Steps } from "@/components/ui/steps";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Package, MapPin, CheckCircle2 } from 'lucide-react';

interface DeliveryStatus {
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered';
  currentLocation?: string;
  estimatedDelivery?: string;
  updates: Array<{
    time: string;
    status: string;
    location: string;
  }>;
}

export default function DeliveryTracker({ deliveryId }: { deliveryId: string }) {
  const { data: delivery } = useQuery({
    queryKey: ['deliveries', deliveryId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/deliveries/${deliveryId}`);
      if (!res.ok) throw new Error('Failed to fetch delivery status');
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getProgress = (status: string) => {
    switch (status) {
      case 'in_transit': return 33;
      case 'out_for_delivery': return 66;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const steps = [
    { icon: Package, label: 'Prepared' },
    { icon: Truck, label: 'In Transit' },
    { icon: MapPin, label: 'Out for Delivery' },
    { icon: CheckCircle2, label: 'Delivered' }
  ];

  if (!delivery) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={getProgress(delivery.status)} className="mb-4" />
        
        <Steps
          steps={steps}
          currentStep={['pending', 'in_transit', 'out_for_delivery', 'delivered']
            .indexOf(delivery.status)}
        />

        {delivery.currentLocation && (
          <p className="text-sm text-muted-foreground mt-4">
            Current Location: {delivery.currentLocation}
          </p>
        )}

        {delivery.estimatedDelivery && (
          <p className="text-sm text-muted-foreground">
            Estimated Delivery: {new Date(delivery.estimatedDelivery).toLocaleString()}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {delivery.updates.map((update, i) => (
            <div key={i} className="text-sm border-l-2 border-muted pl-4 py-2">
              <p className="font-medium">{update.status}</p>
              <p className="text-muted-foreground">
                {new Date(update.time).toLocaleString()} • {update.location}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
