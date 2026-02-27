import type { InsurancePolicy } from '../types';

export interface RenewalAlert {
  policy: InsurancePolicy;
  daysUntilExpiry: number;
  urgency: 'critical' | 'warning' | 'info';
}

export function checkInsuranceRenewals(policies: InsurancePolicy[]): RenewalAlert[] {
  const now = new Date();
  const alerts: RenewalAlert[] = [];

  for (const policy of policies) {
    if (policy.status !== 'active' || !policy.end_date) continue;
    const endDate = new Date(policy.end_date);
    const diffMs = endDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 60) {
      alerts.push({
        policy,
        daysUntilExpiry,
        urgency: daysUntilExpiry <= 0 ? 'critical' : daysUntilExpiry <= 30 ? 'warning' : 'info',
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export function getCoverageGaps(policies: InsurancePolicy[]): string[] {
  const activePolicies = policies.filter(p => p.status === 'active');
  const activeTypes = new Set(activePolicies.map(p => p.policy_type));
  const essentialTypes = ['fire', 'flood', 'earthquake'];
  const gaps: string[] = [];

  for (const type of essentialTypes) {
    if (!activeTypes.has(type) && !activeTypes.has('comprehensive')) {
      const labels: Record<string, string> = { fire: 'Kebakaran', flood: 'Banjir', earthquake: 'Gempa Bumi' };
      gaps.push(labels[type] || type);
    }
  }

  return gaps;
}
