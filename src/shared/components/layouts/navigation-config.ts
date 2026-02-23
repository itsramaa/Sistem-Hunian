import {
    AlertTriangle,
    BarChart3,
    Brain,
    Briefcase,
    Building2,
    Calculator,
    ClipboardList,
    Command,
    CreditCard,
    FileSearch,
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
    TrendingUp,
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
          { path: "/tenant/contracts", icon: ClipboardList, label: "Kontrak" },
          { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
        ],
      },
      {
        label: "Aktivitas",
        items: [
          { path: "/tenant/maintenance", icon: Wrench, label: "Pemeliharaan" },
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
      subtitle: "Portal Merchant",
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
          { path: "/merchant/properties", icon: Building2, label: "Properti" },
          { path: "/merchant/units", icon: Home, label: "Unit" },
          { path: "/merchant/guardians", icon: User, label: "Penjaga" },
          { path: "/merchant/tenants", icon: Users, label: "Penyewa" },
          { path: "/merchant/compliance", icon: Shield, label: "Risiko & Kepatuhan" },
          { path: "/merchant/data-quality", icon: ClipboardList, label: "Kualitas Data" },
        ],
      },
      {
        label: "Keuangan",
        items: [
          { path: "/merchant/contracts", icon: ClipboardList, label: "Kontrak" },
          { path: "/merchant/invoices", icon: FileText, label: "Tagihan" },
          { path: "/merchant/payments", icon: Wallet, label: "Pembayaran" },
        ],
      },
      {
        label: "Operasional",
        items: [
          { path: "/merchant/maintenance", icon: Wrench, label: "Pemeliharaan" },
          { path: "/merchant/move-outs", icon: LogOut, label: "Pindah Keluar" },
        ],
      },
      {
        label: "Analitik",
        items: [
          { path: "/merchant/reports", icon: BarChart3, label: "Laporan" },
          { path: "/merchant/analytics-dashboard", icon: TrendingUp, label: "Dashboard Analitik" },
          { path: "/merchant/tenant-analytics", icon: Users, label: "Analitik Tenant" },
          { path: "/merchant/market-intelligence", icon: TrendingUp, label: "Market Intelligence" },
          { path: "/merchant/ml-analytics", icon: Brain, label: "Analitik ML" },
          { path: "/merchant/dss-advisor", icon: Lightbulb, label: "Advisor DSS" },
          { path: "/merchant/financial-risk", icon: Calculator, label: "Financial & Risk" },
          { path: "/merchant/tenant-quality", icon: UserCheck, label: "Kualitas Tenant" },
          { path: "/merchant/report-templates", icon: FileText, label: "Template Laporan" },
        ],
      },
      {
        label: "Bantuan",
        items: [
          { path: "/merchant/documents", icon: FileSearch, label: "Pusat Dokumen" },
          { path: "/merchant/ocr-tutorial", icon: ScanText, label: "Tutorial OCR" },
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
          { path: "/vendor/products", icon: Package, label: "Produk" },
          { path: "/vendor/orders", icon: ShoppingCart, label: "Pesanan" },
          { path: "/vendor/jobs", icon: Briefcase, label: "Pekerjaan" },
          { path: "/vendor/assigned-properties", icon: Building2, label: "Properti Assigned" },
          { path: "/vendor/earnings", icon: Wallet, label: "Pendapatan" },
          { path: "/vendor/analytics", icon: BarChart3, label: "Analitik" },
          { path: "/vendor/referrals", icon: Gift, label: "Referral" },
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
          { path: "/admin/vendors", icon: Users, label: "Vendor" },
          { path: "/admin/tenants", icon: User, label: "Penyewa" },
          { path: "/admin/users", icon: Shield, label: "Admin" },
          { path: "/admin/escrow", icon: Wallet, label: "Escrow" },
          { path: "/admin/subscriptions", icon: CreditCard, label: "Langganan" },
          { path: "/admin/disputes", icon: AlertTriangle, label: "Sengketa" },
          { path: "/admin/analytics", icon: BarChart3, label: "Analitik" },
          { path: "/admin/platform-config", icon: CreditCard, label: "Konfigurasi" },
          { path: "/admin/referrals", icon: Users, label: "Referral" },
          { path: "/admin/chatbot", icon: Menu, label: "Chatbot KB" },
          { path: "/admin/orders", icon: ShoppingCart, label: "Pesanan" },
          { path: "/admin/audit-logs", icon: FileText, label: "Log Audit" },
          { path: "/admin/forum-moderation", icon: MessageSquare, label: "Moderasi Forum" },
          { path: "/admin/2fa", icon: Shield, label: "Admin 2FA" },
          { path: "/admin/dss-health", icon: BarChart3, label: "Kesehatan DSS" },
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

// Helper to check if a path is active
export function isPathActive(path: string, currentPath: string, basePath: string): boolean {
  if (path === basePath) {
    return currentPath === basePath;
  }
  return currentPath.startsWith(path);
}