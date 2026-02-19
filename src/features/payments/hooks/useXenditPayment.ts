import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { xenditService, CreateXenditInvoicePayload } from '../services/xenditService';

export function useXenditPayment() {
  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateXenditInvoicePayload) => xenditService.createInvoice(payload),
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
    },
  });

  return {
    createInvoice: createInvoiceMutation.mutateAsync,
    isCreating: createInvoiceMutation.isPending,
    reset: createInvoiceMutation.reset,
    data: createInvoiceMutation.data,
  };
}
