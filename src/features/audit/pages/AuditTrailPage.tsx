import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/axios";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  AlertTriangle,
} from "lucide-react";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useProperties } from "@/features/properties/hooks/useProperties";

interface RoomStatusLog {
  id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  reason: string;
}

const statusColors: Record<string, string> = {
  available:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dp_confirmation:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  occupied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [newStatusFilter, setNewStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [changedByFilter, setChangedByFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  const { data: propsData } = useProperties("", 1, 100);
  const properties = propsData?.properties ?? [];

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiClient.get("/users").then((r) => r.data?.data ?? []),
  });
  const users: any[] = usersData ?? [];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "audit-room-status",
      {
        page,
        limit,
        propertyFilter,
        newStatusFilter,
        fromDate,
        toDate,
        changedByFilter,
      },
    ],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (propertyFilter) params.property_id = propertyFilter;
      if (newStatusFilter) params.new_status = newStatusFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (changedByFilter) params.changed_by = changedByFilter;
      const { data } = await apiClient.get<any>("/audit/room-status", {
        params,
      });
      return { logs: data?.data ?? [], pagination: data?.pagination ?? null };
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.set("property_id", propertyFilter);
      if (newStatusFilter) params.set("new_status", newStatusFilter);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      if (changedByFilter) params.set("changed_by", changedByFilter);
      const response = await apiClient.get(
        `/audit/room-status/export?${params}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const logs: RoomStatusLog[] = data?.logs ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fmt = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy HH:mm", { locale: localeId });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Riwayat perubahan status kamar
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={propertyFilter || "_all"}
          onValueChange={(v) => {
            setPropertyFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] rounded-xl h-10">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua properti</SelectItem>
            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={newStatusFilter || "_all"}
          onValueChange={(v) => {
            setNewStatusFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] rounded-xl h-10">
            <SelectValue placeholder="Semua perubahan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua perubahan</SelectItem>
            <SelectItem value="occupied">→ Terisi</SelectItem>
            <SelectItem value="available">→ Tersedia</SelectItem>
            <SelectItem value="dp_confirmation">→ Konfirmasi DP</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            placeholder="Dari tanggal"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            placeholder="Sampai tanggal"
          />
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="h-10 px-2 text-xs"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Filter by user */}
        {users.length > 0 && (
          <Select
            value={changedByFilter || "_all"}
            onValueChange={(v) => {
              setChangedByFilter(v === "_all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] rounded-xl h-10">
              <SelectValue placeholder="Semua user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua user</SelectItem>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Export CSV */}
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 rounded-xl h-10 ml-auto"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive/50" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Gagal memuat data audit trail
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {getApiErrorMessage(error)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage(1)}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                <TableHead className="font-semibold text-xs uppercase">
                  Kamar
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  Properti
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  Status Lama
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  Status Baru
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  Alasan
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  Waktu
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Belum ada riwayat perubahan status.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-primary/5 transition-colors"
                  >
                    <TableCell className="text-sm font-medium">
                      {log.nomor_kamar || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.nama_properti || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[log.old_status] ?? ""}`}
                      >
                        {log.old_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[log.new_status] ?? ""}`}
                      >
                        {log.new_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.reason || "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {fmt(log.changed_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari{" "}
            {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
