import { supabase } from '@/integrations/supabase/client';

export interface VendorPerformanceData {
  vendor_id: string;
  business_name: string;
  contact_email: string;
  service_categories: string[] | null;
  rating: number | null;
  total_jobs: number;
  avg_response_hours: number | null;
  avg_completion_hours: number | null;
  total_cost: number;
  cost_per_job: number;
  is_preferred: boolean;
}

export interface VendorJobHistory {
  id: string;
  maintenance_request_id: string;
  title: string;
  status: string;
  agreed_price: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  rating: number | null;
  review_comment: string | null;
}

export async function fetchVendorPerformance(merchantId: string): Promise<VendorPerformanceData[]> {
  // Get all vendors that have jobs for this merchant
  const { data: jobs, error: jobsErr } = await supabase
    .from('vendor_jobs')
    .select(`
      id, vendor_id, agreed_price, created_at, started_at, completed_at, status,
      maintenance_requests!inner(merchant_id)
    `)
    .eq('maintenance_requests.merchant_id', merchantId);

  if (jobsErr) throw jobsErr;

  // Get vendor details
  const vendorIds = [...new Set((jobs || []).map((j: any) => j.vendor_id))];
  if (vendorIds.length === 0) return [];

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, contact_email, service_categories, rating, total_jobs')
    .in('id', vendorIds);

  // Get preferred status
  const { data: pvs } = await supabase
    .from('property_vendor_services')
    .select('vendor_id, is_preferred')
    .in('vendor_id', vendorIds)
    .eq('is_preferred', true);

  const preferredSet = new Set((pvs || []).map((p: any) => p.vendor_id));

  // Get reviews
  const { data: reviews } = await supabase
    .from('maintenance_reviews')
    .select('vendor_id, rating')
    .in('vendor_id', vendorIds);

  // Aggregate per vendor
  const vendorMap = new Map<string, VendorPerformanceData>();

  for (const v of vendors || []) {
    const vJobs = (jobs || []).filter((j: any) => j.vendor_id === v.id);
    const vReviews = (reviews || []).filter((r: any) => r.vendor_id === v.id);

    const responseTimes = vJobs
      .filter((j: any) => j.started_at && j.created_at)
      .map((j: any) => (new Date(j.started_at).getTime() - new Date(j.created_at).getTime()) / 3600000);

    const completionTimes = vJobs
      .filter((j: any) => j.completed_at && j.started_at)
      .map((j: any) => (new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()) / 3600000);

    const totalCost = vJobs.reduce((sum: number, j: any) => sum + (j.agreed_price || 0), 0);
    const avgRating = vReviews.length > 0 
      ? vReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / vReviews.length 
      : v.rating;

    vendorMap.set(v.id, {
      vendor_id: v.id,
      business_name: v.business_name,
      contact_email: v.contact_email,
      service_categories: v.service_categories,
      rating: avgRating,
      total_jobs: vJobs.length,
      avg_response_hours: responseTimes.length > 0
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
        : null,
      avg_completion_hours: completionTimes.length > 0
        ? completionTimes.reduce((a: number, b: number) => a + b, 0) / completionTimes.length
        : null,
      total_cost: totalCost,
      cost_per_job: vJobs.length > 0 ? totalCost / vJobs.length : 0,
      is_preferred: preferredSet.has(v.id),
    });
  }

  return Array.from(vendorMap.values());
}

export async function fetchVendorHistory(vendorId: string, merchantId: string): Promise<VendorJobHistory[]> {
  const { data: jobs, error } = await supabase
    .from('vendor_jobs')
    .select(`
      id, vendor_id, agreed_price, created_at, started_at, completed_at, status,
      maintenance_request_id,
      maintenance_requests!inner(merchant_id, title)
    `)
    .eq('vendor_id', vendorId)
    .eq('maintenance_requests.merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get reviews for these jobs
  const { data: reviews } = await supabase
    .from('maintenance_reviews')
    .select('maintenance_request_id, rating, comment')
    .eq('vendor_id', vendorId);

  const reviewMap = new Map((reviews || []).map((r: any) => [r.maintenance_request_id, r]));

  return (jobs || []).map((j: any) => {
    const review = reviewMap.get(j.maintenance_request_id);
    return {
      id: j.id,
      maintenance_request_id: j.maintenance_request_id,
      title: j.maintenance_requests?.title || '',
      status: j.status,
      agreed_price: j.agreed_price,
      created_at: j.created_at,
      started_at: j.started_at,
      completed_at: j.completed_at,
      rating: review?.rating || null,
      review_comment: review?.comment || null,
    };
  });
}

export async function togglePreferredVendor(vendorId: string, merchantId: string, isPreferred: boolean): Promise<void> {
  // Update all property_vendor_services for this vendor under this merchant's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('merchant_id', merchantId);

  if (!properties?.length) return;

  const propertyIds = properties.map((p: any) => p.id);

  const { error } = await supabase
    .from('property_vendor_services')
    .update({ is_preferred: isPreferred })
    .eq('vendor_id', vendorId)
    .in('property_id', propertyIds);

  if (error) throw error;
}
