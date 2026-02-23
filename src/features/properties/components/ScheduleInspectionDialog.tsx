import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { MoveOutNotice } from "@/features/contracts/types";

interface ScheduleInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: MoveOutNotice | null;
  onScheduled: () => void;
}

const TIME_SLOTS = [
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
];

export function ScheduleInspectionDialog({ open, onOpenChange, notice, onScheduled }: ScheduleInspectionDialogProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!notice) return null;

  const moveOutDate = new Date(notice.intended_move_out_date);
  const recommendedDate = addDays(moveOutDate, -7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }
    if (selectedDate > moveOutDate) {
      toast.error("Inspection must be scheduled before the move-out date");
      return;
    }
    if (selectedDate < today) {
      toast.error("Inspection date cannot be in the past");
      return;
    }
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);

    setIsSubmitting(true);
    try {
      const { error: inspectionError } = await supabase
        .from("move_out_inspections")
        .insert({
          move_out_notice_id: notice.id,
          scheduled_date: scheduledDateTime.toISOString(),
          inspector_id: user?.id,
          status: "scheduled",
        });
      if (inspectionError) throw inspectionError;

      await supabase
        .from("move_out_timeline")
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString(),
          notes: `Scheduled for ${format(scheduledDateTime, "MMM dd, yyyy 'at' HH:mm")}`
        })
        .eq("move_out_notice_id", notice.id)
        .eq("step", "inspection_scheduled");

      await supabase
        .from("move_out_notices")
        .update({ status: "in_progress" })
        .eq("id", notice.id);

      toast.success("Inspection scheduled successfully");
      onScheduled();
    } catch (error) {
      console.error("Error scheduling inspection:", error);
      const err = error as Error;
      toast.error(err.message || "Failed to schedule inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Move-Out Inspection</DialogTitle>
          <DialogDescription>
            {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Move-out date:</span>
              <span className="font-medium">{format(moveOutDate, "MMMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recommended inspection:</span>
              <span className="font-medium">{format(recommendedDate, "MMMM dd, yyyy")}</span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Inspection Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > moveOutDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selector */}
          <div className="space-y-2">
            <Label>Inspection Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist Preview */}
          <div className="p-4 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm space-y-2">
            <p className="font-medium text-sm">Inspection will cover:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Walls & ceiling condition</li>
              <li>• Flooring inspection</li>
              <li>• Appliances functionality</li>
              <li>• Plumbing & electrical</li>
              <li>• Cleanliness assessment</li>
              <li>• Keys returned</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule} 
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="flex-1 rounded-xl gradient-cta"
            >
              {isSubmitting ? "Scheduling..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
