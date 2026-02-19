import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitService } from '../services/unitService';
import { CreateUnitPayload, UpdateUnitPayload } from '../types';
import { useToast } from '@/shared/hooks/use-toast';

export function useUnits(propertyId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: units = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['units', propertyId],
    queryFn: () => unitService.fetchUnits(propertyId),
    enabled: !!propertyId,
  });

  const createUnitMutation = useMutation({
    mutationFn: (payload: CreateUnitPayload) => unitService.createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', propertyId] });
      toast({ title: 'Unit Created', description: 'New unit has been added successfully' });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create unit',
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitPayload }) => 
      unitService.updateUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', propertyId] });
      toast({ title: 'Unit Updated', description: 'Unit has been updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update unit',
      });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: string) => unitService.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', propertyId] });
      toast({ title: 'Unit Deleted', description: 'Unit has been deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete unit',
      });
    },
  });

  return {
    units,
    isLoading,
    error,
    refetch,
    createUnit: createUnitMutation.mutateAsync,
    updateUnit: updateUnitMutation.mutateAsync,
    deleteUnit: deleteUnitMutation.mutateAsync,
    isCreating: createUnitMutation.isPending,
    isUpdating: updateUnitMutation.isPending,
    isDeleting: deleteUnitMutation.isPending,
  };
}
