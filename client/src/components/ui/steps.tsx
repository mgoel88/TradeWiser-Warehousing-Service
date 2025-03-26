import React from "react";
import { cn } from "@/lib/utils";

interface StepsProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
}

export function Steps({ children, currentStep, totalSteps }: StepsProps) {
  const childrenArray = React.Children.toArray(children);
  const steps = childrenArray.filter(
    (child) => React.isValidElement(child) && child.type === Step
  );

  return (
    <div className="w-full">
      <div className="flex justify-between relative mb-2">
        {React.Children.map(steps, (step, i) => {
          return React.cloneElement(step as React.ReactElement, {
            isActive: currentStep === i,
            isCompleted: currentStep > i,
            isLastStep: i === steps.length - 1,
            stepNumber: i + 1,
            totalSteps: totalSteps || steps.length,
          });
        })}

        <div
          className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-muted"
          style={{ zIndex: -1 }}
        />
      </div>
    </div>
  );
}

interface StepProps {
  icon?: React.ReactNode;
  label: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isLastStep?: boolean;
  stepNumber?: number;
  totalSteps?: number;
}

export function Step({ 
  icon, 
  label, 
  isActive = false, 
  isCompleted = false,
  isLastStep = false,
  stepNumber,
  totalSteps
}: StepProps) {
  const isCompleteOrActive = isActive || isCompleted;

  return (
    <div className={cn(
      "flex flex-col items-center gap-1 min-w-0",
      {
        "flex-1": !isLastStep,
      }
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors relative",
        isActive && "bg-primary text-primary-foreground ring-2 ring-primary",
        isCompleted && "bg-primary text-primary-foreground",
        !isCompleteOrActive && "bg-muted text-muted-foreground",
      )}>
        {isCompleted ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : icon ? (
          <span className="w-4 h-4">{icon}</span>
        ) : (
          <span>{stepNumber}</span>
        )}
      </div>
      <span className={cn(
        "text-xs text-center font-medium",
        isCompleteOrActive ? "text-foreground" : "text-muted-foreground",
      )}>
        {label}
      </span>
    </div>
  );
}