import {
    AlertTriangle,
    BarChart3,
    Building2,
    Command,
    CreditCard,
    FileText,
    Gift,
    Home,
    LayoutDashboard,
    LogOut,
    LucideIcon,
    Menu,
    Package,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Store,
    User,
    UserCheck,
    Users,
    Wallet,
    Wrench,
} from "lucide-react";

export type UserRole = "tenant" | "merchant" | "vendor" | "admin";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
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
  bottomNav?: NavItem[];
  hasBottomNav: boolean;
  hasFloatingAI: boolean;
  globalFloatingAI?: boolean;
  mainPagesWithAI?: string[];
}

export const navigationConfig: Record<UserRole, RoleConfig> = {
  tenant: {
    brand: {
      name: "SiHuni",
      subtitle: "Portal Penyewa",
      icon: Command,
      iconBgClass: "bg-sidebar-primary text-sidebar-primary-foreground",
    },
    mainNav: [
      {
        label: "Menu Utama",
        items: [
          { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
          { path: "/tenant/payments", icon: Wallet, label: "Pembayaran" },
          { path: "/tenant/invoices", icon: FileText, label: "Tagihan" },
          { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
        ],
      },
      {
        label: "Aktivitas",
        items: [
          { path: "/tenant/maintenance", icon: Wrench, label: "Pemeliharaan" },
          { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
          { path: "/tenant/referrals", icon: Gift, label: "Referral" },
        ],
      },
    ],
    bottomNav: [
      { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
      { path: "/tenant/payments", icon: Wallet, label: "Bayar" },
      { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
      { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
      { path: "/tenant/profile", icon: User, label: "Profil" },
    ],
    hasBottomNav: true,
    hasFloatingAI: true,
    globalFloatingAI: true,
    mainPagesWithAI: ["/tenant", "/tenant/payments", "/tenant/orders"],
  },
  merchant: {
    brand: {
      name: "SiHuni",
      subtitle: "Portal Merchant",
      icon: Building2,
      iconBgClass: "gradient-primary text-primary-foreground",
    },
    mainNav: [
      {
        label: "Utama",
        items: [
          { path: "/merchant", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/merchant/properties", icon: Building2, label: "Properti", activePatterns: ["/merchant/units"] },
        ],
      },
      {
        label: "Operasional",
        items: [
          { path: "/merchant/inventory", icon: Package, label: "Inventori" },
          { path: "/merchant/guardians", icon: UserCheck, label: "Penjaga" },
          { path: "/merchant/tenants", icon: Users, label: "Penyewa", activePatterns: ["/merchant/move-outs", "/merchant/tenant-analytics"] },
          { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
          { path: "/merchant/referrals", icon: Gift, label: "Referral" },
        ],
      },
      {
        label: "Keuangan",
        items: [
          { path: "/merchant/invoices", icon: FileText, label: "Tagihan" },
          { path: "/merchant/payments", icon: Wallet, label: "Pembayaran" },
        ],
      },
      {
        label: "Wawasan",
        items: [
          { path: "/merchant/reports", icon: FileText, label: "Laporan", activePatterns: ["/merchant/report-templates"] },
          { path: "/merchant/insights", icon: BarChart3, label: "Alat", activePatterns: ["/merchant/analytics", "/merchant/ai-insights", "/merchant/analytics-dashboard", "/merchant/comparative-portfolio", "/merchant/market-intelligence", "/merchant/data-quality"] },
        ],
      },
    ],
    hasBottomNav: false,
    hasFloatingAI: true,
    globalFloatingAI: true,
  },
  vendor: {
    brand: {
      name: "SiHuni",
      subtitle: "Portal Vendor",
      icon: Wrench,
      iconBgClass: "bg-success text-success-foreground",
    },
    mainNav: [
      {
        label: "Menu",
        items: [
          { path: "/vendor", icon: LayoutDashboard, label: "Dashboard" },
        ],
      },
    ],
    hasBottomNav: false,
    hasFloatingAI: false,
    globalFloatingAI: false,
  },
  admin: {
    brand: {
      name: "SiHuni",
      subtitle: "Panel Admin",
      icon: Building2,
      iconBgClass: "gradient-primary text-primary-foreground",
    },
    mainNav: [
      {
        label: "Menu",
        items: [
          { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/admin/merchants", icon: Building2, label: "Merchant" },
          { path: "/admin/properties", icon: Home, label: "Properti" },
          { path: "/admin/tenants", icon: User, label: "Penyewa" },
          { path: "/admin/users", icon: Shield, label: "Admin" },
          { path: "/admin/subscriptions", icon: CreditCard, label: "Langganan" },
          { path: "/admin/disputes", icon: AlertTriangle, label: "Sengketa" },
          { path: "/admin/analytics", icon: BarChart3, label: "Analitik" },
          { path: "/admin/platform-config", icon: CreditCard, label: "Konfigurasi" },
          { path: "/admin/referrals", icon: Users, label: "Referral" },
          { path: "/admin/chatbot", icon: Menu, label: "Chatbot KB" },
          { path: "/admin/orders", icon: ShoppingCart, label: "Pesanan" },
          { path: "/admin/audit-logs", icon: FileText, label: "Log Audit" },
          { path: "/admin/2fa", icon: Shield, label: "Admin 2FA" },
          { path: "/admin/settings", icon: Settings, label: "Pengaturan" },
        ],
      },
    ],
    hasBottomNav: false,
    hasFloatingAI: false,
    globalFloatingAI: false,
  },
};

// Helper to get all flat nav items for a role
export function getAllNavItems(role: UserRole): NavItem[] {
  const config = navigationConfig[role];
  return config.mainNav.flatMap((group) => group.items);
}

// Helper to check if a path is active (supports activePatterns)
export function isPathActive(path: string, currentPath: string, basePath: string, activePatterns?: string[]): boolean {
  if (path === basePath) {
    return currentPath === basePath;
  }
  if (currentPath.startsWith(path)) return true;
  if (activePatterns) {
    return activePatterns.some(pattern => currentPath.startsWith(pattern));
  }
  return false;
}