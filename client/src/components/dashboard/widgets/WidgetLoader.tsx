import { Widget, WidgetType, useDashboard } from "@/context/DashboardContext";
import { ReceiptsWidget } from "./ReceiptsWidget";
import { LoansWidget } from "./LoansWidget";
import { CommoditiesWidget } from "./CommoditiesWidget";
import { WarehousesWidget } from "./WarehousesWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { NotificationsWidget } from "./NotificationsWidget";
import { MarketPricesWidget } from "./MarketPricesWidget";
import { WeatherWidget } from "./WeatherWidget";
import { TransactionsWidget } from "./TransactionsWidget";
import { WarehouseMapWidget } from "./WarehouseMapWidget";

interface WidgetLoaderProps {
  id: string;
}

export function WidgetLoader({ id }: WidgetLoaderProps) {
  const { getWidgetById } = useDashboard();
  const widget = getWidgetById(id);

  if (!widget) {
    return <div>Widget not found</div>;
  }

  return renderWidget(widget);
}

function renderWidget(widget: Widget) {
  switch (widget.type) {
    case "receipts":
      return <ReceiptsWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "loans":
      return <LoansWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "commodities":
      return <CommoditiesWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "warehouses":
      return <WarehousesWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "transactions":
      return <TransactionsWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "market-prices":
      return <MarketPricesWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "weather":
      return <WeatherWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "quick-actions":
      return <QuickActionsWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "notifications":
      return <NotificationsWidget id={widget.id} title={widget.title} config={widget.config} />;
    case "warehousemap":
      return <WarehouseMapWidget />;
    default:
      return <div>Unknown widget type: {widget.type}</div>;
  }
}