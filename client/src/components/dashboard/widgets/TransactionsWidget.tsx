import { WidgetBase } from "./WidgetBase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowUpDown } from "lucide-react";

interface TransactionsWidgetProps {
  id: string;
  title: string;
  config?: {
    count?: number;
    type?: "all" | "deposit" | "withdraw" | "transfer" | "repayment";
  };
}

export function TransactionsWidget({ id, title, config }: TransactionsWidgetProps) {
  const [, navigate] = useLocation();
  
  // Placeholder implementation
  return (
    <WidgetBase id={id} title={title} hasSettings={true}>
      <div className="flex flex-col items-center justify-center h-24 text-center">
        <ArrowUpDown className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Transactions coming soon</p>
      </div>
    </WidgetBase>
  );
}