import React, { useState, useRef } from "react";
import { getAssetUrl } from "@/shared/utils/utils";
import { useParams, useNavigate } from "react-router-dom";
import {
  useMaintenanceById,
  useUpdateMaintenance,
  useUploadFotoKerusakan,
  useUploadFotoPenanganan,
  useMaintenanceLogs,
} from "../hooks/useMaintenance";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { MaintenanceProcessDialog } from "../components/MaintenanceProcessDialog";
import { MaintenanceCompleteDialog } from "../components/MaintenanceCompleteDialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";

import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  ArrowLeft,
  Wrench,
  BedDouble,
  Calendar,
  Loader2,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { getSiHuniStatus } from "@/shared/utils/statusColors";
import { formatCurrency } from "@/shared/utils/currency";
import { PhotoUploadButton } from "@/shared/components/ui/PhotoUploadButton";
import { useToast } from "@/shared/hooks/use-toast";

const MAX_FOTO_SIZE = 6 * 1024 * 1024; // 6 MB sesuai spesifikasi

const statusConfig = {
  reported: {
    label: getSiHuniStatus("reported").label,
    className: getSiHuniStatus("reported").className,
  },
  in_progress: {
    label: getSiHuniStatus("in_progress").label,
    className: getSiHuniStatus("in_progress").className,
  },
  completed: {
    label: getSiHuniStatus("completed").label,
    className: getSiHuniStatus("completed").className,
  },
} as const;

export default function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [processOpen, setProcessOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const fotoKerusakanRef = useRef<HTMLInputElement>(null);
  const fotoPenangananRef = useRef<HTMLInputElement>(null);

  const { data: maintenance, isLoading, error } = useMaintenanceById(id);
  const { data: logs } = useMaintenanceLogs(id);
  const maintenanceLogs: any[] = Array.isArray(logs) ? logs : [];
  const updateMutation = useUpdateMaintenance();
  const uploadKerusakanMutation = useUploadFotoKerusakan();
  const uploadPenangananMutation = useUploadFotoPenanganan();

  const handleProcess = async (id: string, handlerName: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          status: "in_progress",
          repair_action: `Ditangani oleh: ${handlerName}`,
        },
      });
      toast({ title: "Maintenance ditandai sedang diproses" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleComplete = async (
    id: string,
    actions: string[],
    costVal: number,
  ) => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          status: "completed",
          repair_action: actions.join("\n"),
          cost: costVal,
        },
      });
      toast({ title: "Maintenance ditandai selesai" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: getApiErrorMessage(err),
      });
    }
  };

  const openUpdate = () => {
    if (!maintenance) return;
    if (maintenance.status === "reported") {
      setProcessOpen(true);
    } else if (maintenance.status === "in_progress") {
      setCompleteOpen(true);
    }
  };

  const fmt = (d?: string) => {
    try {
      return d
        ? format(new Date(d), "dd MMMM yyyy", { locale: localeId })
        : "—";
    } catch {
      return d ?? "—";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail maintenance...</span>
      </div>
    );
  }

  if (error || !maintenance) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Wrench className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Laporan tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Laporan yang Anda cari tidak tersedia.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/maintenance")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[maintenance.status] ?? statusConfig.reported;

  return (
    <div className="space-y-5 w-full max-w-7xl pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Detail Maintenance
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                className={cn("rounded-full text-xs", statusInfo.className)}
              >
                {statusInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{id?.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/maintenance")}
            className="gap-2 rounded-xl hidden md:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
          {isOperator && maintenance.status !== "completed" && (
            <Button onClick={openUpdate} className="gap-2 rounded-xl" size="sm">
              <Pencil className="h-4 w-4" /> Update Progress
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Detail Laporan */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Detail Laporan
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-start gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">Kamar</dt>
              <dd className="text-sm font-medium text-foreground text-right">
                {maintenance.room_number || "—"}
              </dd>
            </div>
            <div className="flex justify-between items-start gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">
                Properti
              </dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {maintenance.property_name || "—"}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">
                Tanggal Laporan
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {fmt(maintenance.report_date)}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">Status</dt>
              <dd>
                <Badge
                  className={cn("rounded-full text-xs", statusInfo.className)}
                >
                  {statusInfo.label}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        {/* Biaya & Tindakan */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Penanganan
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">Biaya</dt>
              <dd className="text-sm font-medium text-foreground tabular-nums">
                {maintenance.cost != null
                  ? formatCurrency(maintenance.cost)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">
                Dicatat
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {fmt(maintenance.created_at)}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-sm text-muted-foreground shrink-0">
                Diupdate
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {fmt(maintenance.updated_at)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Deskripsi Kerusakan */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Deskripsi Kerusakan
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {maintenance.damage_description || "—"}
        </p>
      </div>

      {/* Tindakan Penanganan */}
      {maintenance.repair_action && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wrench className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tindakan Penanganan
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {maintenance.repair_action}
          </p>
        </div>
      )}

      {/* Foto Kerusakan */}
      {(maintenance.damage_photo_url || isOperator) && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Foto Kerusakan
              </span>
            </div>
            {isOperator && !maintenance.damage_photo_url && (
              <PhotoUploadButton
                label="Upload Foto"
                onUpload={async (file) => {
                  try {
                    await uploadKerusakanMutation.mutateAsync({
                      id: id!,
                      file,
                    });
                    toast({ title: "Foto kerusakan berhasil diupload" });
                  } catch (err) {
                    toast({
                      variant: "destructive",
                      title: "Gagal upload foto",
                      description: getApiErrorMessage(err),
                    });
                  }
                }}
                isUploading={uploadKerusakanMutation.isPending}
                showCamera
              />
            )}
          </div>
          {maintenance.damage_photo_url ? (
            <a
              href={getAssetUrl(maintenance.damage_photo_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={getAssetUrl(maintenance.damage_photo_url)}
                alt="Foto kerusakan"
                className="w-full max-h-64 object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Belum ada foto kerusakan
            </p>
          )}
        </div>
      )}

      {/* Foto Penanganan */}
      {(maintenance.repair_photo_url ||
        (isOperator && maintenance.status !== "reported")) && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Foto Penanganan
              </span>
            </div>
            {isOperator && !maintenance.repair_photo_url && (
              <PhotoUploadButton
                label="Upload Foto"
                onUpload={async (file) => {
                  try {
                    await uploadPenangananMutation.mutateAsync({
                      id: id!,
                      file,
                    });
                    toast({ title: "Foto penanganan berhasil diupload" });
                  } catch (err) {
                    toast({
                      variant: "destructive",
                      title: "Gagal upload foto",
                      description: getApiErrorMessage(err),
                    });
                  }
                }}
                isUploading={uploadPenangananMutation.isPending}
                showCamera
              />
            )}
          </div>
          {maintenance.repair_photo_url ? (
            <a
              href={getAssetUrl(maintenance.repair_photo_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={getAssetUrl(maintenance.repair_photo_url)}
                alt="Foto penanganan"
                className="w-full max-h-64 object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Belum ada foto penanganan
            </p>
          )}
        </div>
      )}

      {/* Progress Timeline */}
      {maintenanceLogs.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Riwayat Progress
          </h2>
          <div className="space-y-0">
            {maintenanceLogs.map((log: any, i: number) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn("w-3 h-3 rounded-full shrink-0 mt-0.5", {
                      "bg-yellow-500": log.status === "reported",
                      "bg-blue-500": log.status === "in_progress",
                      "bg-green-500": log.status === "completed",
                    })}
                  />
                  {i < maintenanceLogs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border my-1" />
                  )}
                </div>
                <div
                  className={cn(
                    "pb-3",
                    i === maintenanceLogs.length - 1 && "pb-0",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">
                    {log.status === "reported"
                      ? "Dilaporkan"
                      : log.status === "in_progress"
                        ? "Diproses"
                        : "Selesai"}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmt(log.created_at)}
                    {log.updated_by_name && ` · ${log.updated_by_name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/rooms/${maintenance.room_id}`)}
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Kamar</p>
              <p className="text-xs text-muted-foreground">
                Kamar {maintenance.room_number || "—"}
              </p>
            </div>
          </Button>
          {maintenance.status !== "completed" && (
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3 rounded-xl"
              onClick={openUpdate}
            >
              <Pencil className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Update Progress</p>
                <p className="text-xs text-muted-foreground">
                  Ubah status atau catat tindakan
                </p>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Process / Complete dialogs */}
      <MaintenanceProcessDialog
        maintenance={maintenance}
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        onSubmit={handleProcess}
      />
      <MaintenanceCompleteDialog
        maintenance={maintenance}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onSubmit={handleComplete}
      />
    </div>
  );
}
