import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickReminderButtonProps {
  invoiceId: string;
  tenantName?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export function QuickReminderButton({ invoiceId, tenantName, size = 'sm', variant = 'outline' }: QuickReminderButtonProps) {
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-payment-reminder', {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      toast.success(`Pengingat berhasil dikirim${tenantName ? ` ke ${tenantName}` : ''}`);
    } catch (err) {
      console.error('Reminder error:', err);
      toast.error('Gagal mengirim pengingat');
    } finally {
      setSending(false);
    }
  };

  return (
    <Button size={size} variant={variant} onClick={handleSend} disabled={sending}>
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {size !== 'icon' && <span className="ml-1">Kirim Reminder</span>}
    </Button>
  );
}
