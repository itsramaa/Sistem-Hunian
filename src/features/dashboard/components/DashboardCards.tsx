import React from "react";
import { cn } from "@/shared/utils/utils";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useDashboardAlerts } from "@/features/dashboard/hooks/useDashboard";
import type { DpAlert, PaymentAlert } from "@/features/dashboard/types";

// ─── SummaryCard ─────────────────────────────────────────────────────────────

export interface SummaryCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  bgClass: string;
  isLoading: boolean;
  accent?: boolean;
  onClick?: () => void;
}

export function SummaryCard({
  label,
  value,
  icon,
  bgClass,
  isLoading,
  accent,
  onClick,
}: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-stat-card p-4 flex flex-col gap-3 min-w-0",
        accent && "ring-1 ring-primary/20",
        onClick &&
          "cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          bgClass,
        )}
      >
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

// ─── AlertItem ────────────────────────────────────────────────────────────────

function AlertItem({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 text-sm",
        danger
          ? "bg-destructive/10 text-destructive dark:bg-destructive/15"
          : "bg-amber-50 text-amber-900 dark:bg-warning/15 dark:text-warning-foreground",
      )}
    >
      <AlertCircle
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          danger ? "text-destructive" : "text-amber-600 dark:text-warning",
        )}
      />
      <span className="leading-snug">{children}</span>
    </li>
  );
}

// ─── AlertPanel ───────────────────────────────────────────────────────────────

export function AlertPanel() {
  const { data: alerts, isLoading } = useDashboardAlerts();
  const dpAlerts: DpAlert[] = alerts?.dp_alerts ?? [];
  const paymentAlerts: PaymentAlert[] = alerts?.payment_alerts ?? [];
  const total = dpAlerts.length + paymentAlerts.length;

  if (isLoading) {
    return (
      <section aria-label="Alert Panel" className="glass-card p-4 space-y-3">
        <div className="h-5 w-36 bg-muted animate-pulse rounded" />
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
          <h2 className="text-sm font-semibold text-foreground">
            Perlu Perhatian
          </h2>
        </div>
        <span className="text-xs font-medium bg-warning/15 text-warning rounded-full px-2 py-0.5">
          {total}
        </span>
      </div>
      <ul className="space-y-2">
        {dpAlerts.map((a) => (
          <AlertItem key={a.confirmation_id} danger={a.type === "dp_expired"}>
            <span>
              <strong>{a.prospect_name}</strong>
              {" — "}Kamar {a.room_number} · {a.property_name}
              <br />
              <span className="text-xs opacity-80">
                {a.type === "dp_expired"
                  ? "DP sudah expired"
                  : `DP berakhir ${a.remaining_days} hari lagi`}
              </span>
            </span>
          </AlertItem>
        ))}
        {paymentAlerts.map((a) => (
          <AlertItem
            key={`${a.room_id}-${a.period}`}
            danger={a.type === "payment_overdue"}
          >
            <span>
              <strong>{a.tenant_name}</strong>
              {" — "}Kamar {a.room_number} · {a.property_name}
              <br />
              <span className="text-xs opacity-80">
                {a.type === "payment_overdue"
                  ? "Pembayaran terlambat"
                  : "Mendekati jatuh tempo"}
                {a.period ? ` · ${a.period}` : ""}
              </span>
            </span>
          </AlertItem>
        ))}
      </ul>
    </section>
  );
}
