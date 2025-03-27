import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/context/DashboardContext";
import { X, Maximize, Minimize, Settings } from "lucide-react";

interface WidgetBaseProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onSettingsClick?: () => void;
  hasSettings?: boolean;
}

export function WidgetBase({
  id,
  title,
  children,
  className = "",
  onSettingsClick,
  hasSettings = false,
}: WidgetBaseProps) {
  const { isEditMode, removeWidget } = useDashboard();

  return (
    <Card className={`h-full overflow-hidden shadow-sm ${className}`}>
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-1">
          {hasSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-70 hover:opacity-100"
              onClick={onSettingsClick}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
          {isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => removeWidget(id)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 overflow-auto" style={{ height: "calc(100% - 42px)" }}>
        {children}
      </CardContent>
    </Card>
  );
}