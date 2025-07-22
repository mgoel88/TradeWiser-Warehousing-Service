import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export default function HelpButton({ 
  onClick, 
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = false
}: HelpButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200",
        className
      )}
    >
      <HelpCircle className="h-4 w-4" />
      {showLabel && <span>Process Guide</span>}
    </Button>
  );
}