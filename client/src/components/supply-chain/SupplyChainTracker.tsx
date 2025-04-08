
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, Truck, Package, CheckCircle } from 'lucide-react';

interface TrackingEvent {
  sackId: number;
  eventType: 'pickup' | 'transit' | 'delivery' | 'inspection';
  location: { lat: number; lng: number };
  timestamp: Date;
  status: string;
}

export function SupplyChainTracker({ sackId }: { sackId: number }) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['tracking', sackId],
    queryFn: async () => {
      const res = await fetch(`/api/supply-chain/track/${sackId}`);
      return res.json();
    }
  });

  if (isLoading) {
    return <div>Loading tracking information...</div>;
  }

  const getStageIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <Truck className="h-5 w-5" />;
      case 'transit': return <MapPin className="h-5 w-5" />;
      case 'delivery': return <Package className="h-5 w-5" />;
      case 'inspection': return <CheckCircle className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Chain Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events?.map((event: TrackingEvent, index: number) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                {getStageIcon(event.eventType)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{event.status}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
                <Progress value={(index + 1) * (100 / events.length)} className="mt-2" />
              </div>
            </div>
          ))}
          
          <Alert>
            <AlertDescription>
              Estimated delivery time: {new Date().toLocaleDateString()}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
