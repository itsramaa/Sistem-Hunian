import { useState, useEffect } from 'react';
import { Clock, Copy, CheckCircle, AlertTriangle, RefreshCw, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInHours, differenceInMinutes, format, isPast, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InvitationLinkExpiryProps {
  invitationLink: string;
  expiresAt: Date | string;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function InvitationLinkExpiry({
  invitationLink,
  expiresAt,
  onRefresh,
  className,
}: InvitationLinkExpiryProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const isExpired = isPast(expiryDate);
  const hoursLeft = differenceInHours(expiryDate, now);
  const minutesLeft = differenceInMinutes(expiryDate, now);

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getExpiryStatus = () => {
    if (isExpired) {
      return { color: 'destructive' as const, text: 'Expired', urgent: true };
    }
    if (hoursLeft < 1) {
      return { color: 'destructive' as const, text: `${minutesLeft} min left`, urgent: true };
    }
    if (hoursLeft < 24) {
      return { color: 'default' as const, text: `${hoursLeft}h left`, urgent: true };
    }
    return { color: 'secondary' as const, text: formatDistanceToNow(expiryDate, { addSuffix: true }), urgent: false };
  };

  const status = getExpiryStatus();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast({ title: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to copy link' });
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
      toast({ title: 'Invitation link refreshed', description: 'New link valid for 7 days' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to refresh link' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Link display */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded-md overflow-hidden">
          <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-mono truncate">{invitationLink}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={isExpired}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isExpired ? 'Link expired' : 'Copy link'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Expiry info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status.urgent ? (
            <AlertTriangle className={cn(
              "h-4 w-4",
              isExpired ? "text-destructive" : "text-warning"
            )} />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isExpired ? 'Expired' : 'Expires'}: {format(expiryDate, 'MMM d, yyyy HH:mm')}
          </span>
          <Badge variant={status.color}>
            {status.text}
          </Badge>
        </div>
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {isExpired ? 'Generate New' : 'Refresh'}
          </Button>
        )}
      </div>
    </div>
  );
}

// Usage example for tenant invitations
interface TenantInvitationCardProps {
  tenantEmail: string;
  invitationLink: string;
  expiresAt: Date | string;
  status: 'pending' | 'accepted' | 'expired';
  onResend?: () => Promise<void>;
}

export function TenantInvitationCard({
  tenantEmail,
  invitationLink,
  expiresAt,
  status,
  onResend,
}: TenantInvitationCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{tenantEmail}</p>
          <Badge
            variant={
              status === 'accepted' ? 'default' :
              status === 'expired' ? 'destructive' : 'secondary'
            }
            className="mt-1"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </div>
      
      {status === 'pending' && (
        <InvitationLinkExpiry
          invitationLink={invitationLink}
          expiresAt={expiresAt}
          onRefresh={onResend}
        />
      )}
    </div>
  );
}
