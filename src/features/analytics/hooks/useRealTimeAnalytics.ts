import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { analyticsService } from "../services/analyticsService";

export function useRealTimeAnalytics() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch analytics events from the last 7 days
  const { data: events = [], refetch } = useQuery({
    queryKey: ['real-time-analytics'],
    queryFn: () => analyticsService.fetchAnalyticsEvents(7),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = analyticsService.subscribeToAnalytics(() => {
      refetch();
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, [refetch]);

  return { events, lastUpdate };
}
