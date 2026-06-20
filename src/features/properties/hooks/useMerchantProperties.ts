import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../api/propertyService';
import { CreatePropertyPayload, UpdatePropertyPayload } from '../types';

export function useMerchantProperties(merchantId: string) {
  const queryClient = useQueryClient();

  const { 
    data: properties = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['merchant-properties', merchantId],
    queryFn: () => propertyService.fetchProperties(merchantId),
    enabled: !!merchantId,
  });

  const { mutateAsync: createProperty, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertyService.createProperty(payload, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-properties', merchantId] });
    },
  });

  const { mutateAsync: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePropertyPayload }) =>
      propertyService.updateProperty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-properties', merchantId] });
    },
  });

  const { mutateAsync: deleteProperty, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => propertyService.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-properties', merchantId] });
    },
  });

  const checkCanDelete = async (id: string) => {
    return propertyService.canDeleteProperty(id);
  };

  return { 
    properties, 
    loading, 
    error, 
    refetch,
    createProperty,
    isCreating,
    updateProperty,
    isUpdating,
    deleteProperty,
    isDeleting,
    checkCanDelete
  };
}

export function usePropertiesWithUnits(merchantId: string) {
  return useQuery({
    queryKey: ['properties-with-units', merchantId],
    queryFn: () => propertyService.fetchPropertiesWithUnits(merchantId),
    enabled: !!merchantId,
  });
}
