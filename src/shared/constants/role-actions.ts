import { Building2, FileText, Receipt, Send, BarChart3, Wrench, ScrollText, UserCircle, Briefcase, TrendingUp, type LucideIcon } from 'lucide-react';

export interface RoleAction {
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

export interface RoleActionGroup {
  role: string;
  roleLabel: string;
  actions: RoleAction[];
}

export const ROLE_PRIMARY_ACTIONS: RoleActionGroup[] = [
  {
    role: 'merchant',
    roleLabel: 'Pemilik / Merchant',
    actions: [
      { label: 'Kelola Properti', description: 'Tambah, edit, lihat properti dan unit', icon: Building2, path: '/merchant/properties' },
      { label: 'Buat Tagihan', description: 'Buat invoice baru untuk penyewa', icon: FileText, path: '/merchant/invoices' },
      { label: 'Approve Pengeluaran', description: 'Setujui atau tolak pengeluaran ≥ Rp 500K', icon: Receipt, path: '/merchant/financial-control' },
      { label: 'Kirim Reminder', description: 'Kirim pengingat pembayaran via WhatsApp/SMS', icon: Send, path: '/merchant/invoices' },
      { label: 'Lihat Laporan', description: 'Laporan keuangan, P&L, dan okupansi', icon: BarChart3, path: '/merchant/reports' },
    ],
  },
  {
    role: 'tenant',
    roleLabel: 'Penyewa / Tenant',
    actions: [
      { label: 'Bayar Tagihan', description: 'Lihat dan bayar tagihan sewa', icon: Receipt, path: '/tenant/invoices' },
      { label: 'Ajukan Maintenance', description: 'Laporkan kerusakan atau permintaan perbaikan', icon: Wrench, path: '/tenant/maintenance' },
      { label: 'Lihat Kontrak', description: 'Lihat detail kontrak sewa aktif', icon: ScrollText, path: '/tenant/contracts' },
      { label: 'Update Profil', description: 'Perbarui data pribadi dan kontak', icon: UserCircle, path: '/tenant/profile' },
    ],
  },
  {
    role: 'vendor',
    roleLabel: 'Vendor',
    actions: [
      { label: 'Terima Pekerjaan', description: 'Lihat dan terima assignment maintenance', icon: Briefcase, path: '/vendor/jobs' },
      { label: 'Update Progress', description: 'Update status dan kirim foto progres', icon: Wrench, path: '/vendor/jobs' },
      { label: 'Lihat Pendapatan', description: 'Lihat riwayat pembayaran dan total pendapatan', icon: TrendingUp, path: '/vendor/earnings' },
    ],
  },
];

export function getActionsForRole(role: string): RoleAction[] {
  return ROLE_PRIMARY_ACTIONS.find(r => r.role === role)?.actions || [];
}
