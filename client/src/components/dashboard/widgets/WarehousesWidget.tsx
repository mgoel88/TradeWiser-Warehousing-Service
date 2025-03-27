import { useQuery } from "@tanstack/react-query";
import { WidgetBase } from "./WidgetBase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Warehouse, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WarehousesWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
    location?: { lat: number; lng: number };
    channelType?: "green" | "orange" | "all";
  };
}

export function WarehousesWidget({ id, title, config }: WarehousesWidgetProps) {
  const [, navigate] = useLocation();
  const count = config?.count || 3;
  const channelType = config?.channelType || "all";
  
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['/api/warehouses'],
    retry: 1,
    staleTime: 60000
  });

  // Filter by channel type if specified and limit the number of warehouses
  const filteredWarehouses = warehouses 
    ? warehouses
        .filter((w: any) => channelType === "all" || w.channelType === channelType)
        .slice(0, count)
    : [];

  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <Warehouse className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No warehouses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWarehouses.map((warehouse: any) => (
            <div key={warehouse.id} className="flex items-center p-2 border rounded-md bg-muted/10 hover:bg-muted/20">
              <div className="mr-3 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium">{warehouse.name}</h4>
                  <Badge variant="outline" className={`ml-2 text-[10px] h-4 px-1.5 ${
                    warehouse.channelType === 'green' ? 'bg-green-50 text-green-600 border-green-200' : 
                    warehouse.channelType === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''
                  }`}>
                    {warehouse.channelType?.toUpperCase() || 'STANDARD'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {warehouse.location}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">View details</span>
              </Button>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => navigate("/warehouses")}
          >
            View All Warehouses
          </Button>
        </div>
      )}
    </WidgetBase>
  );
}