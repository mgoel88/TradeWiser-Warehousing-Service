import { useQuery } from "@tanstack/react-query";
import { WidgetBase } from "./WidgetBase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Leaf, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommoditiesWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
  };
}

export function CommoditiesWidget({ id, title, config }: CommoditiesWidgetProps) {
  const [, navigate] = useLocation();
  const count = config?.count || 3;
  
  const { data: commodities, isLoading } = useQuery({
    queryKey: ['/api/commodities'],
    retry: 1,
    staleTime: 60000
  });

  const filteredCommodities = commodities ? commodities.slice(0, count) : [];

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
      ) : filteredCommodities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <Leaf className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No commodities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCommodities.map((commodity: any) => (
            <div key={commodity.id} className="flex items-center p-2 border rounded-md bg-muted/10 hover:bg-muted/20">
              <div className="mr-3 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium">{commodity.name}</h4>
                  <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1.5">
                    {commodity.grade}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {commodity.quantity} {commodity.unit} • {commodity.warehouseName || 'Unknown warehouse'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => navigate(`/commodities/${commodity.id}`)}
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
            onClick={() => navigate("/commodities")}
          >
            View All Commodities
          </Button>
        </div>
      )}
    </WidgetBase>
  );
}