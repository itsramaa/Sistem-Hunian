import { useQuery } from "@tanstack/react-query";
import { launchReadinessService } from "../services/launchReadinessService";

export function useLaunchReadiness() {
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['launch-readiness-metrics'],
    queryFn: launchReadinessService.fetchMetrics,
  });

  const checks = metrics ? launchReadinessService.getReadinessChecks(metrics) : [];
  
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const totalCount = checks.length;
  const readinessScore = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  const categories = ['core', 'operations', 'finance', 'intelligence', 'infrastructure'] as const;
  const checksByCategory = Object.fromEntries(
    categories.map(cat => [cat, checks.filter(c => c.category === cat)])
  );

  return {
    metrics,
    checks,
    checksByCategory,
    passCount,
    warnCount,
    failCount,
    totalCount,
    readinessScore,
    isLoading,
    error,
    refetch,
  };
}
