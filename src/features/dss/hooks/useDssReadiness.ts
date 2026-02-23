import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChecklistItem {
  key: string;
  label: string;
  level: 1 | 2 | 3 | 4;
  completed: boolean;
  icon: string;
  link?: string;
}

export interface ReadinessLevel {
  level: number;
  label: string;
  badge: string;
  score: number;
  items: ChecklistItem[];
  color: string;
}

export interface DssReadinessResult {
  overallScore: number;
  levels: ReadinessLevel[];
  isDssReady: boolean;
  missingItems: ChecklistItem[];
  isLoading: boolean;
}

export function useDssReadiness(propertyId: string | undefined, merchantId: string | undefined): DssReadinessResult {
  const { data, isLoading } = useQuery({
    queryKey: ["dss-readiness", propertyId, merchantId],
    queryFn: async () => {
      if (!propertyId || !merchantId) return null;

      // Parallel fetch all data
      const [
        { data: property },
        { data: units },
        { data: guardians },
        { data: disasterRisk },
        { data: insurance },
        { data: complianceDocs },
        { data: tenantMetrics },
        { data: occupancy },
      ] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
        supabase.from("units").select("id, unit_number, unit_type, rent_amount, status").eq("property_id", propertyId),
        supabase.from("property_guardians").select("id, status").eq("property_id", propertyId).eq("status", "active"),
        supabase.from("disaster_risk_profiles").select("id").eq("property_id", propertyId),
        supabase.from("insurance_policies").select("id, status").eq("property_id", propertyId).eq("status", "active"),
        supabase.from("compliance_documents").select("id, document_type").eq("property_id", propertyId),
        supabase.from("tenant_payment_metrics").select("id").eq("merchant_id", merchantId).limit(1),
        supabase.from("occupancy_snapshots").select("id").eq("property_id", propertyId).limit(1),
      ]);

      // Level 1: Onboarding
      const l1Items: ChecklistItem[] = [
        { key: "name", label: "Nama properti", level: 1, completed: !!property?.name, icon: "🏠", link: `/merchant/properties/${propertyId}` },
        { key: "property_type", label: "Tipe properti", level: 1, completed: !!property?.property_type, icon: "🏗️", link: `/merchant/properties/${propertyId}` },
        { key: "address", label: "Alamat lengkap", level: 1, completed: !!(property?.address && property?.province && property?.city), icon: "📍", link: `/merchant/properties/${propertyId}` },
        { key: "units", label: "Minimal 1 unit", level: 1, completed: (units?.length || 0) > 0, icon: "🚪", link: `/merchant/properties/${propertyId}` },
      ];

      // Level 2: Operasional
      const l2Items: ChecklistItem[] = [
        { key: "amenities", label: "Fasilitas (min. 1)", level: 2, completed: (property?.amenities?.length || 0) > 0, icon: "🎯", link: `/merchant/properties/${propertyId}` },
        { key: "images", label: "Foto properti (min. 1)", level: 2, completed: (property?.images?.length || 0) > 0, icon: "📸", link: `/merchant/properties/${propertyId}` },
        { key: "guardian", label: "Penjaga aktif", level: 2, completed: (guardians?.length || 0) > 0, icon: "👤", link: `/merchant/guardians` },
        { key: "description", label: "Deskripsi properti", level: 2, completed: !!property?.description, icon: "📝", link: `/merchant/properties/${propertyId}` },
        { key: "floor_count", label: "Jumlah lantai", level: 2, completed: !!property?.floor_count, icon: "🏢", link: `/merchant/properties/${propertyId}` },
        { key: "building_condition", label: "Kondisi bangunan", level: 2, completed: !!property?.building_condition, icon: "🔧", link: `/merchant/properties/${propertyId}` },
      ];

      // Level 3: Financial
      const l3Items: ChecklistItem[] = [
        { key: "construction_cost", label: "Biaya pembangunan", level: 3, completed: !!property?.construction_cost, icon: "💰", link: `/merchant/properties/${propertyId}` },
        { key: "renovation_cost", label: "Biaya renovasi", level: 3, completed: !!property?.renovation_cost, icon: "🔨", link: `/merchant/properties/${propertyId}` },
        { key: "funding_source", label: "Sumber pendanaan", level: 3, completed: !!property?.funding_source, icon: "🏦", link: `/merchant/properties/${propertyId}` },
        { key: "monthly_amortization", label: "Amortisasi bulanan", level: 3, completed: property?.monthly_amortization != null, icon: "📊", link: `/merchant/properties/${propertyId}` },
        { key: "monthly_maintenance_cost", label: "Biaya maintenance bulanan", level: 3, completed: property?.monthly_maintenance_cost != null, icon: "🛠️", link: `/merchant/properties/${propertyId}` },
        { key: "avg_annual_unexpected_cost", label: "Biaya tak terduga tahunan", level: 3, completed: property?.avg_annual_unexpected_cost != null, icon: "⚠️", link: `/merchant/properties/${propertyId}` },
        { key: "marketing_cost", label: "Biaya marketing", level: 3, completed: !!property?.marketing_cost, icon: "📢", link: `/merchant/properties/${propertyId}` },
      ];

      // Level 4: DSS Required
      const docTypes = (complianceDocs || []).map(d => d.document_type.toUpperCase());
      const hasIMB = docTypes.some(t => t.includes("IMB") || t.includes("PBG"));
      const hasPBB = docTypes.some(t => t.includes("PBB"));

      const l4Items: ChecklistItem[] = [
        { key: "all_financial", label: "Semua data financial (Level 3)", level: 4, completed: l3Items.every(i => i.completed), icon: "✅" },
        { key: "tenant_metrics", label: "Data payment tenant", level: 4, completed: (tenantMetrics?.length || 0) > 0, icon: "👥", link: `/merchant/tenant-analytics` },
        { key: "disaster_risk", label: "Profil risiko bencana", level: 4, completed: (disasterRisk?.length || 0) > 0, icon: "🌊", link: `/merchant/compliance` },
        { key: "insurance", label: "Polis asuransi aktif (min. 1)", level: 4, completed: (insurance?.length || 0) > 0, icon: "🛡️", link: `/merchant/compliance` },
        { key: "imb", label: "Dokumen IMB/PBG", level: 4, completed: hasIMB, icon: "📄", link: `/merchant/compliance` },
        { key: "pbb", label: "Dokumen PBB", level: 4, completed: hasPBB, icon: "📋", link: `/merchant/compliance` },
        { key: "occupancy", label: "Data occupancy (min. 1 bulan)", level: 4, completed: (occupancy?.length || 0) > 0, icon: "📈", link: `/merchant/properties/${propertyId}` },
      ];

      const calcScore = (items: ChecklistItem[]) => {
        if (items.length === 0) return 100;
        return Math.round((items.filter(i => i.completed).length / items.length) * 100);
      };

      const levels: ReadinessLevel[] = [
        { level: 1, label: "Onboarding", badge: "Wajib", score: calcScore(l1Items), items: l1Items, color: "text-success" },
        { level: 2, label: "Operasional", badge: "Recommended", score: calcScore(l2Items), items: l2Items, color: "text-info" },
        { level: 3, label: "Financial", badge: "Opsional", score: calcScore(l3Items), items: l3Items, color: "text-warning" },
        { level: 4, label: "DSS Required", badge: "Wajib DSS", score: calcScore(l4Items), items: l4Items, color: "text-destructive" },
      ];

      const allItems = [...l1Items, ...l2Items, ...l3Items, ...l4Items];
      const overallScore = Math.round((allItems.filter(i => i.completed).length / allItems.length) * 100);

      return { overallScore, levels, missingItems: allItems.filter(i => !i.completed) };
    },
    enabled: !!propertyId && !!merchantId,
  });

  return {
    overallScore: data?.overallScore ?? 0,
    levels: data?.levels ?? [],
    isDssReady: (data?.overallScore ?? 0) === 100,
    missingItems: data?.missingItems ?? [],
    isLoading,
  };
}
