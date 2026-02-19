import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analyticsService";
import { DashboardStats, DistributionStats, MonthlyRevenueData, SubscriptionAnalyticsData, TenantAnalyticsData } from "../types";

export function useAdminAnalytics(dateRange?: { from?: Date; to?: Date }, enabled = true) {
  const { data: dashboardStats, isLoading: dashboardStatsLoading, error: dashboardStatsError } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: analyticsService.fetchDashboardStats,
    enabled,
  });

  const { data: distributionStats, isLoading: distributionStatsLoading, error: distributionStatsError } = useQuery<DistributionStats>({
    queryKey: ['admin-distribution-stats'],
    queryFn: analyticsService.fetchDistributionStats,
    enabled,
  });

  const { data: monthlyRevenueData = [], error: monthlyRevenueError } = useQuery<MonthlyRevenueData[]>({
    queryKey: ['monthly-revenue'],
    queryFn: analyticsService.fetchMonthlyRevenue,
    enabled,
  });

  const { data: tenantAnalytics, isLoading: tenantLoading, error: tenantError } = useQuery<TenantAnalyticsData>({
    queryKey: ['tenant-analytics'],
    queryFn: analyticsService.fetchTenantAnalytics,
    enabled,
  });

  const { data: subscriptionAnalytics, isLoading: subscriptionLoading, error: subscriptionError } = useQuery<SubscriptionAnalyticsData>({
    queryKey: ['subscription-analytics'],
    queryFn: analyticsService.fetchSubscriptionAnalytics,
    enabled,
  });

  return {
    dashboardStats,
    dashboardStatsLoading,
    dashboardStatsError,
    distributionStats,
    distributionStatsLoading,
    distributionStatsError,
    monthlyRevenueData,
    monthlyRevenueError,
    tenantAnalytics,
    tenantLoading,
    tenantError,
    subscriptionAnalytics,
    subscriptionLoading,
    subscriptionError,
  };
}
