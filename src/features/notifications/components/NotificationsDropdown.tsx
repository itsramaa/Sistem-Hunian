import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  FileText,
  CreditCard,
  Wrench,
  Settings,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  tipe: string | null;
  pesan: string;
  is_read: boolean;
  created_at: string;
  referensi_id?: string | null;
}

export function NotificationsDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const _channelRef = useRef<null>(null);

  const { data: rawNotifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const r = await apiClient.get("/notifications", {
        params: { is_read: false },
      });
      // Backend returns { success, data: [...], pagination }
      return Array.isArray(r.data?.data) ? r.data.data : [];
    },
    enabled: !!user?.id,
  });

  // Polling fallback
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Gagal menandai notifikasi"),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Semua notifikasi telah dibaca");
    },
    onError: () => toast.error("Gagal menandai semua notifikasi"),
  });

  // Always safe array
  const notifications: Notification[] = Array.isArray(rawNotifications)
    ? rawNotifications
    : [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTitleByType = (tipe: string | null): string => {
    switch (tipe) {
      case "dp_reminder":
        return "Pengingat DP";
      case "dp_expired":
        return "DP Kedaluwarsa";
      case "payment_due":
        return "Tagihan Jatuh Tempo";
      case "payment_overdue":
        return "Tagihan Terlambat";
      case "payment":
        return "Pembayaran";
      case "maintenance":
        return "Laporan Kerusakan";
      case "invoice":
        return "Invoice";
      case "warning":
        return "Peringatan";
      case "rls_alert":
        return "Peringatan Keamanan";
      case "login_new_device":
        return "Login Perangkat Baru";
      default:
        return "Notifikasi";
    }
  };

  const getNotificationIcon = (tipe: string | null) => {
    switch (tipe) {
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "invoice":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "rls_alert":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case "login_new_device":
        return <ShieldCheck className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getDeepLinkByType = (tipe: string | null): string | null => {
    switch (tipe) {
      case "dp_reminder":
      case "dp_expired":
        return "/dashboard/confirmations";
      case "payment_due":
      case "payment_overdue":
      case "payment":
        return "/dashboard/payments";
      case "maintenance":
        return "/dashboard/maintenance";
      case "invoice":
        return "/dashboard/payments";
      case "login_new_device":
        return "/dashboard/profile";
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead.mutate(notification.id);
    const target = getDeepLinkByType(notification.tipe);
    if (target) {
      navigate(target);
      setOpen(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Baca semua
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                navigate("/dashboard/settings");
                setOpen(false);
              }}
              aria-label="Pengaturan notifikasi"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isExpanded = expandedId === notification.id;
              const isLongMessage = (notification.pesan?.length ?? 0) > 80;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.is_read ? "bg-muted/50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}
                    >
                      {getTitleByType(notification.tipe)}
                    </p>
                    <p
                      className={`text-xs text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}
                    >
                      {notification.pesan}
                    </p>
                    {isLongMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 mt-1 text-xs text-muted-foreground"
                        onClick={(e) => toggleExpand(e, notification.id)}
                      >
                        {isExpanded ? (
                          <>
                            Lebih sedikit <ChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Selengkapnya{" "}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
