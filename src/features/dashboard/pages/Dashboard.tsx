import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useDashboardSummary,
  useDashboardAlerts,
  useNotifications,
  useMarkNotificationRead,
} from '@/features/dashboard/hooks/useDashboard';
import { Building2, BedDouble, CheckCircle2, Users, Clock, Bell, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// ─── Summary Card ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
}

function SummaryCard({ label, value, icon, colorClass, isLoading }: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
      <div className={cn('rounded-lg p-3', colorClass)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        {isLoading ? (
          <Loader2 className="mt-1 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

// ─── Alert Panel ─────────────────────────────────────────────────────────────

function AlertPanel() {
  const { data: alerts, isLoading } = useDashboardAlerts();

  const dpAlerts = alerts?.dp_alerts ?? [];
  const paymentAlerts = alerts?.payment_alerts ?? [];
  const total = dpAlerts.length + paymentAlerts.length;

  if (isLoading) {
    return (
      <section aria-label="Alert Panel" className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" /> Perlu Perhatian
        </h2>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat alert...
        </div>
      </section>
    );
  }

  if (total === 0) return null;

  return (
    <section aria-label="Alert Panel" className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500" /> Perlu Perhatian
        <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full px-2 py-0.5">
          {total}
        </span>
      </h2>
      <ul className="space-y-2">
        {dpAlerts.map((a) => (
          <li
            key={a.confirmation_id}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-2 text-sm',
              a.tipe === 'dp_expired'
                ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            )}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>{a.nama_calon_penghuni}</strong> — Kamar {a.nomor_kamar} ({a.nama_properti})
              {a.tipe === 'dp_expired'
                ? ' · DP sudah expired'
                : ` · DP berakhir ${a.sisa_hari} hari lagi`}
            </span>
          </li>
        ))}
        {paymentAlerts.map((a) => (
          <li
            key={`${a.room_id}-${a.periode}`}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-2 text-sm',
              a.tipe === 'payment_overdue'
                ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            )}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>{a.nama_penghuni}</strong> — Kamar {a.nomor_kamar} ({a.nama_properti})
              {a.tipe === 'payment_overdue' ? ' · Pembayaran terlambat' : ' · Pembayaran mendekati jatuh tempo'}
              {a.periode ? ` · ${a.periode}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel() {
  const [showAll, setShowAll] = React.useState(false);
  const { data: notifications, isLoading } = useNotifications(showAll ? undefined : false);
  const { mutate: markRead } = useMarkNotificationRead();

  const items = notifications ?? [];

  return (
    <section aria-label="Notification Panel" className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Notifikasi
          {!showAll && items.length > 0 && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          {showAll ? 'Hanya belum dibaca' : 'Lihat semua'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat notifikasi...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada notifikasi{!showAll ? ' yang belum dibaca' : ''}.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                n.is_read ? 'text-muted-foreground' : 'bg-muted font-medium'
              )}
            >
              <span className="flex-1">{n.pesan}</span>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeId })}
                </span>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs text-primary hover:underline"
                    aria-label="Tandai sudah dibaca"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

import React from 'react';

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();

  const isOperator = role === 'operator';
  const isManagerOrAbove = role === 'operator' || role === 'manager';

  const summaryCards = [
    {
      label: 'Total Properti',
      value: summary?.total_properti,
      icon: <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />,
      colorClass: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'Total Kamar',
      value: summary?.total_kamar,
      icon: <BedDouble className="h-5 w-5 text-gray-600 dark:text-gray-300" />,
      colorClass: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'Tersedia',
      value: summary?.kamar_available,
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      colorClass: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Terisi',
      value: summary?.kamar_occupied,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      colorClass: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Konfirmasi DP',
      value: summary?.kamar_dp_confirmation,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      colorClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang, <span className="font-medium text-foreground">{user?.nama ?? 'Pengguna'}</span>
        </p>
      </div>

      {/* Summary Cards — all roles */}
      <section aria-label="Ringkasan Status Kamar">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Ringkasan
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              colorClass={card.colorClass}
              isLoading={summaryLoading}
            />
          ))}
        </div>
      </section>

      {/* Alert Panel — operator & manager only */}
      {isManagerOrAbove && <AlertPanel />}

      {/* Notification Panel — operator only */}
      {isOperator && <NotificationPanel />}
    </div>
  );
}
