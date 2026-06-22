import { UserRole } from '@/shared/components/sidebar/navigation-config';

export interface Breadcrumb {
  label: string;
  path: string;
  isCurrent?: boolean;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Properti',
  rooms: 'Kamar',
  tenants: 'Penghuni',
  payments: 'Pembayaran',
  confirmations: 'Konfirmasi DP',
  maintenance: 'Maintenance',
  audit: 'Audit Trail',
  notifications: 'Notifikasi',
  profile: 'Profil',
  settings: 'Pengaturan',
};

export function getRoleDashboardLabel(role: UserRole): string {
  switch (role) {
    case 'operator': return 'Operator';
    case 'manager': return 'Manager';
    case 'viewer': return 'Viewer';
    default: return 'Dashboard';
  }
}

export function generateBreadcrumbs(_role: UserRole, pathname: string): Breadcrumb[] {
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += '/' + segment;
    const label = routeLabels[segment]
      ?? (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || /^\d+$/.test(segment)
        ? 'Detail'
        : segment.charAt(0).toUpperCase() + segment.slice(1));
    breadcrumbs.push({ label, path: currentPath, isCurrent: i === segments.length - 1 });
  }

  return breadcrumbs;
}
