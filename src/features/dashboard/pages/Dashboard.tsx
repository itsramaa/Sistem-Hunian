import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useDashboardSummary,
  useDashboardAlerts,
  useNotifications,
  useMarkNotificationRead,
  DpAlert,
  PaymentAlert,
  Notification,
} from '@/features/dashboard/hooks/useDashboard';
import {
  Building2, BedDouble, CheckCircle2, Users, Clock,
  Bell, AlertTriangle, AlertCircle, Loader2,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '@/shared/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  bgClass: string;
  isLoading: boolean;
  accent?: boolean;
  onClick?: () => void;
}

function SummaryCard({ label, value, icon, bgClass, isLoading, accent, onClick }: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-stat-card p-4 flex flex-col gap-3 min-w-0',
        accent && 'ring-1 ring-primary/20',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]'
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bgClass)}>
        {icon}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <div className="h-7 w-12 bg-muted animate-pulse rounded-lg mb-1" />
        ) : (
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
            {value ?? 0}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────

function AlertItem({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 text-sm',
        danger
          ? 'bg-destructive/10 text-destructive dark:bg-destructive/15'
          : 'bg-amber-50 text-amber-900 dark:bg-warning/15 dark:text-warning-foreground'
      )}
    >
      <AlertCircle
        className={cn('mt-0.5 h-4 w-4 shrink-0', danger ? 'text-destructive' : 'text-amber-600 dark:text-warning')}
      />
      <span className="leading-snug">{children}</span>
    </li>
  );
}

// ─── Alert Panel ──────────────────────────────────────────────────────────────

function AlertPanel() {
  const { data: alerts, isLoading } = useDashboardAlerts();
  const dpAlerts: DpAlert[] = alerts?.dp_alerts ?? [];
  const paymentAlerts: PaymentAlert[] = alerts?.payment_alerts ?? [];
  const total = dpAlerts.length + paymentAlerts.length;

  if (isLoading) {
    return (
      <section aria-label="Alert Panel" className="glass-card p-4 space-y-3">
        <div className="h-5 w-36 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded-xl" />
        <div className="h-12 bg-muted animate-pulse rounded-xl" />
      </section>
    );
  }

  if (total === 0) return null;

  return (
    <section aria-label="Perlu Perhatian" className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold text-foreground">Perlu Perhatian</h2>
        </div>
        <span className="text-xs font-medium bg-warning/15 text-warning rounded-full px-2 py-0.5">
          {total}
        </span>
      </div>
      <ul className="space-y-2">
        {dpAlerts.map((a) => (
          <AlertItem key={a.confirmation_id} danger={a.tipe === 'dp_expired'}>
            <span>
              <strong>{a.nama_calon_penghuni}</strong>
              {' — '}Kamar {a.nomor_kamar} · {a.nama_properti}
              <br />
              <span className="text-xs opacity-80">
                {a.tipe === 'dp_expired'
                  ? 'DP sudah expired'
                  : `DP berakhir ${a.sisa_hari} hari lagi`}
              </span>
            </span>
          </AlertItem>
        ))}
        {paymentAlerts.map((a) => (
          <AlertItem key={`${a.room_id}-${a.periode}`} danger={a.tipe === 'payment_overdue'}>
            <span>
              <strong>{a.nama_penghuni}</strong>
              {' — '}Kamar {a.nomor_kamar} · {a.nama_properti}
              <br />
              <span className="text-xs opacity-80">
                {a.tipe === 'payment_overdue' ? 'Pembayaran terlambat' : 'Mendekati jatuh tempo'}
                {a.periode ? ` · ${a.periode}` : ''}
              </span>
            </span>
          </AlertItem>
        ))}
      </ul>
    </section>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel() {
  const [showAll, setShowAll] = React.useState(false);
  const { data: rawNotifications, isLoading } = useNotifications(showAll ? undefined : false);
  const { mutate: markRead } = useMarkNotificationRead();
  const items: Notification[] = Array.isArray(rawNotifications) ? rawNotifications : [];

  return (
    <section aria-label="Notifikasi" className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Notifikasi</h2>
          {!showAll && items.length > 0 && (
            <span className="text-xs font-medium bg-primary/15 text-primary rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? 'Belum dibaca' : 'Lihat semua'}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-14 bg-muted animate-pulse rounded-xl" />
          <div className="h-14 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 text-muted-foreground">
          <Bell className="h-8 w-8 opacity-30" />
          <p className="text-sm">{showAll ? 'Tidak ada notifikasi.' : 'Tidak ada notifikasi baru.'}</p>
        </div>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto -mx-1 px-1">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                !n.is_read ? 'bg-muted/60' : 'opacity-70'
              )}
            >
              <div className="flex-1 min-w-0">
                {!n.is_read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-1.5 mb-0.5" />
                )}
                <span className={cn('leading-snug', !n.is_read && 'font-medium')}>
                  {n.pesan}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeId })}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-primary hover:underline shrink-0 mt-0.5"
                  aria-label="Tandai sudah dibaca"
                >
                  Baca
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch } = useDashboardSummary();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const isOperator = role === 'operator';
  const isManagerOrAbove = role === 'operator' || role === 'manager';

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const summaryCards = [
    {
      label: 'Total Properti',
      value: summary?.total_properti,
      icon: <Building2 className="h-5 w-5 text-primary" />,
      bgClass: 'bg-primary/10',
      onClick: () => navigate('/dashboard/properties'),
    },
    {
      label: 'Total Kamar',
      value: summary?.total_kamar,
      icon: <BedDouble className="h-5 w-5 text-secondary" />,
      bgClass: 'bg-secondary/10',
      onClick: () => navigate('/dashboard/rooms'),
    },
    {
      label: 'Tersedia',
      value: summary?.kamar_available,
      icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      accent: true,
      onClick: () => navigate('/dashboard/rooms?status=available'),
    },
    {
      label: 'Terisi',
      value: summary?.kamar_occupied,
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      onClick: () => navigate('/dashboard/rooms?status=occupied'),
    },
    {
      label: 'Konfirmasi DP',
      value: summary?.kamar_dp_confirmation,
      icon: <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      onClick: () => navigate('/dashboard/confirmations'),
    },
  ];

  // Occupancy rate for a quick visual indicator
  const occupancyRate =
    summary && summary.total_kamar > 0
      ? Math.round((summary.kamar_occupied / summary.total_kamar) * 100)
      : null;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selamat datang,{' '}
            <span className="font-medium text-foreground">{user?.nama ?? 'Pengguna'}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Occupancy banner — shown when data loaded */}
      {!summaryLoading && occupancyRate !== null && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-muted-foreground">Tingkat Hunian</p>
              <p className="text-sm font-bold text-foreground">{occupancyRate}%</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${occupancyRate}%` }}
                role="progressbar"
                aria-valuenow={occupancyRate}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {summary?.kamar_occupied ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">dari {summary?.total_kamar ?? 0}</p>
          </div>
        </div>
      )}

      {summaryLoading && (
        <div className="glass-card p-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-2 bg-muted animate-pulse rounded-full" />
        </div>
      )}

      {/* Summary Cards — 2-col grid on mobile, 5-col on desktop */}
      <section aria-label="Ringkasan Status Kamar">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Ringkasan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              bgClass={card.bgClass}
              isLoading={summaryLoading}
              accent={card.accent}
              onClick={card.onClick}
            />
          ))}
        </div>
      </section>

      {/* Alert Panel — operator & manajer */}
      {isManagerOrAbove && <AlertPanel />}

      {/* Notification Panel — operator only */}
      {isOperator && <NotificationPanel />}
    </div>
  );
}
