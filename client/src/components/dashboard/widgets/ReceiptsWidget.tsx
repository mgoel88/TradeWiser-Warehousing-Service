import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WidgetBase } from "./WidgetBase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "wouter";
import { ReceiptCheck, ExternalLink } from "lucide-react";

interface ReceiptsWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
    filter?: "all" | "active" | "collateralized" | "transferred";
  };
}

export function ReceiptsWidget({ id, title, config }: ReceiptsWidgetProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const count = config?.count || 3;
  
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  const filteredReceipts = receipts ? receipts.slice(0, count) : [];

  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-2 w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
          <TabsTrigger value="active" className="flex-1 text-xs">Active</TabsTrigger>
          <TabsTrigger value="collateralized" className="flex-1 text-xs">Collateralized</TabsTrigger>
        </TabsList>
        
        <TabsContent value={tab} className="mt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <ReceiptCheck className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No receipts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map((receipt: any) => (
                <div key={receipt.id} className="flex items-center p-2 border rounded-md bg-muted/10 hover:bg-muted/20">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{receipt.receiptNumber}</h4>
                    <p className="text-xs text-muted-foreground">
                      {receipt.quantity} {receipt.commodityType}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => navigate(`/receipts/${receipt.id}`)}
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
                onClick={() => navigate("/receipts")}
              >
                View All Receipts
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </WidgetBase>
  );
}