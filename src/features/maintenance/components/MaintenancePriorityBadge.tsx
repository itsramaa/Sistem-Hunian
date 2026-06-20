import { Badge } from '@/shared/components/ui/badge';

interface MaintenancePriorityBadgeProps {
  priority: string;
}

export function MaintenancePriorityBadge({ priority }: MaintenancePriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Mendesak',
          className: 'bg-red-100 text-red-800 border-red-200 rounded-full',
        };
      case 'high':
        return {
          label: 'Tinggi',
          className: 'bg-orange-100 text-orange-800 border-orange-200 rounded-full',
        };
      case 'medium':
        return {
          label: 'Sedang',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 rounded-full',
        };
      case 'low':
        return {
          label: 'Rendah',
          className: 'bg-green-100 text-green-800 border-green-200 rounded-full',
        };
      default:
        return {
          label: priority,
          className: 'rounded-full',
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant="outline" className={`capitalize ${config.className}`}>
      {config.label}
    </Badge>
  );
}