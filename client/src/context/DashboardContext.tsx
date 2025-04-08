import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Layout } from "react-grid-layout";
import { apiRequest } from "@/lib/queryClient";

// Define available widget types
export type WidgetType = 
  | "receipts" 
  | "loans" 
  | "commodities" 
  | "warehouses" 
  | "transactions"
  | "market-prices"
  | "weather"
  | "quick-actions"
  | "notifications"
  | "warehousemap";

// Widget configuration
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  config?: Record<string, any>;
}

interface DashboardContextType {
  widgets: Widget[];
  layouts: Layout[];
  isEditMode: boolean;
  availableWidgets: Widget[];
  addWidget: (widgetType: WidgetType) => void;
  removeWidget: (widgetId: string) => void;
  updateLayout: (newLayout: Layout[]) => void;
  saveLayout: () => Promise<void>;
  toggleEditMode: () => void;
  getWidgetById: (id: string) => Widget | undefined;
  resetLayout: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Define default widgets and their properties
// Always put the map widget first in the array to ensure it's at the top
const getDefaultWidgets = (): Widget[] => [
  {
    id: "warehousemap-widget",
    type: "warehousemap",
    title: "Warehouse Map",
    x: 0,
    y: 0, // Always at y=0 to be at the top
    w: 12,
    h: 4, // Taller map
    minW: 6,
    minH: 4,
    static: true // Make it static so it can't be moved from the top
  },
  {
    id: "receipts-widget",
    type: "receipts",
    title: "Recent Receipts",
    x: 0,
    y: 4, // Position below the map
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "loans-widget",
    type: "loans",
    title: "Active Loans",
    x: 6,
    y: 4, // Position below the map
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "commodities-widget",
    type: "commodities",
    title: "My Commodities",
    x: 0,
    y: 6,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "quick-actions-widget",
    type: "quick-actions",
    title: "Quick Actions",
    x: 6,
    y: 6,
    w: 6,
    h: 2,
    minW: 3,
    minH: 2
  }
];

// Define all available widgets that can be added
const getAvailableWidgetTemplates = (): Widget[] => [
  {
    id: "template-receipts",
    type: "receipts",
    title: "Recent Receipts",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-loans",
    type: "loans",
    title: "Active Loans",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-commodities",
    type: "commodities",
    title: "My Commodities",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-warehouses",
    type: "warehouses",
    title: "Nearby Warehouses",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-transactions",
    type: "transactions",
    title: "Recent Transactions",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-market-prices",
    type: "market-prices",
    title: "Market Prices",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-weather",
    type: "weather",
    title: "Weather Forecast",
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 4,
    minH: 2
  },
  {
    id: "template-quick-actions",
    type: "quick-actions",
    title: "Quick Actions",
    x: 0,
    y: 0,
    w: 6,
    h: 1,
    minW: 3,
    minH: 1
  },
  {
    id: "template-notifications",
    type: "notifications",
    title: "Notifications",
    x: 0,
    y: 0,
    w: 4,
    h: 2,
    minW: 3,
    minH: 2
  },
  {
    id: "template-warehousemap",
    type: "warehousemap",
    title: "Warehouse Map",
    x: 0,
    y: 0,
    w: 12,
    h: 4,
    minW: 6,
    minH: 4
  }
];

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableWidgets] = useState<Widget[]>(getAvailableWidgetTemplates());
  
  // Get layouts from widgets
  const layouts = widgets.map(widget => ({
    i: widget.id,
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
    minW: widget.minW,
    minH: widget.minH,
    maxW: widget.maxW,
    maxH: widget.maxH,
    static: widget.static,
    isDraggable: widget.isDraggable,
    isResizable: widget.isResizable
  }));

  // Load saved layout from localStorage or use default
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setWidgets(parsedLayout);
      } catch (error) {
        console.error("Error parsing saved layout:", error);
        setWidgets(getDefaultWidgets());
      }
    } else {
      setWidgets(getDefaultWidgets());
    }
  }, []);

  // Add a new widget to the dashboard
  const addWidget = (widgetType: WidgetType) => {
    const template = availableWidgets.find(w => w.type === widgetType);
    
    if (!template) {
      console.error(`Widget template for ${widgetType} not found`);
      return;
    }
    
    // Create a new widget with a unique ID based on the template
    const newId = `${widgetType}-${Date.now()}`;
    const newWidget: Widget = {
      ...template,
      id: newId,
      // Place it at the bottom of the grid
      y: Math.max(...widgets.map(w => w.y + w.h), 0)
    };
    
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
  };

  // Remove widget from dashboard
  const removeWidget = (widgetId: string) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== widgetId));
  };

  // Update layout when widgets are dragged or resized
  const updateLayout = (newLayout: Layout[]) => {
    setWidgets(prevWidgets => {
      return prevWidgets.map(widget => {
        const layoutItem = newLayout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
        }
        return widget;
      });
    });
  };

  // Save the current layout
  const saveLayout = async () => {
    // Save to localStorage
    localStorage.setItem('dashboard-layout', JSON.stringify(widgets));
    
    // In a real app, you'd also save to the server
    // try {
    //   await apiRequest('POST', '/api/dashboard/layout', { widgets });
    // } catch (error) {
    //   console.error("Failed to save layout to server:", error);
    // }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Save when exiting edit mode
      saveLayout();
    }
  };

  // Get widget by ID
  const getWidgetById = (id: string) => {
    return widgets.find(widget => widget.id === id);
  };

  // Reset layout to default
  const resetLayout = () => {
    setWidgets(getDefaultWidgets());
  };

  return (
    <DashboardContext.Provider
      value={{
        widgets,
        layouts,
        isEditMode,
        availableWidgets,
        addWidget,
        removeWidget,
        updateLayout,
        saveLayout,
        toggleEditMode,
        getWidgetById,
        resetLayout
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};