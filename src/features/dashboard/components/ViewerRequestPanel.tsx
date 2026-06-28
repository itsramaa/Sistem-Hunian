import React, { useState } from "react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { DollarSign, Send, Users, Wrench } from "lucide-react";
import { useCreateViewerRequest } from "@/features/viewer-requests/hooks/useViewerRequests";
import { useToast } from "@/shared/hooks/use-toast";
import type { ViewerRequestType } from "@/features/viewer-requests/types";

const REQUEST_OPTIONS: {
  request_type: ViewerRequestType;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    request_type: "payment",
    label: "Ada Pembayaran Masuk",
    subLabel: "Beri tahu Operator bahwa penghuni sudah bayar",
    icon: <DollarSign className="w-5 h-5" />,
    color: "bg-green-500",
  },
  {
    request_type: "damage",
    label: "Ada Kerusakan",
    subLabel: "Laporkan kerusakan fasilitas di kamar atau properti",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-orange-500",
  },
  {
    request_type: "prospect",
    label: "Ada Calon Penghuni",
    subLabel: "Informasikan ada tamu yang ingin menyewa kamar",
    icon: <Users className="w-5 h-5" />,
    color: "bg-blue-500",
  },
];

export function ViewerRequestPanel({
  rooms,
  properties,
}: {
  rooms: any[];
  properties: any[];
}) {
  const [activeType, setActiveType] = useState<ViewerRequestType | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");

  const createReq = useCreateViewerRequest();
  const { toast } = useToast();

  const filteredRooms = selectedPropertyId
    ? rooms.filter((r) => r.property_id === selectedPropertyId)
    : [];

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleSubmit = () => {
    if (!selectedPropertyId || !selectedRoomId || !description) return;
    createReq.mutate(
      {
        request_type: activeType!,
        property_id: selectedPropertyId,
        room_id: selectedRoomId,
        description,
        prospect_name: activeType === "prospect" ? prospectName || null : null,
        prospect_phone:
          activeType === "prospect" ? prospectPhone || null : null,
      },
      {
        onSuccess: (res) => {
          setActiveType(null);
          setSelectedPropertyId("");
          setSelectedRoomId("");
          setDescription("");
          setProspectName("");
          setProspectPhone("");
          const waFailed = res?.status === "wa_failed";
          toast({
            title: "Laporan berhasil dicatat",
            description: waFailed
              ? "Permintaan tersimpan, namun notifikasi WhatsApp tidak dapat dikirim karena koneksi WA sedang tidak aktif."
              : "Operator akan segera menerima notifikasi WhatsApp.",
            variant: waFailed ? "destructive" : "default",
          });
        },
      },
    );
  };

  const handleTypeSelect = (type: ViewerRequestType) => {
    setActiveType(activeType === type ? null : type);
    setSelectedPropertyId("");
    setSelectedRoomId("");
    setDescription("");
    setProspectName("");
    setProspectPhone("");
  };

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Lapor Cepat
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Tekan tombol di bawah untuk mengirim laporan ke operator via WhatsApp.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {REQUEST_OPTIONS.map((opt) => (
          <button
            key={opt.request_type}
            onClick={() => handleTypeSelect(opt.request_type)}
            className={cn(
              "glass-card p-3 flex flex-col items-center gap-2 text-center transition-all cursor-pointer",
              activeType === opt.request_type
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                opt.color,
              )}
            >
              {opt.icon}
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">
              {opt.label}
            </span>
            <span className="text-xs text-muted-foreground leading-tight text-center">
              {opt.subLabel}
            </span>
          </button>
        ))}
      </div>

      {activeType && (
        <div className="glass-card p-4 space-y-3 animate-in fade-in">
          <p className="text-sm font-semibold text-foreground">
            {REQUEST_OPTIONS.find((o) => o.request_type === activeType)?.label}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Properti
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedRoomId("");
              }}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Pilih properti...</option>
              {properties.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.property_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Nomor Kamar
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={!selectedPropertyId}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">
                {selectedPropertyId ? "Pilih kamar..." : "Pilih properti dulu"}
              </option>
              {filteredRooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.room_number}
                </option>
              ))}
            </select>
          </div>

          {activeType === "prospect" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Calon (opsional)
                </label>
                <input
                  type="text"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="Nama calon penghuni"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  No HP Calon (opsional)
                </label>
                <input
                  type="text"
                  value={prospectPhone}
                  onChange={(e) => setProspectPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Keterangan
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={
                activeType === "payment"
                  ? "Contoh: sudah transfer via BCA"
                  : activeType === "damage"
                    ? "Contoh: AC bocor, kipas tidak nyala"
                    : "Contoh: calon penghuni mau masuk tgl 1"
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedPropertyId ||
                !selectedRoomId ||
                !description ||
                createReq.isPending
              }
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-1" />
              {createReq.isPending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveType(null)}
              disabled={createReq.isPending}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
