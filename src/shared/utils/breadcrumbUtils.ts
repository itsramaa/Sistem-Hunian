import { UserRole } from '@/shared/components/sidebar/navigation-config';

export interface Breadcrumb {
  label: string;
  path: string;
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

export function generateBreadcrumbs(_role: UserRole, pathname: string): Breadcrumb[] {
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += '/' + segment;
    const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, path: currentPath });
  }

  return breadcrumbs;
}
