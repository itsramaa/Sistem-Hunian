import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, User, BedDouble, Calendar, Clock, Loader2, Building2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/shared/utils/utils';

interface TenantDetail {
  id: string;
  nama: string;
  room_id: string;
  nomor_kamar: string;
  property_id: string;
  nama_properti: string;
  tanggal_masuk: string;
  durasi_sewa: number;
  status: 'active' | 'checkout';
  tanggal_keluar?: string;
  created_at: string;
  updated_at: string;
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tenant, isLoading, error } = useQuery<TenantDetail>({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tenants/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail penghuni...</span>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <User className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Penghuni tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Penghuni yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/tenants')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Penghuni
        </Button>
      </div>
    );
  }

  const isActive = tenant.status === 'active';
  const tanggalMasuk = new Date(tenant.tanggal_masuk);
  const tanggalKeluar = tenant.tanggal_keluar ? new Date(tenant.tanggal_keluar) : null;
  const today = new Date();
  
  const daysOccupied = isActive 
    ? differenceInDays(today, tanggalMasuk)
    : tanggalKeluar 
      ? differenceInDays(tanggalKeluar, tanggalMasuk)
      : 0;

  const monthsOccupied = Math.floor(daysOccupied / 30);

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {tenant.nama}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? 'default' : 'secondary'} className="rounded-full">
                  {isActive ? 'Aktif' : 'Checkout'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room & Property Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Informasi Kamar</span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Nomor Kamar</dt>
              <dd className="text-sm font-medium text-foreground">{tenant.nomor_kamar}</dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-sm text-muted-foreground">Properti</dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {tenant.nama_properti}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={isActive ? 'default' : 'secondary'} className="rounded-full text-xs">
                  {isActive ? 'Aktif' : 'Checkout'}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Periode Sewa</span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tanggal Masuk</dt>
              <dd className="text-sm font-medium text-foreground">
                {format(tanggalMasuk, 'dd MMM yyyy', { locale: localeId })}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Durasi Kontrak</dt>
              <dd className="text-sm font-medium text-foreground">{tenant.durasi_sewa} bulan</dd>
            </div>
            {tanggalKeluar && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Tanggal Keluar</dt>
                <dd className="text-sm font-medium text-foreground">
                  {format(tanggalKeluar, 'dd MMM yyyy', { locale: localeId })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Duration Summary */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Ringkasan Hunian</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Lama Menghuni</dt>
            <dd className="text-2xl font-bold text-foreground tabular-nums">{daysOccupied}</dd>
            <dd className="text-xs text-muted-foreground">hari</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Dalam Bulan</dt>
            <dd className="text-2xl font-bold text-foreground tabular-nums">{monthsOccupied}</dd>
            <dd className="text-xs text-muted-foreground">bulan</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Durasi Kontrak</dt>
            <dd className="text-2xl font-bold text-foreground tabular-nums">{tenant.durasi_sewa}</dd>
            <dd className="text-xs text-muted-foreground">bulan</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Status</dt>
            <dd className="text-xl font-bold text-foreground">{isActive ? '🟢' : '⚪'}</dd>
            <dd className="text-xs text-muted-foreground">{isActive ? 'Aktif' : 'Selesai'}</dd>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/rooms/${tenant.room_id}`)}
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Kamar</p>
              <p className="text-xs text-muted-foreground">Kamar {tenant.nomor_kamar}</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/properties/${tenant.property_id}`)}
          >
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">{tenant.nama_properti}</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/payments?room_id=${tenant.room_id}`)}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Histori Pembayaran</p>
              <p className="text-xs text-muted-foreground">Lihat pembayaran</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
