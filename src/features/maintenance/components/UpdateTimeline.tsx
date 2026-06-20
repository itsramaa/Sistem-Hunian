import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, Wrench, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceReplyForm } from '@/features/maintenance/components/MaintenanceReplyForm';

interface UpdateTimelineProps {
  maintenanceRequestId: string;
  canAddUpdate?: boolean;
  authorRole: 'tenant' | 'merchant';
}

interface MaintenanceUpdate {
  id: string;
  content: string;
  author_id: string;
  author_role: string;
  status_change_to: string | null;
  photos: string[] | null;
  created_at: string;
}

export function UpdateTimeline({ maintenanceRequestId, canAddUpdate = true, authorRole }: UpdateTimelineProps) {
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['maintenance-updates', maintenanceRequestId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_updates').select(...)
      return [] as MaintenanceUpdate[];
    },
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'in_progress': return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'resolved': case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
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
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Updates Timeline
      </h3>

      {updates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No updates yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {updates.map((update, index) => (
            <div key={update.id} className="relative flex gap-4 pb-4">
              {/* Connected line */}
              {index < updates.length - 1 && (
                <div className="absolute left-5 top-11 w-0.5 h-[calc(100%-12px)] bg-gradient-to-b from-primary/30 to-border/40" />
              )}
              
              {/* Avatar with gradient ring */}
              <div className="relative shrink-0">
                <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/60 to-primary/20">
                  <Avatar className="h-9 w-9 border-2 border-background">
                    <AvatarFallback className="text-xs bg-card">
                      {update.author_role.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getRoleBadge(update.author_role)}
                  {update.status_change_to && (
                    <Badge variant="outline" className="gap-1 rounded-full text-xs">
                      {getStatusIcon(update.status_change_to)}
                      Status → {update.status_change_to.replace('_', ' ')}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{update.content}</p>
                
                {update.photos && update.photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {update.photos.map((photo, photoIndex) => (
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
            }}
          />
        </div>
      )}
    </div>
  );
}