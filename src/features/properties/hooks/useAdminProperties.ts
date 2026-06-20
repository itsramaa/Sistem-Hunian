
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPropertyService } from '../api/adminPropertyService';
import { AdminProperty } from '../types/admin';

export function useAdminProperties() {
  return useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => adminPropertyService.getAllProperties(),
  });
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminProperty['status'] }) => 
      adminPropertyService.updatePropertyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    },
  });
}
