import React from 'react';
import { useRealTimeEntity } from '@/hooks/use-real-time-entity';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CircleOff, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReceiptLiveStatusProps {
  receiptId: number;
}

/**
 * A component that displays the live status of a receipt
 * This includes connection status and last update time
 */
export function ReceiptLiveStatus({ receiptId }: ReceiptLiveStatusProps) {
  const { isActive, isConnected, lastUpdate } = useRealTimeEntity(
    'receipt',
    receiptId,
    {
      // We can provide custom callback for updates if needed
      onUpdate: (data) => {
        console.log('Receipt update received:', data);
      }
    }
  );

  return (
    <Card className="p-3 mt-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Live Status:</span>
          
          {isConnected ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center">
              <Wifi className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center">
              <WifiOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
          
          {isActive ? (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              Tracking
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground flex items-center">
              <CircleOff className="w-3 h-3 mr-1" />
              Not Tracking
            </Badge>
          )}
        </div>
        
        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
        )}
      </div>
    </Card>
  );
}