export type StaffRole = 'caretaker' | 'property_manager' | 'accountant';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  caretaker: 'Caretaker',
  property_manager: 'Property Manager',
  accountant: 'Akuntan',
};

export const PERMISSION_KEYS = {
  UNITS_VIEW: 'units.view',
  UNITS_EDIT_STATUS: 'units.edit_status',
  MAINTENANCE_VIEW: 'maintenance.view',
  MAINTENANCE_ACCEPT: 'maintenance.accept',
  MAINTENANCE_ASSIGN_VENDOR: 'maintenance.assign_vendor',
  MAINTENANCE_LOG_ACTIVITY: 'maintenance.log_activity',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_APPROVE: 'expenses.approve',
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  COLLECTIONS_SEND_LETTER: 'collections.send_letter',
  FINANCIAL_REPORTS_VIEW: 'financial_reports.view',
  TENANTS_VIEW: 'tenants.view',
  CONTRACTS_VIEW: 'contracts.view',
  SETTINGS_VIEW: 'settings.view',
} as const;

export type PermissionKey = typeof PERMISSION_KEYS[keyof typeof PERMISSION_KEYS];

export const ALL_PERMISSION_KEYS: PermissionKey[] = Object.values(PERMISSION_KEYS);

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'units.view': 'Lihat Unit',
  'units.edit_status': 'Ubah Status Unit',
  'maintenance.view': 'Lihat Maintenance',
  'maintenance.accept': 'Terima Maintenance',
  'maintenance.assign_vendor': 'Assign Vendor',
  'maintenance.log_activity': 'Log Aktivitas Maintenance',
  'expenses.view': 'Lihat Pengeluaran',
  'expenses.create': 'Buat Pengeluaran',
  'expenses.approve': 'Approve Pengeluaran (<Rp 1M)',
  'invoices.view': 'Lihat Tagihan',
  'invoices.create': 'Buat Tagihan',
  'collections.send_letter': 'Kirim Surat Tagihan',
  'financial_reports.view': 'Lihat Laporan Keuangan',
  'tenants.view': 'Lihat Penyewa',
  'contracts.view': 'Lihat Kontrak',
  'settings.view': 'Lihat Pengaturan',
};

export const PERMISSION_GROUPS: { label: string; keys: PermissionKey[] }[] = [
  {
    label: 'Unit',
    keys: ['units.view', 'units.edit_status'],
  },
  {
    label: 'Maintenance',
    keys: ['maintenance.view', 'maintenance.accept', 'maintenance.assign_vendor', 'maintenance.log_activity'],
  },
  {
    label: 'Keuangan',
    keys: ['expenses.view', 'expenses.create', 'expenses.approve', 'invoices.view', 'invoices.create', 'financial_reports.view'],
  },
  {
    label: 'Operasional',
    keys: ['tenants.view', 'contracts.view', 'collections.send_letter', 'settings.view'],
  },
];

export const DEFAULT_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  caretaker: [
    'units.view',
    'units.edit_status',
    'maintenance.view',
    'maintenance.accept',
    'maintenance.log_activity',
    'tenants.view',
  ],
  property_manager: [
    'units.view',
    'units.edit_status',
    'maintenance.view',
    'maintenance.accept',
    'maintenance.assign_vendor',
    'maintenance.log_activity',
    'expenses.view',
    'expenses.create',
    'expenses.approve',
    'invoices.view',
    'invoices.create',
    'collections.send_letter',
    'financial_reports.view',
    'tenants.view',
    'contracts.view',
  ],
  accountant: [
    'expenses.view',
    'invoices.view',
    'financial_reports.view',
    'contracts.view',
  ],
};
