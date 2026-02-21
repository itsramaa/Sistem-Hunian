import { Badge } from '@/shared/components/ui/badge';

interface MaintenancePriorityBadgeProps {
  priority: string;
}

export function MaintenancePriorityBadge({ priority }: MaintenancePriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          variant: 'destructive' as const,
        };
      case 'high':
        return {
          label: 'High',
          variant: 'default' as const,
        };
      case 'medium':
        return {
          label: 'Medium',
          variant: 'secondary' as const,
        };
      case 'low':
        return {
          label: 'Low',
          variant: 'outline' as const,
        };
      default:
        return {
          label: priority,
          variant: 'secondary' as const,
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  );
}
