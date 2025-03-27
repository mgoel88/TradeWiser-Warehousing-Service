import { WidgetBase } from "./WidgetBase";
import { Bell } from "lucide-react";

interface NotificationsWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
    type?: "all" | "system" | "receipt" | "loan" | "commodity";
  };
}

export function NotificationsWidget({ id, title, config }: NotificationsWidgetProps) {
  // Placeholder implementation
  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      <div className="flex flex-col items-center justify-center h-24 text-center">
        <Bell className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Notifications coming soon</p>
      </div>
    </WidgetBase>
  );
}