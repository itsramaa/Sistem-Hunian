import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Home, 
  User, 
  CreditCard,
  RefreshCw,
  Shield,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface MerchantActivityTabProps {
  merchantId: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

const getActionIcon = (action: string) => {
  if (action.includes('approved') || action.includes('verified')) return CheckCircle;
  if (action.includes('rejected')) return XCircle;
  if (action.includes('suspended')) return AlertTriangle;
  if (action.includes('reactivated')) return RefreshCw;
  if (action.includes('contract')) return FileText;
  if (action.includes('property')) return Home;
  if (action.includes('tenant')) return User;
  if (action.includes('payment')) return CreditCard;
  if (action.includes('security')) return Shield;
  return Clock;
};

const getActionColor = (action: string) => {
  if (action.includes('approved') || action.includes('verified') || action.includes('success')) {
    return 'text-success bg-success/10';
  }
  if (action.includes('rejected') || action.includes('failed')) {
    return 'text-destructive bg-destructive/10';
  }
  if (action.includes('suspended') || action.includes('warning')) {
    return 'text-warning bg-warning/10';
  }
  return 'text-primary bg-primary/10';
};

const formatAction = (action: string) => {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export function MerchantActivityTab({ merchantId }: MerchantActivityTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, [merchantId]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      // First get property IDs for this merchant
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('merchant_id', merchantId);

      const propertyIds = properties?.map(p => p.id) || [];

      // Fetch audit logs for merchant and related entities
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Build OR conditions for entity_id matching
      const orConditions = [
        `entity_id.eq.${merchantId}`,
      ];

      if (propertyIds.length > 0) {
        propertyIds.forEach(id => {
          orConditions.push(`entity_id.eq.${id}`);
        });
      }

      const { data, error } = await query.or(orConditions.join(','));

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Belum ada aktivitas tercatat</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
      {logs.map((log, index) => {
        const Icon = getActionIcon(log.action);
        const colorClass = getActionColor(log.action);
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="relative flex gap-3 pb-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{formatAction(log.action)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {log.entity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional details */}
              {log.new_data && Object.keys(log.new_data).length > 0 && (
                <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
                  {Object.entries(log.new_data).slice(0, 3).map(([key, value]) => (
                    <p key={key} className="text-muted-foreground">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
