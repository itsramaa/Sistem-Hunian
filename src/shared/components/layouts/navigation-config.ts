import {
    AlertTriangle,
    BarChart3,
    
    Briefcase,
    Building2,
    Calculator,
    ClipboardList,
    Command,
    CreditCard,
    FileSearch,
    FileText,
    
    Home,
    LayoutDashboard,
    LayoutGrid,
    Lightbulb,
    LogOut,
    LucideIcon,
    Menu,
    MessageSquare,
    Package,
    ScanText,
    Settings,
    Shield,
    ShieldCheck,
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
          { path: "/merchant/properties", icon: Building2, label: "Properti", activePatterns: ["/merchant/units"] },
          { path: "/merchant/occupancy-board", icon: LayoutGrid, label: "Papan Okupansi" },
        ],
      },
      {
        label: "Operasional",
        items: [
          { path: "/merchant/inventory", icon: Package, label: "Inventori" },
          { path: "/merchant/guardians", icon: UserCheck, label: "Penjaga" },
          { path: "/merchant/tenants", icon: Users, label: "Penyewa", activePatterns: ["/merchant/move-outs", "/merchant/tenant-analytics"] },
          { path: "/merchant/contracts", icon: ClipboardList, label: "Kontrak", activePatterns: ["/merchant/lease-renewals"] },
          { path: "/merchant/waiting-list", icon: UserCheck, label: "Daftar Tunggu" },
          { path: "/merchant/tenant-screening", icon: ShieldCheck, label: "Screening Penyewa" },
          { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
          
        ],
      },
      {
        label: "Keuangan",
        items: [
          { path: "/merchant/invoices", icon: FileText, label: "Tagihan" },
          { path: "/merchant/payments", icon: Wallet, label: "Pembayaran" },
          { path: "/merchant/collections", icon: FileSearch, label: "Penagihan" },
          { path: "/merchant/reconciliation", icon: Calculator, label: "Rekonsiliasi" },
          { path: "/merchant/expenses", icon: CreditCard, label: "Pengeluaran" },
          { path: "/merchant/dynamic-pricing", icon: TrendingUp, label: "Harga Dinamis" },
          { path: "/merchant/financial-reports", icon: BarChart3, label: "Lap. Keuangan" },
        ],
      },
      {
        label: "Wawasan",
        items: [
          { path: "/merchant/reports", icon: FileText, label: "Laporan", activePatterns: ["/merchant/report-templates"] },
          { path: "/merchant/insights", icon: BarChart3, label: "Alat", activePatterns: ["/merchant/analytics", "/merchant/ai-insights", "/merchant/analytics-dashboard", "/merchant/comparative-portfolio", "/merchant/ml-analytics", "/merchant/dss-advisor", "/merchant/market-intelligence", "/merchant/financial-risk", "/merchant/tenant-quality", "/merchant/data-quality", "/merchant/documents"] },
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
          { path: "/admin/payment-transfers", icon: Wallet, label: "Transfer Dana" },
          { path: "/admin/subscriptions", icon: CreditCard, label: "Langganan" },
          { path: "/admin/disputes", icon: AlertTriangle, label: "Sengketa" },
          { path: "/admin/analytics", icon: BarChart3, label: "Analitik" },
          { path: "/admin/platform-config", icon: CreditCard, label: "Konfigurasi" },
          
          { path: "/admin/chatbot", icon: Menu, label: "Chatbot KB" },
          { path: "/admin/orders", icon: ShoppingCart, label: "Pesanan" },
          { path: "/admin/audit-logs", icon: FileText, label: "Log Audit" },
          { path: "/admin/forum-moderation", icon: MessageSquare, label: "Moderasi Forum" },
          { path: "/admin/2fa", icon: Shield, label: "Admin 2FA" },
          { path: "/admin/dss-health", icon: BarChart3, label: "Kesehatan DSS" },
          { path: "/admin/launch-readiness", icon: Lightbulb, label: "Kesiapan Launch" },
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