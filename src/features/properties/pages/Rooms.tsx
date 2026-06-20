import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Home, Filter } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { MerchantLayout } from "@/app/layouts/MerchantLayout";
import { FormModal } from "@/shared/components/FormModal";
import { RoomStatusBadge, RoomStatus } from "@/shared/components/StatusBadge";
import { apiClient } from "@/shared/lib/axios";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { ContentSkeleton } from "@/shared/components/ui/ContentSkeleton";

interface Room {
  id: string;
  property_id: string;
  nama_properti: string;
  nomor_kamar: string;
  tipe_kamar: string;
  harga_sewa: number;
  status: RoomStatus;
  penghuni_aktif: string | null;
}

interface Property { id: string; nama: string; }

const schema = z.object({
  property_id: z.string().uuid("Pilih properti"),
  nomor_kamar: z.string().min(1, "Nomor kamar wajib diisi"),
  tipe_kamar: z.string().min(1, "Tipe kamar wajib diisi"),
  harga_sewa: z.coerce.number().positive("Harga harus lebih dari 0"),
});
type FormValues = z.infer<typeof schema>;

const statusCount = (rooms: Room[], s: RoomStatus) => rooms.filter(r => r.status === s).length;

function RoomForm({ properties, defaultValues, roomId, onSuccess }: {
  properties: Property[];
  defaultValues?: Partial<FormValues>;
  roomId?: string;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { property_id: "", nomor_kamar: "", tipe_kamar: "Standar", harga_sewa: 0, ...defaultValues },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => roomId ? apiClient.put(`/rooms/${roomId}`, v) : apiClient.post("/rooms", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(roomId ? "Kamar diperbarui" : "Kamar berhasil ditambahkan");
      form.reset();
      onSuccess();
    },
    onError: (err: Error) => toast.error("Gagal menyimpan", { description: err.message }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-4 pt-2">
        <FormField control={form.control} name="property_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Properti</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih properti" /></SelectTrigger></FormControl>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="nomor_kamar" render={({ field }) => (
            <FormItem>
              <FormLabel>No. Kamar</FormLabel>
              <FormControl><Input placeholder="A01" className="rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="tipe_kamar" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe</FormLabel>
              <FormControl><Input placeholder="Standar" className="rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="harga_sewa" render={({ field }) => (
          <FormItem>
            <FormLabel>Harga Sewa / Bulan (Rp)</FormLabel>
            <FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} className="w-full gradient-cta text-primary-foreground rounded-xl h-11 font-semibold">
          {mutation.isPending ? "Menyimpan..." : roomId ? "Simpan Perubahan" : "Tambah Kamar"}
        </Button>
      </form>
    </Form>
  );
}

export default function Rooms() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => { const { data } = await apiClient.get("/properties", { params: { limit: 100 } }); return data; },
  });
  const properties: Property[] = propertiesData?.data ?? [];

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ["rooms", { property_id: filterProperty, status: filterStatus }],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "200" };
      if (filterProperty !== "all") params.property_id = filterProperty;
      if (filterStatus !== "all") params.status = filterStatus;
      const { data } = await apiClient.get("/rooms", { params });
      return data;
    },
  });
  const rooms: Room[] = roomsData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/rooms/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Kamar dihapus"); },
    onError: (err: Error) => toast.error("Gagal menghapus", { description: err.message }),
  });

  if (isLoading) return <ContentSkeleton />;

  return (
    <MerchantLayout
      title="Manajemen Kamar"
      description="Kelola kamar dari semua properti"
      actions={
        <Button onClick={() => setCreateOpen(true)} className="gradient-cta text-primary-foreground rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Tambah Kamar
        </Button>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Kamar", value: rooms.length, color: "from-primary/15 to-secondary/10", textColor: "text-primary" },
          { label: "Tersedia", value: statusCount(rooms, "available"), color: "from-success/15 to-success/5", textColor: "text-success" },
          { label: "Terisi", value: statusCount(rooms, "occupied"), color: "from-info/15 to-info/5", textColor: "text-info" },
          { label: "Konfirmasi DP", value: statusCount(rooms, "dp_confirmation"), color: "from-warning/15 to-warning/5", textColor: "text-warning" },
        ].map(({ label, value, color, textColor }) => (
          <div key={label} className="glass-stat-card p-4">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", textColor)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-filter-bar flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Filter:</span>
        </div>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-48 h-8 rounded-full text-xs border-border/60">
            <SelectValue placeholder="Semua Properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Properti</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          {[
            { value: "all", label: "Semua" },
            { value: "available", label: "Tersedia" },
            { value: "occupied", label: "Terisi" },
            { value: "dp_confirmation", label: "DP" },
          ].map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={filterStatus === value ? "default" : "outline"}
              className={cn(
                "h-8 rounded-full text-xs px-3",
                filterStatus === value && "gradient-cta text-primary-foreground border-0"
              )}
              onClick={() => setFilterStatus(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">No. Kamar</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Properti</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Harga Sewa</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Penghuni</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Home className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Belum ada kamar</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : rooms.map((room) => (
              <TableRow key={room.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                <TableCell className="font-display font-semibold">{room.nomor_kamar}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{room.nama_properti}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-full text-xs">{room.tipe_kamar}</Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(room.harga_sewa)}</TableCell>
                <TableCell><RoomStatusBadge status={room.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {room.penghuni_aktif ?? <span className="italic">Kosong</span>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10"
                      onClick={() => setEditRoom(room)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      disabled={room.status !== "available" || deleteMutation.isPending}
                      title={room.status !== "available" ? "Kamar tidak bisa dihapus (BR-007)" : ""}
                      onClick={() => deleteMutation.mutate(room.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FormModal open={createOpen} onOpenChange={setCreateOpen} title="Tambah Kamar">
        <RoomForm properties={properties} onSuccess={() => setCreateOpen(false)} />
      </FormModal>
      <FormModal open={!!editRoom} onOpenChange={o => { if (!o) setEditRoom(null); }} title="Edit Kamar">
        {editRoom && (
          <RoomForm properties={properties} roomId={editRoom.id}
            defaultValues={{ property_id: editRoom.property_id, nomor_kamar: editRoom.nomor_kamar, tipe_kamar: editRoom.tipe_kamar, harga_sewa: editRoom.harga_sewa }}
            onSuccess={() => setEditRoom(null)} />
        )}
      </FormModal>
    </MerchantLayout>
  );
}
