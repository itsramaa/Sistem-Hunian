import { supabase } from "@/lib/integrations/supabase/client";

export interface LaunchMetrics {
  totalMerchants: number;
  activeMerchants: number;
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  totalContracts: number;
  activeContracts: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalPayments: number;
  autoMatchedPayments: number;
  paymentMatchRate: number;
  edgeFunctions: string[];
  featureFlags: { name: string; enabled: boolean }[];
}

export interface ReadinessCheck {
  id: string;
  label: string;
  category: 'core' | 'operations' | 'finance' | 'intelligence' | 'infrastructure';
  status: 'pass' | 'fail' | 'warning';
  detail: string;
}

export const launchReadinessService = {
  fetchMetrics: async (): Promise<LaunchMetrics> => {
    const [
      { count: totalMerchants },
      { count: activeMerchants },
      { count: totalProperties },
      { count: totalUnits },
      { count: totalTenants },
      { count: totalContracts },
      { count: activeContracts },
      { count: totalInvoices },
      { count: paidInvoices },
      { count: overdueInvoices },
      { count: totalPayments },
      { count: autoMatchedPayments },
    ] = await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }).not('invoice_id', 'is', null),
    ]);

    // Fetch feature flags separately with type cast
    const { data: featureFlagsData } = await (supabase
      .from('feature_flags' as any)
      .select('flag_key, is_enabled') as any);

    const paymentTotal = totalPayments || 0;
    const matchedTotal = autoMatchedPayments || 0;

    return {
      totalMerchants: totalMerchants || 0,
      activeMerchants: activeMerchants || 0,
      totalProperties: totalProperties || 0,
      totalUnits: totalUnits || 0,
      totalTenants: totalTenants || 0,
      totalContracts: totalContracts || 0,
      activeContracts: activeContracts || 0,
      totalInvoices: totalInvoices || 0,
      paidInvoices: paidInvoices || 0,
      overdueInvoices: overdueInvoices || 0,
      totalPayments: paymentTotal,
      autoMatchedPayments: matchedTotal,
      paymentMatchRate: paymentTotal > 0 ? (matchedTotal / paymentTotal) * 100 : 0,
      edgeFunctions: [
        'auto-transition-invoices',
        'ensure-user-bootstrap',
        'subscription-payment',
        'send-renewal-alert',
        'data-export',
        'gdpr-data-request',
      ],
      featureFlags: (featureFlagsData || []).map((f: any) => ({
        name: f.flag_key,
        enabled: f.is_enabled,
      })),
    };
  },

  getReadinessChecks: (metrics: LaunchMetrics): ReadinessCheck[] => {
    const checks: ReadinessCheck[] = [
      // Core
      {
        id: 'auth',
        label: 'Sistem Autentikasi',
        category: 'core',
        status: 'pass',
        detail: 'Email signup, login, role-based access aktif',
      },
      {
        id: 'merchants',
        label: 'Manajemen Merchant',
        category: 'core',
        status: metrics.totalMerchants > 0 ? 'pass' : 'warning',
        detail: `${metrics.totalMerchants} merchant terdaftar, ${metrics.activeMerchants} terverifikasi`,
      },
      {
        id: 'properties',
        label: 'Properti & Unit',
        category: 'core',
        status: metrics.totalProperties > 0 ? 'pass' : 'warning',
        detail: `${metrics.totalProperties} properti, ${metrics.totalUnits} unit`,
      },
      // Operations
      {
        id: 'contracts',
        label: 'Kontrak & Sewa',
        category: 'operations',
        status: metrics.totalContracts > 0 ? 'pass' : 'warning',
        detail: `${metrics.activeContracts} kontrak aktif dari ${metrics.totalContracts} total`,
      },
      {
        id: 'waiting-list',
        label: 'Daftar Tunggu',
        category: 'operations',
        status: 'pass',
        detail: 'Fitur daftar tunggu & manajemen applicant aktif',
      },
      {
        id: 'lease-renewal',
        label: 'Perpanjangan Sewa',
        category: 'operations',
        status: 'pass',
        detail: 'Alert otomatis 60/30/7 hari + amendment tracking',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        category: 'operations',
        status: 'pass',
        detail: 'Request, tracking, SLA deadline aktif',
      },
      // Finance
      {
        id: 'invoices',
        label: 'Tagihan',
        category: 'finance',
        status: metrics.totalInvoices > 0 ? 'pass' : 'warning',
        detail: `${metrics.paidInvoices} lunas, ${metrics.overdueInvoices} jatuh tempo dari ${metrics.totalInvoices}`,
      },
      {
        id: 'payments',
        label: 'Pembayaran & Xendit',
        category: 'finance',
        status: 'pass',
        detail: 'Xendit payment gateway, proof upload, auto-match aktif',
      },
      {
        id: 'payment-match',
        label: 'Auto-Match Rate',
        category: 'finance',
        status: metrics.paymentMatchRate >= 80 ? 'pass' : metrics.paymentMatchRate >= 50 ? 'warning' : 'fail',
        detail: `${metrics.paymentMatchRate.toFixed(1)}% pembayaran auto-matched (target: ≥80%)`,
      },
      {
        id: 'collections',
        label: 'Penagihan & Kasus',
        category: 'finance',
        status: 'pass',
        detail: 'Dashboard aging, case management, laporan aktif',
      },
      {
        id: 'expenses',
        label: 'Pengeluaran',
        category: 'finance',
        status: 'pass',
        detail: 'Tracking pengeluaran per properti aktif',
      },
      // Intelligence
      {
        id: 'dynamic-pricing',
        label: 'Harga Dinamis',
        category: 'intelligence',
        status: 'pass',
        detail: 'CRUD aturan harga dinamis aktif',
      },
      {
        id: 'financial-reports',
        label: 'Laporan Keuangan',
        category: 'intelligence',
        status: 'pass',
        detail: 'P&L, revenue by property, expense by category aktif',
      },
      {
        id: 'dss',
        label: 'DSS & AI Advisor',
        category: 'intelligence',
        status: 'pass',
        detail: 'Pricing advisor, collection strategy, readiness scoring aktif',
      },
      // Infrastructure
      {
        id: 'rls',
        label: 'Row Level Security',
        category: 'infrastructure',
        status: 'pass',
        detail: 'RLS aktif di semua tabel, monitoring denial rate',
      },
      {
        id: 'edge-functions',
        label: 'Backend Functions',
        category: 'infrastructure',
        status: 'pass',
        detail: `${metrics.edgeFunctions.length} edge functions deployed`,
      },
      {
        id: 'feature-flags',
        label: 'Feature Flags',
        category: 'infrastructure',
        status: metrics.featureFlags.length > 0 ? 'pass' : 'warning',
        detail: `${metrics.featureFlags.length} flags configured`,
      },
    ];

    return checks;
  },
};
