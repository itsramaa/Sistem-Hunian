import {
  Notification,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearReadNotifications,
  useNotifications,
} from "@/features/dashboard/hooks/useDashboard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { DataCard } from "@/shared/components/DataCard";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { cn } from "@/shared/utils/utils";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const tipeLabel: Record<string, string> = {
  dp_reminder: "Pengingat DP",
  dp_expired: "DP Kedaluwarsa",
  payment_due: "Jatuh Tempo",
  payment_overdue: "Pembayaran Terlambat",
  contract_reminder: "Pengingat Kontrak",
  login_new_device: "Login Perangkat Baru",
  viewer_request: "Laporan Viewer",
};

const tipeColor: Record<string, string> = {
  dp_reminder: "text-yellow-600",
  dp_expired: "text-red-600",
  payment_due: "text-yellow-600",
  payment_overdue: "text-red-600",
  contract_reminder: "text-blue-600",
  login_new_device: "text-orange-600",
  viewer_request: "text-purple-600",
};

const getDeepLinkByType = (type: string | null): string | null => {
  switch (type) {
    case "dp_reminder":
    case "dp_expired":
      return "/dashboard/confirmations";
    case "payment_due":
    case "payment_overdue":
      return "/dashboard/payments";
    case "contract_reminder":
      return "/dashboard/tenants";
    case "viewer_request":
      return "/dashboard/viewer-requests";
    case "login_new_device":
      return null;
    default:
      return null;
  }
};

export default function NotificationHistory() {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { role } = useAuth();
  const isOperator = role === "operator";

  const { data: rawNotifications, isLoading } = useNotifications(
    showAll ? undefined : false,
  );
  const notifications: Notification[] = Array.isArray(rawNotifications)
    ? rawNotifications
    : [];
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();
  const { mutate: clearRead, isPending: isClearing } =
    useClearReadNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () =>
        toast.success("Semua notifikasi berhasil ditandai sebagai dibaca"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleClearRead = () => {
    clearRead(undefined, {
      onSuccess: () =>
        toast.success("Notifikasi yang sudah dibaca berhasil dihapus"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-5 w-full max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Riwayat notifikasi operasional
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Belum Dibaca" : "Lihat Semua"}
          </Button>
          {isOperator && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tandai Semua Dibaca
            </Button>
          )}
          {isOperator && readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRead}
              disabled={isClearing}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Hapus yang Dibaca
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Memuat...
            </CardContent>
          </Card>
        )}

        {!isLoading && notifications.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {showAll ? "Belum ada notifikasi" : "Tidak ada notifikasi baru"}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          notifications.map((n: Notification) => {
            const deepLink = getDeepLinkByType(n.type);
            const handleClick = () => {
              if (!n.is_read) markRead(n.id);
              if (deepLink) navigate(deepLink);
            };

            if (isMobile) {
              return (
                <DataCard
                  key={n.id}
                  onClick={deepLink ? handleClick : undefined}
                  className={cn(
                    !n.is_read &&
                      "border-l-4 border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-950/10",
                  )}
                  header={
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            tipeColor[n.type] ?? "text-muted-foreground",
                          )}
                        >
                          {tipeLabel[n.type] ?? n.type}
                        </span>
                        {!n.is_read && (
                          <Badge className="text-xs h-4 px-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                            Baru
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </span>
                    </div>
                  }
                  fields={[
                    {
                      label: "Pesan",
                      value: (
                        <span className={cn(!n.is_read && "font-medium")}>
                          {n.message}
                        </span>
                      ),
                      fullWidth: true,
                    },
                  ]}
                  actions={
                    isOperator && !n.is_read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                      >
                        Tandai dibaca
                      </Button>
                    ) : undefined
                  }
                />
              );
            }

            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors glass-card",
                  !n.is_read &&
                    "border-l-4 border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-950/10",
                  deepLink && "cursor-pointer hover:bg-primary/5",
                )}
                onClick={handleClick}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            tipeColor[n.type] ?? "text-muted-foreground",
                          )}
                        >
                          {tipeLabel[n.type] ?? n.type}
                        </span>
                        {!n.is_read && (
                          <Badge className="text-xs h-4 px-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                            Baru
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-sm", !n.is_read && "font-medium")}>
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    {isOperator && !n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs h-7 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                      >
                        Tandai dibaca
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
