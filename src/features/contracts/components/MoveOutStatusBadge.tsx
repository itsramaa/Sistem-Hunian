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
    return <Badge className="rounded-full bg-success text-success-foreground">Selesai</Badge>;
  }
  if (inspection?.status === "completed") {
    return <Badge variant="secondary" className="rounded-full">Inspeksi Selesai</Badge>;
  }
  if (inspection?.status === "scheduled") {
    return <Badge variant="outline" className="rounded-full">Inspeksi Terjadwal</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="destructive" className="rounded-full">Mendesak - {daysUntil} hari</Badge>;
  }
  return <Badge variant="secondary" className="rounded-full">{daysUntil} hari tersisa</Badge>;
};
