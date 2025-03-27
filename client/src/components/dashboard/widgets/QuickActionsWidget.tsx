import { WidgetBase } from "./WidgetBase";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Warehouse, 
  CircleDollarSign, 
  Receipt, 
  ArrowUpDown, 
  Leaf, 
  Truck, 
  PlusCircle 
} from "lucide-react";

interface QuickActionsWidgetProps {
  id: string;
  title: string;
  config?: Record<string, any>;
}

export function QuickActionsWidget({ id, title, config }: QuickActionsWidgetProps) {
  const [, navigate] = useLocation();

  const actions = [
    { 
      label: "Deposit Commodity", 
      icon: <PlusCircle className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/deposit") 
    },
    { 
      label: "Apply for Loan", 
      icon: <CircleDollarSign className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/loans/new") 
    },
    { 
      label: "Transfer Receipt", 
      icon: <ArrowUpDown className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/receipts?action=transfer") 
    },
    { 
      label: "View Commodities", 
      icon: <Leaf className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/commodities") 
    },
    { 
      label: "View Warehouses", 
      icon: <Warehouse className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/warehouses") 
    },
    { 
      label: "View Receipts", 
      icon: <Receipt className="h-4 w-4 mr-2" />, 
      onClick: () => navigate("/receipts") 
    }
  ];

  return (
    <WidgetBase id={id} title={title}>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Button 
            key={index}
            variant="outline" 
            size="sm" 
            className="justify-start text-xs h-9"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </WidgetBase>
  );
}