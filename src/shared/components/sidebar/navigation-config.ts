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
  Send,
} from "lucide-react";

export type UserRole = "operator" | "viewer";

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
  brand: {
    name: string;
    subtitle: string;
    icon: LucideIcon;
    iconBgClass: string;
  };
  mainNav: NavGroup[];
}

export function isPathActive(
  itemPath: string,
  currentPath: string,
  _basePath: string,
  activePatterns?: string[],
): boolean {
  if (activePatterns) {
    return activePatterns.some(
      (p) => currentPath === p || currentPath.startsWith(p + "/"),
    );
  }
  if (itemPath === "/dashboard") {
    return currentPath === "/dashboard";
  }
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

export function getAllNavItems(role: UserRole): NavItem[] {
  return navigationConfig[role]?.mainNav.flatMap((g) => g.items) ?? [];
}

const defaultBrand = {
  icon: LayoutDashboard,
  iconBgClass: "bg-primary/10",
};

// Operator: akses penuh semua modul termasuk audit trail
const operatorNav: NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operasional",
    items: [
      { label: "Properti", path: "/dashboard/properties", icon: Building2 },
      { label: "Kamar", path: "/dashboard/rooms", icon: BedDouble },
      { label: "Penghuni", path: "/dashboard/tenants", icon: Users },
      { label: "Pembayaran", path: "/dashboard/payments", icon: CreditCard },
      { label: "Konfirmasi DP", path: "/dashboard/confirmations", icon: Clock },
      { label: "Maintenance", path: "/dashboard/maintenance", icon: Wrench },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        label: "Permintaan Tindakan",
        path: "/dashboard/viewer-requests",
        icon: Send,
      },
      { label: "Audit Trail", path: "/dashboard/audit", icon: History },
    ],
  },
];

// Viewer: read-only semua modul operasional, TANPA audit trail dan TANPA pengaturan
const viewerNav: NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Lihat",
    items: [
      { label: "Properti", path: "/dashboard/properties", icon: Building2 },
      { label: "Kamar", path: "/dashboard/rooms", icon: BedDouble },
      { label: "Penghuni", path: "/dashboard/tenants", icon: Users },
      { label: "Pembayaran", path: "/dashboard/payments", icon: CreditCard },
      { label: "Konfirmasi DP", path: "/dashboard/confirmations", icon: Clock },
      { label: "Maintenance", path: "/dashboard/maintenance", icon: Wrench },
    ],
  },
];

export const navigationConfig: Record<UserRole, RoleConfig> = {
  operator: {
    brand: { ...defaultBrand, name: "SiHuni", subtitle: "Operator" },
    mainNav: operatorNav,
  },
  viewer: {
    brand: { ...defaultBrand, name: "SiHuni", subtitle: "Viewer" },
    mainNav: viewerNav,
  },
};
