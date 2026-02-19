import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useMemo, useState } from "react";
import { orderService } from "../services/orderService";
import { MonthlyOrderStat, Order, OrderStats, VendorPerformance } from "../types/orders";

export const useOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const [orders, vendors, reviews] = await Promise.all([
        orderService.fetchOrders(),
        orderService.fetchVendors(),
        orderService.fetchReviews(),
      ]);

      return { orders, vendors, reviews };
    },
  });

  const orders = data?.orders || [];
  const vendors = data?.vendors || [];
  const reviews = data?.reviews || [];

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendors?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Calculate stats
  const stats: OrderStats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const canceledOrders = orders.filter((o) => o.status === "canceled").length;
    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalServiceFees = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.service_fee || 0), 0);

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      canceledOrders,
      totalRevenue,
      totalServiceFees,
    };
  }, [orders]);

  // Monthly order trend
  const monthlyStats: MonthlyOrderStat[] = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthOrders = orders.filter((o) => {
        const createdAt = new Date(o.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      const monthRevenue = monthOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number(o.total_price), 0);

      months.push({
        month: format(date, "MMM"),
        orders: monthOrders.length,
        revenue: monthRevenue,
      });
    }
    return months;
  }, [orders]);

  // Top vendors by orders
  const topVendors: VendorPerformance[] = useMemo(() => {
    const vendorOrderCounts: Record<string, { name: string; orders: number; revenue: number; rating: number }> = {};
    orders.forEach((order) => {
      const vendorId = order.vendor_id;
      const vendor = vendors.find((v) => v.id === vendorId);
      if (!vendorOrderCounts[vendorId]) {
        vendorOrderCounts[vendorId] = {
          name: vendor?.business_name || "Unknown",
          orders: 0,
          revenue: 0,
          rating: vendor?.rating || 0,
        };
      }
      vendorOrderCounts[vendorId].orders++;
      if (order.status === "completed") {
        vendorOrderCounts[vendorId].revenue += Number(order.total_price);
      }
    });

    return Object.values(vendorOrderCounts)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map((v, i) => ({ ...v, id: i.toString() }));
  }, [orders, vendors]);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    return [
      { name: "Pending", value: stats.pendingOrders, fill: "hsl(var(--warning))" },
      { name: "Confirmed", value: orders.filter((o) => o.status === "confirmed").length, fill: "hsl(var(--info))" },
      { name: "In Progress", value: orders.filter((o) => o.status === "in_progress").length, fill: "hsl(var(--primary))" },
      { name: "Completed", value: stats.completedOrders, fill: "hsl(var(--success))" },
      { name: "Canceled", value: stats.canceledOrders, fill: "hsl(var(--destructive))" },
    ];
  }, [orders, stats]);

  return {
    orders,
    vendors,
    reviews,
    filteredOrders,
    stats,
    monthlyStats,
    topVendors,
    orderStatusData,
    isLoading,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  };
};
