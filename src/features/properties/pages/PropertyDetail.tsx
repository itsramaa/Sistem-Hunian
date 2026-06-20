import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Building2, Edit, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MerchantLayout } from "@/app/layouts/MerchantLayout";
import { ContentSkeleton } from "@/shared/components/ui/ContentSkeleton";
import { FormModal } from "@/shared/components/FormModal";
import { DataTable, Column } from "@/shared/components/DataTable";
import { RoomStatusBadge, RoomStatus } from "@/shared/components/StatusBadge";
import { apiClient } from "@/shared/lib/axios";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "sonner";

interface Property {
  id: string;
  nama: string;
  alamat: string;
  deskripsi: string;
  jumlah_kamar: number;
  created_at: string;
}

interface Room {
  id: string;
  nomor_kamar: string;
  tipe_kamar: string;
  harga_sewa: number;
  status: RoomStatus;
  penghuni_aktif: string | null;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ["properties", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Property>(`/properties/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", { property_id: id }],
    queryFn: async () => {
      const { data } = await apiClient.get("/rooms", { params: { property_id: id, limit: 100 } });
      return data;
    },
    enabled: !!id,
  });
  const rooms: Room[] = roomsData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Properti berhasil dihapus");
      navigate("/properties");
    },
    onError: (err: Error) => {
      toast.error("Gagal menghapus properti", { description: err.message });
    },
  });

  const columns: Column<Room>[] = [
    {
      key: "nomor_kamar",
      header: "No. Kamar",
      render: (row) => (
        <Link to={`/rooms/${row.id}`} className="font-medium hover:underline">
          {row.nomor_kamar}
        </Link>
      ),
    },
    { key: "tipe_kamar", header: "Tipe", render: (row) => row.tipe_kamar },
    { key: "harga_sewa", header: "Harga Sewa", render: (row) => formatCurrency(row.harga_sewa) },
    { key: "status", header: "Status", render: (row) => <RoomStatusBadge status={row.status} /> },
    {
      key: "penghuni",
      header: "Penghuni",
      render: (row) => row.penghuni_aktif ?? <span className="text-muted-foreground">—</span>,
    },
  ];

  if (isLoading) return <ContentSkeleton />;

  if (!property) {
    return (
      <MerchantLayout title="Properti Tidak Ditemukan">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Properti tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/properties">Kembali</Link></Button>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout
      title={property.nama}
      description={property.alamat}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/properties")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending || rooms.length > 0}
            onClick={() => deleteMutation.mutate()}
            title={rooms.length > 0 ? "Hapus semua kamar dulu (BR-006)" : ""}
          >
            Hapus
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Property Info */}
        <Card>
          <CardHeader><CardTitle>Detail Properti</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Nama</p>
                <p className="font-medium">{property.nama}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Kamar</p>
                <p className="font-medium">{property.jumlah_kamar}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Alamat</p>
              <p className="font-medium">{property.alamat}</p>
            </div>
            {property.deskripsi && (
              <div>
                <p className="text-muted-foreground">Deskripsi</p>
                <p>{property.deskripsi}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rooms List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kamar ({rooms.length})</CardTitle>
            <Button size="sm" asChild>
              <Link to={`/rooms?property_id=${id}`}>
                <Plus className="h-4 w-4 mr-1" /> Tambah Kamar
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<Room>
              data={rooms}
              columns={columns}
              isLoading={roomsLoading}
              emptyMessage="Belum ada kamar untuk properti ini"
            />
          </CardContent>
        </Card>
      </div>
    </MerchantLayout>
  );
}
