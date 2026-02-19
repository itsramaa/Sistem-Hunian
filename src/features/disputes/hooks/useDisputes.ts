import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { disputesService } from "../services/disputesService";
import { ResolveDisputeParams } from "../types/disputes";

export function useDisputes(page: number, pageSize: number, isAdmin: boolean) {
  const queryClient = useQueryClient();

  const { data: disputesData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-disputes', page, pageSize],
    queryFn: () => disputesService.fetchDisputes(page, pageSize),
    enabled: isAdmin,
  });

  const disputes = disputesData?.disputes || [];
  const totalCount = disputesData?.total || 0;
  const hasMore = page * pageSize < totalCount;

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ params, currentStatus }: { params: ResolveDisputeParams; currentStatus: string }) => {
      await disputesService.resolveDispute(params, currentStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute resolved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to resolve dispute'),
  });

  return {
    disputes,
    totalCount,
    hasMore,
    isLoading,
    error,
    refetch,
    resolveDispute: resolveDisputeMutation,
  };
}
