import { Contract } from '../types';

/**
 * Helper to find the relevant contract for a tenant from a list of contracts.
 * Prioritizes 'active' or 'notice' status contracts.
 * Fallbacks to the most recent contract by end_date/start_date.
 */
export const getRelevantContract = (
  contracts: Partial<Contract>[] | undefined, 
  tenantUserId: string | undefined
): Partial<Contract> | undefined => {
  if (!contracts || !tenantUserId) return undefined;
  
  const tenantContracts = contracts.filter(c => c.tenant_user_id === tenantUserId);
  
  if (tenantContracts.length === 0) return undefined;
  
  // 1. Prioritize active or notice contracts
  const activeOrNotice = tenantContracts.find(c => 
    c.status && ['active', 'notice'].includes(c.status)
  );
  
  if (activeOrNotice) return activeOrNotice;
  
  // 2. Fallback: Sort by end_date (or start_date) descending to get the most recent one
  return [...tenantContracts].sort((a, b) => {
    const dateA = new Date(a.end_date || a.start_date || 0).getTime();
    const dateB = new Date(b.end_date || b.start_date || 0).getTime();
    return dateB - dateA;
  })[0];
};
