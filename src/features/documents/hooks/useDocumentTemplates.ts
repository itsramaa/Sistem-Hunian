import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  type TemplateVariable,
} from '../services/documentTemplateService';

export function useDocumentTemplates(merchantId: string | undefined, category?: string) {
  return useQuery({
    queryKey: ['document-templates', merchantId, category],
    queryFn: () => fetchTemplates(merchantId!, category),
    enabled: !!merchantId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: 'Template berhasil dibuat' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal membuat template', description: error.message });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string; category: string; content: string; variables: TemplateVariable[] }> }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: 'Template berhasil diperbarui' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal memperbarui', description: error.message });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: 'Template berhasil dihapus' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: error.message });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, merchantId }: { id: string; merchantId: string }) =>
      duplicateTemplate(id, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: 'Template berhasil diduplikasi' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal menduplikasi', description: error.message });
    },
  });
}
