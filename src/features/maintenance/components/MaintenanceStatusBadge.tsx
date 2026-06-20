import { Badge } from '@/shared/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Wrench, XCircle } from 'lucide-react';

interface MaintenanceStatusBadgeProps {
  status: string;
}

export function MaintenanceStatusBadge({ status }: MaintenanceStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Tertunda',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 rounded-full',
        };
      case 'in_progress':
        return {
          icon: Wrench,
          label: 'Dalam Proses',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 rounded-full',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Selesai',
          className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 rounded-full',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Dibatalkan',
          className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200 rounded-full',
        };
      default:
        return {
          icon: AlertTriangle,
          label: status,
          className: 'rounded-full',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 w-fit ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{config.label}</span>
    </Badge>
  );
}