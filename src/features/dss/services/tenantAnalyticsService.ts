import { supabase } from '@/integrations/supabase/client';

export interface TenantDemographics {
  genderDistribution: Record<string, number>;
  occupationDistribution: Record<string, number>;
  incomeDistribution: Record<string, number>;
  ageGroupDistribution: Record<string, number>;
  totalProfiled: number;
  totalTenants: number;
}

export interface OccupancyMetrics {
  avgTenureMonths: number;
  turnoverRateAnnual: number;
  avgVacancyDays: number;
  currentOccupancyRate: number;
  moveInsByMonth: Record<string, number>;
  moveOutsByMonth: Record<string, number>;
  snapshots: Array<{
    snapshot_month: string;
    occupancy_rate: number;
    new_move_ins: number;
    move_outs: number;
    total_units: number;
    occupied_units: number;
  }>;
}

export interface TenantPaymentProfile {
  tenant_user_id: string;
  tenant_name: string | null;
  total_invoices: number;
  paid_on_time: number;
  paid_late: number;
  unpaid: number;
  avg_days_late: number;
  total_late_fees: number;
  payment_score: number;
  renewal_count: number;
  total_tenure_months: number;
  risk_level: string | null;
  risk_score: number | null;
}

export const tenantAnalyticsService = {
  async fetchDemographics(merchantId: string): Promise<TenantDemographics> {
    // Get tenants linked to this merchant via contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('tenant_user_id')
      .eq('merchant_id', merchantId)
      .in('status', ['active', 'expired', 'terminated']);

    const tenantIds = [...new Set((contracts || []).map(c => c.tenant_user_id))];
    if (tenantIds.length === 0) {
      return { genderDistribution: {}, occupationDistribution: {}, incomeDistribution: {}, ageGroupDistribution: {}, totalProfiled: 0, totalTenants: 0 };
    }

    const { data: tenants } = await supabase
      .from('tenants')
      .select('user_id, gender, occupation, income_range, age_group, date_of_birth')
      .in('user_id', tenantIds);

    const result: TenantDemographics = {
      genderDistribution: {},
      occupationDistribution: {},
      incomeDistribution: {},
      ageGroupDistribution: {},
      totalProfiled: 0,
      totalTenants: tenantIds.length,
    };

    for (const t of tenants || []) {
      let hasData = false;

      if (t.gender) {
        result.genderDistribution[t.gender] = (result.genderDistribution[t.gender] || 0) + 1;
        hasData = true;
      }
      if (t.occupation) {
        result.occupationDistribution[t.occupation] = (result.occupationDistribution[t.occupation] || 0) + 1;
        hasData = true;
      }
      if (t.income_range) {
        result.incomeDistribution[t.income_range] = (result.incomeDistribution[t.income_range] || 0) + 1;
        hasData = true;
      }
      const ageGroup = t.age_group || deriveAgeGroup(t.date_of_birth);
      if (ageGroup) {
        result.ageGroupDistribution[ageGroup] = (result.ageGroupDistribution[ageGroup] || 0) + 1;
        hasData = true;
      }
      if (hasData) result.totalProfiled++;
    }

    return result;
  },

  async fetchOccupancyMetrics(merchantId: string, propertyId?: string): Promise<OccupancyMetrics> {
    // Current occupancy
    const unitsQuery = supabase.from('units').select('id, status, rent_amount, property_id')
      .eq('property_id', propertyId ? propertyId : '');

    if (!propertyId) {
      // All properties for merchant
      const { data: props } = await supabase
        .from('properties')
        .select('id')
        .eq('merchant_id', merchantId);
      const propIds = (props || []).map(p => p.id);
      if (propIds.length === 0) {
        return { avgTenureMonths: 0, turnoverRateAnnual: 0, avgVacancyDays: 0, currentOccupancyRate: 0, moveInsByMonth: {}, moveOutsByMonth: {}, snapshots: [] };
      }
      const { data: units } = await supabase.from('units').select('id, status').in('property_id', propIds);
      const total = (units || []).length;
      const occupied = (units || []).filter(u => u.status === 'occupied').length;

      // Contracts for tenure calculation
      const { data: allContracts } = await supabase
        .from('contracts')
        .select('tenant_user_id, start_date, end_date, actual_end_date, status')
        .eq('merchant_id', merchantId)
        .order('start_date', { ascending: true });

      const contracts = allContracts || [];
      const { avgTenure, turnoverRate, moveIns, moveOuts } = calcTenureMetrics(contracts);

      // Snapshots
      const { data: snapshots } = await supabase
        .from('occupancy_snapshots')
        .select('snapshot_month, occupancy_rate, new_move_ins, move_outs, total_units, occupied_units')
        .eq('merchant_id', merchantId)
        .order('snapshot_month', { ascending: true })
        .limit(24);

      return {
        avgTenureMonths: avgTenure,
        turnoverRateAnnual: turnoverRate,
        avgVacancyDays: 0,
        currentOccupancyRate: total > 0 ? (occupied / total) * 100 : 0,
        moveInsByMonth: moveIns,
        moveOutsByMonth: moveOuts,
        snapshots: (snapshots || []) as any,
      };
    }

    return { avgTenureMonths: 0, turnoverRateAnnual: 0, avgVacancyDays: 0, currentOccupancyRate: 0, moveInsByMonth: {}, moveOutsByMonth: {}, snapshots: [] };
  },

  async fetchPaymentProfiles(merchantId: string): Promise<TenantPaymentProfile[]> {
    // Get all active contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('tenant_user_id, start_date, end_date, status')
      .eq('merchant_id', merchantId)
      .order('start_date', { ascending: true });

    const tenantIds = [...new Set((contracts || []).map(c => c.tenant_user_id))];
    if (tenantIds.length === 0) return [];

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', tenantIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    // Get invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('tenant_user_id, status, due_date, paid_at, late_fee')
      .eq('merchant_id', merchantId)
      .in('tenant_user_id', tenantIds);

    // Get risk scores
    const { data: riskScores } = await supabase
      .from('tenant_risk_scores')
      .select('tenant_user_id, risk_score, risk_level')
      .eq('merchant_id', merchantId)
      .in('tenant_user_id', tenantIds);
    const riskMap = new Map((riskScores || []).map(r => [r.tenant_user_id, r]));

    // Group invoices per tenant
    const invoiceMap = new Map<string, typeof invoices>();
    for (const inv of invoices || []) {
      const list = invoiceMap.get(inv.tenant_user_id) || [];
      list.push(inv);
      invoiceMap.set(inv.tenant_user_id, list);
    }

    // Contract counts per tenant
    const contractMap = new Map<string, Array<typeof contracts extends Array<infer T> ? T : never>>();
    for (const c of contracts || []) {
      const list = contractMap.get(c.tenant_user_id) || [];
      list.push(c);
      contractMap.set(c.tenant_user_id, list);
    }

    return tenantIds.map(tid => {
      const tInvoices = invoiceMap.get(tid) || [];
      const tContracts = contractMap.get(tid) || [];
      const risk = riskMap.get(tid);

      const paidOnTime = tInvoices.filter(i => i.status === 'paid' && i.paid_at && i.due_date && new Date(i.paid_at) <= new Date(i.due_date)).length;
      const paidLate = tInvoices.filter(i => i.status === 'paid' && i.paid_at && i.due_date && new Date(i.paid_at) > new Date(i.due_date)).length;
      const unpaid = tInvoices.filter(i => ['pending', 'overdue'].includes(i.status)).length;

      const lateDays = tInvoices
        .filter(i => i.paid_at && i.due_date && new Date(i.paid_at) > new Date(i.due_date))
        .map(i => Math.ceil((new Date(i.paid_at!).getTime() - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      const avgDaysLate = lateDays.length > 0 ? lateDays.reduce((a, b) => a + b, 0) / lateDays.length : 0;

      const totalLateFees = tInvoices.reduce((sum, i) => sum + (i.late_fee || 0), 0);

      // Payment score: 100 - (late% * 50) - (unpaid% * 50)
      const total = tInvoices.length;
      const paymentScore = total > 0
        ? Math.max(0, Math.min(100, 100 - (paidLate / total) * 50 - (unpaid / total) * 50))
        : 50; // neutral if no invoices

      // Tenure
      let totalMonths = 0;
      for (const c of tContracts) {
        const start = new Date(c.start_date);
        const end = c.status === 'active' ? new Date() : new Date(c.end_date);
        totalMonths += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      }

      return {
        tenant_user_id: tid,
        tenant_name: profileMap.get(tid) || null,
        total_invoices: total,
        paid_on_time: paidOnTime,
        paid_late: paidLate,
        unpaid,
        avg_days_late: Math.round(avgDaysLate * 10) / 10,
        total_late_fees: totalLateFees,
        payment_score: Math.round(paymentScore),
        renewal_count: Math.max(0, tContracts.length - 1),
        total_tenure_months: Math.round(totalMonths),
        risk_level: risk?.risk_level || null,
        risk_score: risk?.risk_score ?? null,
      };
    });
  },
};

function deriveAgeGroup(dob: string | null): string | null {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 20) return '<20';
  if (age < 25) return '20-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  if (age < 50) return '40-49';
  return '50+';
}

function calcTenureMetrics(contracts: Array<{ tenant_user_id: string; start_date: string; end_date: string; actual_end_date?: string | null; status: string | null }>) {
  const moveIns: Record<string, number> = {};
  const moveOuts: Record<string, number> = {};
  const tenures: number[] = [];

  const uniqueTenants = new Set<string>();
  const exitedTenants = new Set<string>();

  for (const c of contracts) {
    const startMonth = c.start_date.slice(0, 7);
    moveIns[startMonth] = (moveIns[startMonth] || 0) + 1;

    const endDate = c.actual_end_date || (c.status !== 'active' ? c.end_date : null);
    if (endDate) {
      const endMonth = endDate.slice(0, 7);
      moveOuts[endMonth] = (moveOuts[endMonth] || 0) + 1;
      exitedTenants.add(c.tenant_user_id);
    }

    const start = new Date(c.start_date);
    const end = endDate ? new Date(endDate) : new Date();
    tenures.push((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

    uniqueTenants.add(c.tenant_user_id);
  }

  const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;
  const turnoverRate = uniqueTenants.size > 0 ? (exitedTenants.size / uniqueTenants.size) * 100 : 0;

  return { avgTenure: Math.round(avgTenure * 10) / 10, turnoverRate: Math.round(turnoverRate * 10) / 10, moveIns, moveOuts };
}
