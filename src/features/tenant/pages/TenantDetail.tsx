import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, User, BedDouble, Building2, Phone, CreditCard, Calendar, Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/shared/utils/utils';

interface TenantDetail {
  id: string;
  room_id: string;
  nomor_kamar: string;
  property_id: string;
  nama_properti: string;
  nama: string;
  nomor_identitas: string;
  nomor_telepon: string;
  tanggal_masuk: string;
  durasi_sewa: number;
  status: 'active' | 'checked_out';
  tanggal_keluar?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  active: {
    label: 'Aktif',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  checked_out: {
    label: 'Checkout',
    className: 'bg-muted text-muted-foreground',
  },
};

const fmt = (d: string) => {
  try { return format(new Date(d), 'dd MMMM yyyy', { locale: localeId }); }
  catch { return d; }
};

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

  const statusInfo = statusConfig[tenant.status];

  // Calculate check-out date from tanggal_masuk + durasi_sewa months
  const tanggalMasuk = new Date(tenant.tanggal_masuk);
  const estimatedCheckout = new Date(tanggalMasuk);
  estimatedCheckout.setMonth(estimatedCheckout.getMonth() + tenant.durasi_sewa);

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{tenant.nama}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={cn('rounded-full', statusInfo.className)}>
              {statusInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Kamar {tenant.nomor_kamar} · {tenant.nama_properti}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Data Pribadi</span>
        </div>
        <dl className="space-y-2.5">
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> No. Identitas
            </dt>
            <dd className="text-sm font-medium text-foreground tabular-nums">{tenant.nomor_identitas}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> No. Telepon
            </dt>
            <dd className="text-sm font-medium text-foreground">{tenant.nomor_telepon}</dd>
          </div>
        </dl>
      </div>

      {/* Tenancy Info */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Info Hunian</span>
        </div>
        <dl className="space-y-2.5">
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Tanggal Masuk</dt>
            <dd className="text-sm font-medium text-foreground">{fmt(tenant.tanggal_masuk)}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Durasi Sewa</dt>
            <dd className="text-sm font-medium text-foreground">{tenant.durasi_sewa} bulan</dd>
          </div>
          {tenant.status === 'active' ? (
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Est. Berakhir</dt>
              <dd className="text-sm font-medium text-foreground">
                {format(estimatedCheckout, 'dd MMMM yyyy', { locale: localeId })}
              </dd>
            </div>
          ) : tenant.tanggal_keluar ? (
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tanggal Keluar</dt>
              <dd className="text-sm font-medium text-foreground">{fmt(tenant.tanggal_keluar)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between items-start">
            <dt className="text-sm text-muted-foreground">Kamar & Properti</dt>
            <dd className="text-sm font-medium text-foreground text-right">
              {tenant.nomor_kamar} · {tenant.nama_properti}
            </dd>
          </div>
        </dl>
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
            onClick={() => navigate(`/dashboard/payments?tenant_id=${tenant.id}`)}
          >
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Riwayat Pembayaran</p>
              <p className="text-xs text-muted-foreground">Lihat semua tagihan</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
