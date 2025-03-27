import { WidgetBase } from "./WidgetBase";
import { TrendingUp } from "lucide-react";

interface MarketPricesWidgetProps {
  id: string;
  title: string;
  config?: {
    commodityIds?: number[];
  };
}

export function MarketPricesWidget({ id, title, config }: MarketPricesWidgetProps) {
  // Placeholder implementation
  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      <div className="flex flex-col items-center justify-center h-24 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Market prices coming soon</p>
      </div>
    </WidgetBase>
  );
}