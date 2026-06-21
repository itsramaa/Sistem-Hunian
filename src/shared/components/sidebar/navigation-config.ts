import {
  LucideIcon,
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  CreditCard,
  Clock,
  Wrench,
  History,
  UserCog,
} from 'lucide-react';

export type UserRole = 'operator' | 'manager' | 'viewer' | 'admin';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  activePatterns?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface RoleConfig {
  brand: { name: string; subtitle: string; icon: LucideIcon; iconBgClass: string };
  mainNav: NavGroup[];
}

export function isPathActive(
  itemPath: string,
  currentPath: string,
  _basePath: string,
  activePatterns?: string[]
): boolean {
  if (activePatterns) {
    return activePatterns.some((p) => currentPath.startsWith(p));
  }
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

export function getAllNavItems(role: UserRole): NavItem[] {
  return navigationConfig[role]?.mainNav.flatMap((g) => g.items) ?? [];
}

const defaultBrand = {
  icon: LayoutDashboard,
  iconBgClass: 'bg-primary/10',
};

const operatorNav: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { label: 'Properti', path: '/dashboard/properties', icon: Building2 },
      { label: 'Kamar', path: '/dashboard/rooms', icon: BedDouble },
      { label: 'Penghuni', path: '/dashboard/tenants', icon: Users },
      { label: 'Pembayaran', path: '/dashboard/payments', icon: CreditCard },
      { label: 'Konfirmasi DP', path: '/dashboard/confirmations', icon: Clock },
      { label: 'Maintenance', path: '/dashboard/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { label: 'Audit Trail', path: '/dashboard/audit', icon: History },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { label: 'Kelola Pengguna', path: '/dashboard/users', icon: UserCog },
    ],
  },
];

// Manager: dashboard + maintenance + audit trail
const managerNav: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Maintenance', path: '/dashboard/maintenance', icon: Wrench },
      { label: 'Audit Trail', path: '/dashboard/audit', icon: History },
    ],
  },
];

const viewerNav: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
];

export const navigationConfig: Record<UserRole, RoleConfig> = {
  operator: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Operator' },
    mainNav: operatorNav,
  },
  manager: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Manajer' },
    mainNav: managerNav,
  },
  viewer: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Viewer' },
    mainNav: viewerNav,
  },
  admin: {
    brand: { ...defaultBrand, name: 'SiHuni Admin', subtitle: 'Administrator' },
    mainNav: [
      {
        label: 'Admin',
        items: [
          { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        ],
      },
    ],
  },
};
