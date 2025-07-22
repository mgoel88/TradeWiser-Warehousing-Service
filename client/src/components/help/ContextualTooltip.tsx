import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualTooltipProps {
  title: string;
  description: string;
  tips?: string[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export default function ContextualTooltip({ 
  title, 
  description, 
  tips,
  position = 'top',
  children 
}: ContextualTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center space-x-2">
        {children}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-5 w-5 p-0 hover:bg-blue-50 hover:text-blue-600"
        >
          <HelpCircle className="h-3 w-3" />
        </Button>
      </div>
      
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-80",
          positionClasses[position]
        )}>
          <Card className="shadow-lg border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between space-x-2 mb-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {description}
              </p>
              
              {tips && tips.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-xs text-green-700 uppercase tracking-wide">
                    Tips
                  </h5>
                  <ul className="space-y-1">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-xs text-green-800">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}