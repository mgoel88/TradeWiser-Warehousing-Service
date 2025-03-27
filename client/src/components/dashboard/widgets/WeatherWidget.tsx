import { WidgetBase } from "./WidgetBase";
import { Cloud, Sun } from "lucide-react";

interface WeatherWidgetProps {
  id: string;
  title: string;
  config?: {
    location?: { lat: number; lng: number };
    days?: number;
  };
}

export function WeatherWidget({ id, title, config }: WeatherWidgetProps) {
  // Placeholder implementation
  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      <div className="flex flex-col items-center justify-center h-24 text-center">
        <div className="flex items-center">
          <Sun className="h-8 w-8 text-yellow-500 mr-1" />
          <Cloud className="h-6 w-6 text-blue-300 ml-1" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Weather forecast coming soon</p>
      </div>
    </WidgetBase>
  );
}