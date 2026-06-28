import { useState } from "react";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { viewerRequestApi } from "../api/viewerRequestApi";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { DataCard } from "@/shared/components/DataCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { ViewerRequest } from "../types";

const STATUS_LABELS: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  forwarded: {
    label: "Berhasil Diteruskan",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  wa_failed: {
    label: "Gagal Diteruskan",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const TYPE_LABELS: Record<string, string> = {
  payment: "Pembayaran",
  damage: "Kerusakan",
  prospect: "Calon Penghuni",
};

function fmt(d: string) {
  try {
    return format(new Date(d), "dd MMM yyyy HH:mm", { locale: localeId });
  } catch {
    return d;
  }
}

export default function ViewerRequestsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("_all");

  const { data, isLoading } = useQuery({
    queryKey: ["viewer-requests", page, statusFilter],
    queryFn: () =>
      viewerRequestApi.list(page, statusFilter === "_all" ? undefined : statusFilter),
  });

  const requests: ViewerRequest[] = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5 w-full max-w-7xl pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Permintaan Tindakan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Riwayat permintaan yang telah Anda kirimkan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] rounded-xl h-10">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua Status</SelectItem>
            <SelectItem value="forwarded">Berhasil Diteruskan</SelectItem>
            <SelectItem value="wa_failed">Gagal Diteruskan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Send className="h-10 w-10 text-muted-foreground/40" />}
          title="Belum ada permintaan"
          description="Permintaan tindakan yang Anda kirim akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const statusInfo = STATUS_LABELS[r.status] ?? STATUS_LABELS.wa_failed;
            return (
              <div
                key={r.id}
                className="glass-card p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {TYPE_LABELS[r.request_type] ?? r.request_type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Kamar {r.room_number}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  {r.prospect_name && (
                    <p className="text-xs text-muted-foreground">
                      Calon: {r.prospect_name}
                      {r.prospect_phone ? ` · ${r.prospect_phone}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{fmt(r.created_at)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs gap-1 ${statusInfo.className}`}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">{total} permintaan</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="flex items-center text-sm px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
