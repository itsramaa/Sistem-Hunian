import { supabase } from '@/integrations/supabase/client';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

export interface PreventiveSchedule {
  id: string;
  merchantId: string;
  propertyId: string | null;
  unitId: string | null;
  title: string;
  description: string | null;
  category: string;
  frequency: string;
  customIntervalDays: number | null;
  preferredVendorId: string | null;
  estimatedCost: number;
  priority: string;
  nextScheduledDate: string;
  lastExecutedDate: string | null;
  isActive: boolean;
  createdAt: string;
  // Joined
  propertyName?: string;
  unitNumber?: string;
  vendorName?: string;
}

function mapSchedule(r: any): PreventiveSchedule {
  return {
    id: r.id,
    merchantId: r.merchant_id,
    propertyId: r.property_id,
    unitId: r.unit_id,
    title: r.title,
    description: r.description,
    category: r.category,
    frequency: r.frequency,
    customIntervalDays: r.custom_interval_days,
    preferredVendorId: r.preferred_vendor_id,
    estimatedCost: Number(r.estimated_cost || 0),
    priority: r.priority,
    nextScheduledDate: r.next_scheduled_date,
    lastExecutedDate: r.last_executed_date,
    isActive: r.is_active,
    createdAt: r.created_at,
    propertyName: r.properties?.name || null,
    unitNumber: r.units?.unit_number || null,
    vendorName: r.vendors?.business_name || null,
  };
}

function calculateNextDate(current: string, frequency: string, customDays?: number | null): string {
  const date = new Date(current);
  switch (frequency) {
    case 'weekly': return addWeeks(date, 1).toISOString().split('T')[0];
    case 'monthly': return addMonths(date, 1).toISOString().split('T')[0];
    case 'quarterly': return addMonths(date, 3).toISOString().split('T')[0];
    case 'biannual': return addMonths(date, 6).toISOString().split('T')[0];
    case 'annual': return addYears(date, 1).toISOString().split('T')[0];
    case 'custom': return addDays(date, customDays || 30).toISOString().split('T')[0];
    default: return addMonths(date, 1).toISOString().split('T')[0];
  }
}

export const preventiveMaintenanceService = {
  async fetchSchedules(merchantId: string): Promise<PreventiveSchedule[]> {
    const { data, error } = await supabase
      .from('preventive_maintenance_schedules')
      .select('*, properties(name), units(unit_number), vendors(business_name)')
      .eq('merchant_id', merchantId)
      .order('next_scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSchedule);
  },

  async createSchedule(payload: {
    merchantId: string;
    propertyId?: string;
    unitId?: string;
    title: string;
    description?: string;
    category: string;
    frequency: string;
    customIntervalDays?: number;
    preferredVendorId?: string;
    estimatedCost?: number;
    priority?: string;
    nextScheduledDate: string;
  }): Promise<void> {
    const { error } = await supabase.from('preventive_maintenance_schedules').insert({
      merchant_id: payload.merchantId,
      property_id: payload.propertyId || null,
      unit_id: payload.unitId || null,
      title: payload.title,
      description: payload.description || null,
      category: payload.category,
      frequency: payload.frequency,
      custom_interval_days: payload.customIntervalDays || null,
      preferred_vendor_id: payload.preferredVendorId || null,
      estimated_cost: payload.estimatedCost || 0,
      priority: payload.priority || 'medium',
      next_scheduled_date: payload.nextScheduledDate,
    });
    if (error) throw error;
  },

  async updateSchedule(id: string, payload: Partial<{
    title: string;
    description: string;
    category: string;
    frequency: string;
    customIntervalDays: number;
    preferredVendorId: string;
    estimatedCost: number;
    priority: string;
    nextScheduledDate: string;
    isActive: boolean;
  }>): Promise<void> {
    const updates: Record<string, any> = {};
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.frequency !== undefined) updates.frequency = payload.frequency;
    if (payload.customIntervalDays !== undefined) updates.custom_interval_days = payload.customIntervalDays;
    if (payload.preferredVendorId !== undefined) updates.preferred_vendor_id = payload.preferredVendorId;
    if (payload.estimatedCost !== undefined) updates.estimated_cost = payload.estimatedCost;
    if (payload.priority !== undefined) updates.priority = payload.priority;
    if (payload.nextScheduledDate !== undefined) updates.next_scheduled_date = payload.nextScheduledDate;
    if (payload.isActive !== undefined) updates.is_active = payload.isActive;

    const { error } = await supabase
      .from('preventive_maintenance_schedules')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('preventive_maintenance_schedules')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async executeSchedule(scheduleId: string): Promise<void> {
    // Fetch schedule
    const { data: schedule, error: fetchErr } = await supabase
      .from('preventive_maintenance_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();
    if (fetchErr) throw fetchErr;

    // Create maintenance request
    const insertData: Record<string, any> = {
      title: `[Preventif] ${schedule.title}`,
      description: schedule.description || `Jadwal maintenance preventif: ${schedule.title}`,
      category: schedule.category,
      priority: schedule.priority,
      merchant_id: schedule.merchant_id,
      unit_id: schedule.unit_id,
      status: schedule.preferred_vendor_id ? 'in_progress' : 'pending',
      assigned_vendor_id: schedule.preferred_vendor_id || null,
    };

    const { error: insertErr } = await supabase
      .from('maintenance_requests')
      .insert(insertData as any);
    if (insertErr) throw insertErr;

    // Update schedule
    const nextDate = calculateNextDate(schedule.next_scheduled_date, schedule.frequency, schedule.custom_interval_days);
    const { error: updateErr } = await supabase
      .from('preventive_maintenance_schedules')
      .update({
        last_executed_date: new Date().toISOString().split('T')[0],
        next_scheduled_date: nextDate,
      })
      .eq('id', scheduleId);
    if (updateErr) throw updateErr;
  },

  async getOverdueSchedules(merchantId: string): Promise<PreventiveSchedule[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('preventive_maintenance_schedules')
      .select('*, properties(name), units(unit_number), vendors(business_name)')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .lt('next_scheduled_date', today)
      .order('next_scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSchedule);
  },

  async getCostComparison(merchantId: string): Promise<{
    preventiveCost: number;
    emergencyCost: number;
  }> {
    // Preventive: sum estimated_cost of active schedules (annualized)
    const { data: schedules } = await supabase
      .from('preventive_maintenance_schedules')
      .select('estimated_cost, frequency')
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    let preventiveCost = 0;
    (schedules || []).forEach((s: any) => {
      const cost = Number(s.estimated_cost || 0);
      const multiplier: Record<string, number> = {
        weekly: 52, monthly: 12, quarterly: 4, biannual: 2, annual: 1, custom: 4,
      };
      preventiveCost += cost * (multiplier[s.frequency] || 12);
    });

    // Emergency: sum of completed maintenance (last 12 months)
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const { data: emergencyData } = await supabase
      .from('vendor_jobs')
      .select('agreed_price')
      .eq('merchant_id', merchantId)
      .eq('status', 'completed')
      .gte('created_at', yearAgo.toISOString());

    const emergencyCost = (emergencyData || []).reduce((sum: number, j: any) => sum + Number(j.agreed_price || 0), 0);

    return { preventiveCost, emergencyCost };
  },
};
