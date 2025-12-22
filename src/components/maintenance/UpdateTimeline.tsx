import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, Wrench, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceReplyForm } from './MaintenanceReplyForm';

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
      const { data, error } = await supabase
        .from('maintenance_updates')
        .select('*')
        .eq('maintenance_request_id', maintenanceRequestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MaintenanceUpdate[];
    },
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'in_progress':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'merchant':
        return <Badge variant="default">Property Manager</Badge>;
      case 'tenant':
        return <Badge variant="secondary">Tenant</Badge>;
      case 'vendor':
        return <Badge variant="outline">Technician</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Updates Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline */}
        <div className="relative">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No updates yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {index < updates.length - 1 && (
                    <div className="absolute left-5 top-10 w-0.5 h-full bg-border" />
                  )}
                  
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>
                      {update.author_role.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(update.author_role)}
                      {update.status_change_to && (
                        <Badge variant="outline" className="gap-1">
                          {getStatusIcon(update.status_change_to)}
                          Status → {update.status_change_to}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm">{update.content}</p>
                    
                    {/* Photos */}
                    {update.photos && update.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {update.photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Update photo ${photoIndex + 1}`}
                            className="h-20 w-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Update Form - Now uses MaintenanceReplyForm */}
        {canAddUpdate && (
          <div className="border-t pt-4">
            <MaintenanceReplyForm
              maintenanceRequestId={maintenanceRequestId}
              authorRole={authorRole}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-updates', maintenanceRequestId] });
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
