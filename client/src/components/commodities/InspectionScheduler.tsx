
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const TIME_SLOTS = [
  "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "14:00-15:00", "15:00-16:00", "16:00-17:00"
];

export default function InspectionScheduler({ commodityId }: { commodityId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>();
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!date || !timeSlot) return;

    try {
      const response = await apiRequest('POST', '/api/inspections/schedule', {
        commodityId,
        date: date.toISOString(),
        timeSlot
      });

      if (response.ok) {
        toast({
          title: "Inspection Scheduled",
          description: `Your inspection is scheduled for ${date.toLocaleDateString()} at ${timeSlot}`
        });
        setIsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Schedule Failed",
        description: "Failed to schedule inspection. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <CalendarIcon className="h-4 w-4 mr-2" />
        Schedule Inspection
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Commodity Inspection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date() || date > new Date().setDate(new Date().getDate() + 14)}
            />

            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button onClick={handleSchedule} disabled={!date || !timeSlot}>
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
