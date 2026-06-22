import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, BedDouble, Building2, DollarSign, Users, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/shared/utils/utils';

interface RoomDetail {
  id: string;
  nomor_kamar: string;
  property_id: string;
  nama_properti: string;
  tipe_kamar: string;
  harga_sewa: number;
  status: 'available' | 'occupied' | 'dp_confirmation';
  penghuni_aktif?: string;
  tenant_id?: string;
  tanggal_masuk?: string;
  durasi_sewa?: number;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  available: {
    label: 'Tersedia',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  dp_confirmation: {
    label: 'Konfirmasi DP',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  occupied: {
    label: 'Terisi',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: room, isLoading, error } = useQuery<RoomDetail>({
    queryKey: ['room', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail kamar...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BedDouble className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Kamar tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Kamar yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/rooms')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Kamar
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[room.status];

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <BedDouble className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Kamar {room.nomor_kamar}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('rounded-full', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {room.nama_properti}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Informasi Kamar</span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Nomor Kamar</dt>
              <dd className="text-sm font-medium text-foreground">{room.nomor_kamar}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tipe Kamar</dt>
              <dd className="text-sm font-medium text-foreground">{room.tipe_kamar}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <Badge className={cn('rounded-full text-xs', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Harga & Properti</span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Harga Sewa</dt>
              <dd className="text-sm font-bold text-foreground tabular-nums">
                Rp{room.harga_sewa.toLocaleString('id-ID')}
              </dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-sm text-muted-foreground">Properti</dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {room.nama_properti}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Current Occupancy Info */}
      {room.status === 'occupied' && room.penghuni_aktif && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Penghuni Aktif</span>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground mb-0.5">Nama Penghuni</dt>
              <dd className="text-sm font-medium text-foreground">{room.penghuni_aktif}</dd>
            </div>
            {room.tanggal_masuk && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Tanggal Masuk</dt>
                <dd className="text-sm font-medium text-foreground">
                  {format(new Date(room.tanggal_masuk), 'dd MMM yyyy', { locale: localeId })}
                </dd>
              </div>
            )}
            {room.durasi_sewa && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Durasi Sewa</dt>
                <dd className="text-sm font-medium text-foreground">{room.durasi_sewa} bulan</dd>
              </div>
            )}
          </dl>
          {room.tenant_id && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-2 rounded-xl"
              onClick={() => navigate(`/dashboard/tenants/${room.tenant_id}`)}
            >
              <Users className="h-4 w-4" />
              Lihat Detail Penghuni
            </Button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/properties/${room.property_id}`)}
          >
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Lihat Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">{room.nama_properti}</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/payments?room_id=${room.id}`)}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Histori Pembayaran</p>
              <p className="text-xs text-muted-foreground">Lihat riwayat pembayaran</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
