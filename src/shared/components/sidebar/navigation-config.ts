import { LucideIcon, LayoutDashboard, Wrench, Bell, User, Settings } from 'lucide-react';

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

export const navigationConfig: Record<UserRole, RoleConfig> = {
  operator: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Operator' },
    mainNav: [
      {
        label: 'Menu',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Maintenance', path: '/dashboard/maintenance', icon: Wrench },
          { label: 'Notifikasi', path: '/dashboard/notifications', icon: Bell },
          { label: 'Profil', path: '/dashboard/profile', icon: User },
          { label: 'Pengaturan', path: '/dashboard/settings', icon: Settings },
        ],
      },
    ],
  },
  manager: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Manajer' },
    mainNav: [
      {
        label: 'Menu',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Maintenance', path: '/dashboard/maintenance', icon: Wrench },
        ],
      },
    ],
  },
  viewer: {
    brand: { ...defaultBrand, name: 'SiHuni', subtitle: 'Viewer' },
    mainNav: [
      {
        label: 'Menu',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ],
      },
    ],
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
