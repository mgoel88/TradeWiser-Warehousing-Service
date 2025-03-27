
import * as React from "react";
import { TIME_SLOTS, getAvailableTimeSlots } from "@/lib/time-slots";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  selectedDate: Date;
  value?: string;
  onChange: (timeSlot: string) => void;
}

export function TimeSlotPicker({ selectedDate, value, onChange }: TimeSlotPickerProps) {
  const availableSlots = getAvailableTimeSlots(selectedDate);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {availableSlots.map((slot) => (
        <Button
          key={slot.start}
          variant="outline"
          className={cn(
            "w-full",
            value === slot.start && "bg-primary text-primary-foreground"
          )}
          onClick={() => onChange(slot.start)}
        >
          {slot.label}
        </Button>
      ))}
    </div>
  );
}
