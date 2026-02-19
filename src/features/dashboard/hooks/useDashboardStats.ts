import { supabase } from "@/lib/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { useEffect } from "react";
import { dashboardService } from "../services/dashboardService";
import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";

export type DateRange = 'today' | '7d' | '30d' | 'all';

export function useDashboardStats(dateRange: DateRange, isAdminProp?: boolean) {
  const { isLoading: guardLoading, isAdmin: guardIsAdmin } = useAdminGuard();
  const isAdmin = isAdminProp ?? guardIsAdmin; // Use prop if provided, else hook
  const queryClient = useQueryClient();

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      default:
        return null;
    }
  };

  // Real-time subscription for updates
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_verifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-recent-activity'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['admin-dashboard-stats', dateRange],
    queryFn: () => dashboardService.fetchStats(getDateFilter()),
    enabled: !!isAdmin,
  });

  const { data: pendingVerifications = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: dashboardService.fetchPendingVerifications,
    enabled: !!isAdmin,
  });

  const { data: recentActivity = [], isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: dashboardService.fetchRecentActivity,
    enabled: !!isAdmin,
  });

  const refresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchPending(),
      refetchActivity()
    ]);
  };

  return {
    statsData,
    pendingVerifications,
    recentActivity,
    isLoading: statsLoading || pendingLoading || activityLoading,
    error: statsError,
    refresh,
    guardLoading
  };
}
