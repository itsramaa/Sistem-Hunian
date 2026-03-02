import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, Wrench, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceReplyForm } from '@/features/maintenance/components/MaintenanceReplyForm';

interface UpdateTimelineProps {
  maintenanceRequestId: string;
  canAddUpdate?: boolean;
  authorRole: 'tenant' | 'merchant';
}

interface NormalizedEntry {
  id: string;
  type: 'update' | 'timeline';
  content: string;
  author_role: string;
  status_change_to: string | null;
  photos: string[] | null;
  created_at: string;
}

export function UpdateTimeline({ maintenanceRequestId, canAddUpdate = true, authorRole }: UpdateTimelineProps) {
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['maintenance-updates', maintenanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_updates')
        .select('*')
        .eq('maintenance_request_id', maintenanceRequestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((u: any): NormalizedEntry => ({
        id: u.id,
        type: 'update',
        content: u.content,
        author_role: u.author_role,
        status_change_to: u.status_change_to || null,
        photos: u.photos || null,
        created_at: u.created_at,
      }));
    },
  });

  const { data: timelineEntries = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['maintenance-timeline', maintenanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_timeline')
        .select('*')
        .eq('maintenance_request_id', maintenanceRequestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((t: any): NormalizedEntry => ({
        id: t.id,
        type: 'timeline',
        content: t.message,
        author_role: t.actor_role,
        status_change_to: t.status || null,
        photos: null,
        created_at: t.created_at,
      }));
    },
  });

  const isLoading = updatesLoading || timelineLoading;

  const allEntries = [...updates, ...timelineEntries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'in_progress': return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'resolved': case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': case 'submitted': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'merchant': return <Badge variant="default" className="rounded-full text-xs">Property Manager</Badge>;
      case 'tenant': return <Badge variant="secondary" className="rounded-full text-xs">Tenant</Badge>;
      case 'vendor': return <Badge variant="outline" className="rounded-full text-xs">Technician</Badge>;
      default: return <Badge variant="outline" className="rounded-full text-xs">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Belum ada pembaruan</p>
        </div>
      ) : (
        <div className="space-y-1">
          {allEntries.map((entry, index) => (
            <div key={entry.id} className="relative flex gap-4 pb-4">
              {index < allEntries.length - 1 && (
                <div className="absolute left-5 top-11 w-0.5 h-[calc(100%-12px)] bg-gradient-to-b from-primary/30 to-border/40" />
              )}

              <div className="relative shrink-0">
                {entry.type === 'timeline' ? (
                  <div className="p-0.5 rounded-full bg-gradient-to-br from-muted to-muted/50">
                    <div className="h-9 w-9 rounded-full border-2 border-background bg-card flex items-center justify-center">
                      {getStatusIcon(entry.status_change_to)}
                    </div>
                  </div>
                ) : (
                  <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/60 to-primary/20">
                    <Avatar className="h-9 w-9 border-2 border-background">
                      <AvatarFallback className="text-xs bg-card">
                        {entry.author_role.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getRoleBadge(entry.author_role)}
                  {entry.type === 'timeline' && entry.status_change_to && (
                    <Badge variant="outline" className="gap-1 rounded-full text-xs">
                      <ArrowRight className="h-3 w-3" />
                      {entry.status_change_to.replace('_', ' ')}
                    </Badge>
                  )}
                  {entry.type === 'update' && entry.status_change_to && (
                    <Badge variant="outline" className="gap-1 rounded-full text-xs">
                      {getStatusIcon(entry.status_change_to)}
                      Status → {entry.status_change_to.replace('_', ' ')}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{entry.content}</p>

                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {entry.photos.map((photo, photoIndex) => (
                      <img
                        key={photoIndex}
                        src={photo}
                        alt={`Update photo ${photoIndex + 1}`}
                        className="h-20 w-20 object-cover rounded-xl border border-border/40 hover:opacity-80 transition-opacity cursor-pointer"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canAddUpdate && (
        <div className="border-t border-border/40 pt-4">
          <MaintenanceReplyForm
            maintenanceRequestId={maintenanceRequestId}
            authorRole={authorRole}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['maintenance-updates', maintenanceRequestId] });
              queryClient.invalidateQueries({ queryKey: ['maintenance-timeline', maintenanceRequestId] });
            }}
          />
        </div>
      )}
    </div>
  );
}
