import React, { useState } from "react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { DollarSign, Send, Users, Wrench } from "lucide-react";
import { useCreateViewerRequest } from "@/features/viewer-requests/hooks/useViewerRequests";

type RequestJenis = "pembayaran" | "kerusakan" | "calon_penghuni";

const REQUEST_OPTIONS: {
  jenis: RequestJenis;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    jenis: "pembayaran",
    label: "Ada Pembayaran Masuk",
    icon: <DollarSign className="w-5 h-5" />,
    color: "bg-green-500",
  },
  {
    jenis: "kerusakan",
    label: "Ada Kerusakan",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-orange-500",
  },
  {
    jenis: "calon_penghuni",
    label: "Ada Calon Penghuni",
    icon: <Users className="w-5 h-5" />,
    color: "bg-blue-500",
  },
];

export function ViewerRequestPanel({ rooms }: { rooms: any[] }) {
  const [activeJenis, setActiveJenis] = useState<RequestJenis | null>(null);
  const [nomorKamar, setNomorKamar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [namaCalon, setNamaCalon] = useState("");
  const [noHPCalon, setNoHPCalon] = useState("");

  const createReq = useCreateViewerRequest();

  const handleSubmit = () => {
    if (!nomorKamar || !keterangan) return;
    createReq.mutate(
      {
        jenis: activeJenis!,
        room_id: rooms.find((r) => r.nomor_kamar === nomorKamar)?.id ?? null,
        nomor_kamar: nomorKamar,
        keterangan,
        nama_calon: activeJenis === "calon_penghuni" ? namaCalon || null : null,
        no_hp_calon: activeJenis === "calon_penghuni" ? noHPCalon || null : null,
      },
      {
        onSuccess: () => {
          setActiveJenis(null);
          setNomorKamar("");
          setKeterangan("");
          setNamaCalon("");
          setNoHPCalon("");
        },
      },
    );
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
            key={opt.jenis}
            onClick={() =>
              setActiveJenis(activeJenis === opt.jenis ? null : opt.jenis)
            }
            className={cn(
              "glass-card p-3 flex flex-col items-center gap-2 text-center transition-all cursor-pointer",
              activeJenis === opt.jenis
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
          </button>
        ))}
      </div>

      {activeJenis && (
        <div className="glass-card p-4 space-y-3 animate-in fade-in">
          <p className="text-sm font-semibold text-foreground">
            {REQUEST_OPTIONS.find((o) => o.jenis === activeJenis)?.label}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Nomor Kamar
            </label>
            <select
              value={nomorKamar}
              onChange={(e) => setNomorKamar(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Pilih kamar...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.nomor_kamar}>
                  {r.nomor_kamar} — {r.property_name}
                </option>
              ))}
            </select>
          </div>

          {activeJenis === "calon_penghuni" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Calon
                </label>
                <input
                  type="text"
                  value={namaCalon}
                  onChange={(e) => setNamaCalon(e.target.value)}
                  placeholder="Nama calon penghuni"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  No HP Calon
                </label>
                <input
                  type="text"
                  value={noHPCalon}
                  onChange={(e) => setNoHPCalon(e.target.value)}
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
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder={
                activeJenis === "pembayaran"
                  ? "Contoh: kamar 5 sudah bayar tunai"
                  : activeJenis === "kerusakan"
                    ? "Contoh: AC kamar 3 bocor"
                    : "Contoh: calon penghuni mau masuk tgl 1"
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!nomorKamar || !keterangan || createReq.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-1" />
              {createReq.isPending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveJenis(null);
                setNomorKamar("");
                setKeterangan("");
                setNamaCalon("");
                setNoHPCalon("");
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
