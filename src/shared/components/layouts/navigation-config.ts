import {
    AlertTriangle,
    BarChart3,
    Brain,
    Briefcase,
    Building2,
    ClipboardList,
    Command,
    CreditCard,
    FileText,
    Gift,
    Home,
    LayoutDashboard,
    Lightbulb,
    LogOut,
    LucideIcon,
    Menu,
    MessageSquare,
    Package,
    ScanText,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Store,
    User,
    Users,
    Wallet,
    Wrench,
} from "lucide-react";

export type UserRole = "tenant" | "merchant" | "vendor" | "admin";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
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
      subtitle: "Tenant Portal",
      icon: Command,
      iconBgClass: "bg-sidebar-primary text-sidebar-primary-foreground",
    },
    mainNav: [
      {
        label: "Menu Utama",
        items: [
          { path: "/tenant", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/tenant/payments", icon: Wallet, label: "Pembayaran" },
          { path: "/tenant/invoices", icon: FileText, label: "Tagihan" },
          { path: "/tenant/contracts", icon: ClipboardList, label: "Kontrak" },
          { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
        ],
      },
      {
        label: "Aktivitas",
        items: [
          { path: "/tenant/maintenance", icon: Wrench, label: "Maintenance" },
          { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
          { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
          { path: "/tenant/referrals", icon: Gift, label: "Referral" },
        ],
      },
    ],
    bottomNav: [
      { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
      { path: "/tenant/payments", icon: Wallet, label: "Bayar" },
      { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
      { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
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
      subtitle: "Merchant Portal",
      icon: Building2,
      iconBgClass: "gradient-primary text-primary-foreground",
    },
    mainNav: [
      {
        label: "Utama",
        items: [
          { path: "/merchant", icon: LayoutDashboard, label: "Dashboard" },
        ],
      },
      {
        label: "Properti",
        items: [
          { path: "/merchant/properties", icon: Building2, label: "Properties" },
          { path: "/merchant/units", icon: Home, label: "Units" },
          { path: "/merchant/tenants", icon: Users, label: "Tenants" },
        ],
      },
      {
        label: "Keuangan",
        items: [
          { path: "/merchant/contracts", icon: ClipboardList, label: "Contracts" },
          { path: "/merchant/invoices", icon: FileText, label: "Invoices" },
          { path: "/merchant/payments", icon: Wallet, label: "Payments" },
        ],
      },
      {
        label: "Operasional",
        items: [
          { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
          { path: "/merchant/move-outs", icon: LogOut, label: "Move-Outs" },
        ],
      },
      {
        label: "Analitik",
        items: [
          { path: "/merchant/reports", icon: BarChart3, label: "Reports" },
          { path: "/merchant/ml-analytics", icon: Brain, label: "ML Analytics" },
          { path: "/merchant/dss-advisor", icon: Lightbulb, label: "DSS Advisor" },
        ],
      },
      {
        label: "Bantuan",
        items: [
          { path: "/merchant/ocr-tutorial", icon: ScanText, label: "OCR Tutorial" },
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
      subtitle: "Vendor Portal",
      icon: Wrench,
      iconBgClass: "bg-success text-success-foreground",
    },
    mainNav: [
      {
        label: "Menu",
        items: [
          { path: "/vendor", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/vendor/products", icon: Package, label: "Products" },
          { path: "/vendor/orders", icon: ShoppingCart, label: "Orders" },
          { path: "/vendor/jobs", icon: Briefcase, label: "Jobs" },
          { path: "/vendor/earnings", icon: Wallet, label: "Earnings" },
          { path: "/vendor/analytics", icon: BarChart3, label: "Analytics" },
          { path: "/vendor/referrals", icon: Gift, label: "Referrals" },
        ],
      },
    ],
    hasBottomNav: false,
    hasFloatingAI: true,
    globalFloatingAI: true,
  },
  admin: {
    brand: {
      name: "SiHuni",
      subtitle: "Admin Panel",
      icon: Building2,
      iconBgClass: "gradient-primary text-primary-foreground",
    },
    mainNav: [
      {
        label: "Menu",
        items: [
          { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/admin/merchants", icon: Building2, label: "Merchants" },
  { path: "/admin/properties", icon: Home, label: "Properties" },
  { path: "/admin/vendors", icon: Users, label: "Vendors" },
          { path: "/admin/tenants", icon: User, label: "Tenants" },
          { path: "/admin/users", icon: Shield, label: "Admin Users" },
          { path: "/admin/escrow", icon: Wallet, label: "Escrow" },
          { path: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
          { path: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
          { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
          { path: "/admin/platform-config", icon: CreditCard, label: "Platform Config" },
          { path: "/admin/referrals", icon: Users, label: "Referrals" },
          { path: "/admin/chatbot", icon: Menu, label: "Chatbot KB" },
          { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
          { path: "/admin/audit-logs", icon: FileText, label: "Audit Logs" },
          { path: "/admin/forum-moderation", icon: MessageSquare, label: "Forum Mod" },
          { path: "/admin/2fa", icon: Shield, label: "Admin 2FA" },
          { path: "/admin/dss-health", icon: BarChart3, label: "DSS Health" },
          { path: "/admin/settings", icon: Settings, label: "Settings" },
        ],
      },
    ],
    hasBottomNav: false,
    hasFloatingAI: true,
    globalFloatingAI: true,
  },
};

// Helper to get all flat nav items for a role
export function getAllNavItems(role: UserRole): NavItem[] {
  const config = navigationConfig[role];
  return config.mainNav.flatMap((group) => group.items);
}

// Helper to check if a path is active
export function isPathActive(path: string, currentPath: string, basePath: string): boolean {
  if (path === basePath) {
    return currentPath === basePath;
  }
  return currentPath.startsWith(path);
}
