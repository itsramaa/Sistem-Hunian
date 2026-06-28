import { useViewerRequests } from "@/features/viewer-requests/hooks/useViewerRequests";
import { SectionHeader } from "@/features/profile/components/SectionHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Inbox } from "lucide-react";

const requestTypeLabel: Record<string, string> = {
  payment: "Pembayaran",
  damage: "Kerusakan",
  prospect: "Calon Penghuni",
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "outline" | "secondary" | "destructive";
  }
> = {
  forwarded: { label: "Diteruskan", variant: "default" },
  wa_failed: { label: "WA Gagal", variant: "destructive" },
};

export function ViewerRequestsCard() {
  const [page] = [1];
  const { data, isLoading } = useViewerRequests(page);
  const requests = data?.data ?? [];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<Inbox className="h-4 w-4 text-primary" />}
          title="Permintaan Tindakan Viewer"
          description="Histori permintaan yang diajukan Viewer"
        />
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Belum ada permintaan masuk
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const status = statusConfig[req.status] ?? {
                label: req.status,
                variant: "secondary" as const,
              };
              return (
                <div
                  key={req.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {requestTypeLabel[req.request_type] ?? req.request_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Kamar {req.room_number}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {req.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.reporter_name} ·{" "}
                      {formatDistanceToNow(new Date(req.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={status.variant}
                    className="rounded-full text-xs shrink-0"
                  >
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
