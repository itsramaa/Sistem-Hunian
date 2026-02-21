import { Badge } from "@/shared/components/ui/badge";
import { MoveOutNotice, MoveOutInspection } from "../types";
import { differenceInDays } from "date-fns";

interface MoveOutStatusBadgeProps {
  notice: MoveOutNotice;
  inspection?: MoveOutInspection;
}

export const MoveOutStatusBadge = ({ notice, inspection }: MoveOutStatusBadgeProps) => {
  const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());

  if (notice.status === "completed") {
    return <Badge className="bg-success text-success-foreground">Completed</Badge>;
  }
  if (inspection?.status === "completed") {
    return <Badge variant="secondary">Inspection Done</Badge>;
  }
  if (inspection?.status === "scheduled") {
    return <Badge variant="outline">Inspection Scheduled</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="destructive">Urgent - {daysUntil} days</Badge>;
  }
  return <Badge variant="secondary">{daysUntil} days left</Badge>;
};
