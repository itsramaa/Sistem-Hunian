import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { UpdateProfilePayload, UpdateTenantPayload } from '../types';

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId!),
    enabled: !!userId,
  });
};

export const useTenantProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['tenant-profile', userId],
    queryFn: () => profileService.getTenantProfile(userId!),
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateProfilePayload }) =>
      profileService.updateProfile(userId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
};

export const useUpdateTenantProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateTenantPayload }) =>
      profileService.updateTenantProfile(userId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-profile', variables.userId] });
    },
  });
};

export const useUploadKtp = () => {
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      profileService.uploadKtp(userId, file),
  });
};
