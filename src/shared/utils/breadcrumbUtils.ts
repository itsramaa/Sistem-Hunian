import { UserRole, getAllNavItems } from "@/shared/components/layouts/navigation-config";

// Translations for path segments
export const SEGMENT_TRANSLATIONS: Record<string, string> = {
  'create': 'Buat',
  'edit': 'Ubah',
  'new': 'Baru',
  'details': 'Detail',
  'settings': 'Pengaturan',
  'profile': 'Profil',
  'security': 'Keamanan',
  'notifications': 'Notifikasi',
  'appearance': 'Tampilan',
  'help': 'Bantuan',
  'analytics': 'Analitik',
  'reports': 'Laporan',
  'users': 'Pengguna',
  'billing': 'Tagihan',
  'invoices': 'Faktur',
  'maintenance': 'Pemeliharaan',
  'properties': 'Properti',
  'tenants': 'Penyewa',
  'vendors': 'Vendor',
  'orders': 'Pesanan',
  'products': 'Produk',
  'jobs': 'Pekerjaan',
  'earnings': 'Pendapatan',
  'referrals': 'Referral',
  'chat': 'Percakapan',
  'forum': 'Forum',
  'marketplace': 'Marketplace',
  'contracts': 'Kontrak',
  'payments': 'Pembayaran',
  'units': 'Unit',
  'guardians': 'Penjaga',
  'move-outs': 'Keluar',
  'escrow': 'Escrow',
  'add': 'Tambah',
  'view': 'Lihat',
  'history': 'Riwayat',
  'documents': 'Dokumen',
};

// Helper to get breadcrumb label for role dashboard
export function getRoleDashboardLabel(role: UserRole): string {
  switch (role) {
    case "tenant": return "Beranda";
    case "merchant": return "Dashboard";
    case "vendor": return "Dashboard";
    case "admin": return "Dashboard";
    default: return "Dashboard";
  }
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
}

export function generateBreadcrumbs(role: UserRole, pathname: string): BreadcrumbItem[] {
  const navItems = getAllNavItems(role);
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];
  
  // Base path for the role
  const basePath = `/${role}`;
  
  // Add Root (Dashboard)
  crumbs.push({
    label: getRoleDashboardLabel(role),
    path: basePath,
    isCurrent: pathname === basePath || pathname === `${basePath}/`
  });

  if (pathname === basePath || pathname === `${basePath}/`) return crumbs;

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    if (index === 0 && segment === role) {
      currentPath += `/${segment}`;
      return;
    }
    
    currentPath += `/${segment}`;
    
    // Check if this path matches a nav item
    const navItem = navItems.find(item => item.path === currentPath);
    let label = navItem?.label;
    
    if (!label) {
        // Try translation
        if (SEGMENT_TRANSLATIONS[segment.toLowerCase()]) {
            label = SEGMENT_TRANSLATIONS[segment.toLowerCase()];
        } 
        // Heuristic for IDs
        else if (segment.length > 20 || /^\d+$/.test(segment)) {
            label = "Detail"; 
        }
        else {
            // Fallback formatting
            label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }
    }
    
    crumbs.push({
      label,
      path: currentPath,
      isCurrent: currentPath === pathname
    });
  });
  
  return crumbs;
}
