import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { 
  Bell, Check, CheckCheck, Search, Filter,
  CreditCard, FileText, Wrench, AlertTriangle, Info,
  Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  link: string | null;
  created_at: string;
}

const NOTIFICATION_CATEGORIES = [
  { value: 'all', label: 'Semua', icon: Bell },
  { value: 'payment', label: 'Pembayaran', icon: CreditCard },
  { value: 'invoice', label: 'Invoice', icon: FileText },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'warning', label: 'Peringatan', icon: AlertTriangle },
  { value: 'info', label: 'Info', icon: Info },
];

const ITEMS_PER_PAGE = 10;

export default function NotificationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notification-history', user?.id, category, search, readFilter],
    queryFn: async () => {
      if (!user?.id) return { items: [], total: 0 };
      try {
        const params: Record<string, unknown> = { user_id: user.id, order: 'created_at.desc' };
        if (category !== 'all') params.type = category;
        if (readFilter === 'unread') params.read = false;
        else if (readFilter === 'read') params.read = true;
        if (search) params.search = search;
        const r = await apiClient.get('/notifications', { params });
        const items = r.data as Notification[];
        return { items, total: items.length };
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user?.id,
  });

  const notifications = notificationsData?.items || [];
  const totalItems = notificationsData?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedNotifications = notifications.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.put('/notifications/' + notificationId, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await apiClient.put('/notifications/mark-all-read', { user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Semua notifikasi telah dibaca');
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete('/notifications/' + notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifikasi dihapus');
    },
  });

  const getNotificationIcon = (type: string | null) => {
    const category = NOTIFICATION_CATEGORIES.find(c => c.value === type);
    const Icon = category?.icon || Info;
    
    const colorMap: Record<string, string> = {
      payment: 'text-green-500',
      invoice: 'text-blue-500',
      maintenance: 'text-orange-500',
      warning: 'text-yellow-500',
      info: 'text-primary',
    };
    
    return <Icon className={`h-5 w-5 ${colorMap[type || 'info'] || 'text-primary'}`} />;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link?.startsWith('/')) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <TenantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Riwayat Notifikasi</h1>
            <p className="text-muted-foreground">
              {totalItems} notifikasi • {unreadCount} belum dibaca
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari notifikasi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <TabsList className="w-full flex-wrap h-auto gap-1">
                {NOTIFICATION_CATEGORIES.map((cat) => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Read/Unread Filter */}
            <div className="flex gap-2">
              <Button
                variant={readFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setReadFilter('all'); setPage(1); }}
              >
                Semua
              </Button>
              <Button
                variant={readFilter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setReadFilter('unread'); setPage(1); }}
              >
                Belum Dibaca
              </Button>
              <Button
                variant={readFilter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setReadFilter('read'); setPage(1); }}
              >
                Sudah Dibaca
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Tidak ada notifikasi ditemukan</p>
              </div>
            ) : (
              <div className="divide-y">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">Baru</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: id 
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead.mutate(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification.mutate(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
