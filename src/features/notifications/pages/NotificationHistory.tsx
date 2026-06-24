import {
  Notification,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotifications,
} from "@/features/dashboard/hooks/useDashboard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { cn } from "@/shared/utils/utils";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const tipeLabel: Record<string, string> = {
  dp_reminder: "Pengingat DP",
  dp_expired: "DP Kedaluwarsa",
  payment_due: "Jatuh Tempo",
  payment_overdue: "Pembayaran Terlambat",
};

const tipeColor: Record<string, string> = {
  dp_reminder: "text-yellow-600",
  dp_expired: "text-red-600",
  payment_due: "text-yellow-600",
  payment_overdue: "text-red-600",
};

const getDeepLinkByTipe = (tipe: string | null): string | null => {
  switch (tipe) {
    case "dp_reminder":
    case "dp_expired":
      return "/dashboard/confirmations";
    case "payment_due":
    case "payment_overdue":
      return "/dashboard/payments";
    case "maintenance":
      return "/dashboard/maintenance";
    default:
      return null;
  }
};

export default function NotificationHistory() {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const { data: rawNotifications, isLoading } = useNotifications(
    showAll ? undefined : false,
  );
  const notifications: Notification[] = Array.isArray(rawNotifications)
    ? rawNotifications
    : [];
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () =>
        toast.success("Semua notifikasi berhasil ditandai sebagai dibaca"),
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
        <div className="flex gap-2">
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Belum Dibaca" : "Lihat Semua"}
          </Button>
          {unreadCount > 0 && (
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
            const deepLink = getDeepLinkByTipe(n.tipe);
            const isClickable = !!deepLink;
            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors glass-card",
                  !n.is_read &&
                    "border-l-4 border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-950/10",
                  isClickable && "cursor-pointer hover:bg-primary/5",
                )}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  if (deepLink) navigate(deepLink);
                }}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            tipeColor[n.tipe] ?? "text-muted-foreground",
                          )}
                        >
                          {tipeLabel[n.tipe] ?? n.tipe}
                        </span>
                        {!n.is_read && (
                          <Badge className="text-xs h-4 px-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                            Baru
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-sm", !n.is_read && "font-medium")}>
                        {n.pesan}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    {!n.is_read && (
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
