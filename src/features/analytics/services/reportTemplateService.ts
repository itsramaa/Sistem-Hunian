import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
export interface ExecutiveSummaryData {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingMaintenance: number;
  avgRiskScore: number;
}

export interface PropertyAnalysisData {
  property: {
    id: string;
    name: string;
    address: string;
    property_type: string;
    total_units: number;
    occupied_units: number;
  };
  units: { id: string; unit_number: string; status: string; rent_amount: number }[];
  activeContracts: number;
  maintenanceRequests: { total: number; pending: number; completed: number };
}

export interface FinancialPerformanceData {
  properties: { name: string; revenue: number; expenses: number; netIncome: number; roi: number }[];
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
}

export interface RiskAssessmentData {
  properties: { name: string; disasterRiskLevel: string; overallRiskScore: number; floodRisk: string; earthquakeRisk: string; fireRisk: string }[];
  tenantRiskDistribution: { level: string; count: number }[];
  complianceStatus: { valid: number; expired: number; pending: number };
}

export interface InvestmentOpportunityData {
  properties: { name: string; roi: number; occupancyRate: number; avgRent: number; recommendation: string }[];
}

export async function fetchExecutiveSummary(merchantId: string): Promise<ExecutiveSummaryData> {
  const [propertiesRes, unitsRes, paymentsRes, maintenanceRes] = await Promise.all([
    db.from("properties").select("id, total_units, occupied_units").eq("merchant_id", merchantId),
    db.from("units").select("id, status").eq("merchant_id", merchantId),
    db.from("payments").select("amount, status").eq("merchant_id", merchantId).eq("status", "paid"),
    db.from("maintenance_requests").select("id, status").eq("merchant_id", merchantId),
  ]);

  const units = unitsRes.data || [];
  const payments = paymentsRes.data || [];
  const maintenance = maintenanceRes.data || [];

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length;
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const pendingMaintenance = maintenance.filter((m: any) => m.status === "pending" || m.status === "in_progress").length;

  return {
    totalProperties: (propertiesRes.data || []).length,
    totalUnits,
    occupiedUnits,
    occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
    totalRevenue,
    pendingMaintenance,
    avgRiskScore: 0,
  };
}

export async function fetchPropertyAnalysis(merchantId: string, propertyId: string): Promise<PropertyAnalysisData> {
  const [propertyRes, unitsRes, contractsRes, maintenanceRes] = await Promise.all([
    db.from("properties").select("id, name, address, property_type, total_units, occupied_units").eq("id", propertyId).single(),
    db.from("units").select("id, unit_number, status, rent_amount").eq("property_id", propertyId),
    db.from("contracts").select("id, status").eq("merchant_id", merchantId).eq("status", "active"),
    db.from("maintenance_requests").select("id, status").eq("merchant_id", merchantId),
  ]);

  const maintenance = maintenanceRes.data || [];
  const prop = propertyRes.data;

  return {
    property: prop ? { id: prop.id, name: prop.name, address: prop.address || "", property_type: prop.property_type || "", total_units: prop.total_units || 0, occupied_units: prop.occupied_units || 0 } : { id: "", name: "", address: "", property_type: "", total_units: 0, occupied_units: 0 },
    units: (unitsRes.data || []).map((u: any) => ({ id: u.id, unit_number: u.unit_number, status: u.status, rent_amount: u.rent_amount || 0 })),
    activeContracts: (contractsRes.data || []).length,
    maintenanceRequests: {
      total: maintenance.length,
      pending: maintenance.filter((m: any) => m.status === "pending").length,
      completed: maintenance.filter((m: any) => m.status === "completed").length,
    },
  };
}

export async function fetchFinancialPerformance(merchantId: string): Promise<FinancialPerformanceData> {
  const [propertiesRes, unitsRes, expensesRes, paymentsRes] = await Promise.all([
    db.from("properties").select("id, name").eq("merchant_id", merchantId),
    db.from("units").select("id, property_id, rent_amount, status").eq("merchant_id", merchantId),
    db.from("maintenance_expenses").select("total_amount").eq("merchant_id", merchantId),
    db.from("payments").select("amount, status").eq("merchant_id", merchantId).eq("status", "paid"),
  ]);

  const properties = propertiesRes.data || [];
  const units = unitsRes.data || [];
  const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);
  const totalRevenue = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const propertyData = properties.map((prop: any) => {
    const propUnits = units.filter((u: any) => u.property_id === prop.id);
    const annualRevenue = propUnits.reduce((sum: number, u: any) => sum + ((u.rent_amount || 0) * 12), 0);
    return { name: prop.name, revenue: annualRevenue, expenses: 0, netIncome: annualRevenue, roi: 0 };
  });

  return { properties: propertyData, totalRevenue, totalExpenses, totalNetIncome: totalRevenue - totalExpenses };
}

export async function fetchRiskAssessment(merchantId: string): Promise<RiskAssessmentData> {
  const [riskProfilesRes, complianceRes] = await Promise.all([
    db.from("disaster_risk_profiles").select("risk_zone, overall_risk_score, flood_risk, earthquake_risk, fire_risk, property_id").eq("merchant_id", merchantId),
    db.from("compliance_documents").select("id, status").eq("merchant_id", merchantId),
  ]);

  const profiles = riskProfilesRes.data || [];
  const compliance = complianceRes.data || [];

  // Fetch property names separately
  const propertyIds = profiles.map((p: any) => p.property_id);
  let propertyNames: Record<string, string> = {};
  if (propertyIds.length > 0) {
    const { data: props } = await db.from("properties").select("id, name").in("id", propertyIds);
    (props || []).forEach((p: any) => { propertyNames[p.id] = p.name; });
  }

  return {
    properties: profiles.map((p: any) => ({
      name: propertyNames[p.property_id] || "Unknown",
      disasterRiskLevel: p.risk_zone,
      overallRiskScore: p.overall_risk_score || 0,
      floodRisk: p.flood_risk || "unknown",
      earthquakeRisk: p.earthquake_risk || "unknown",
      fireRisk: p.fire_risk || "unknown",
    })),
    tenantRiskDistribution: [],
    complianceStatus: {
      valid: compliance.filter((c: any) => c.status === "valid" || c.status === "active").length,
      expired: compliance.filter((c: any) => c.status === "expired").length,
      pending: compliance.filter((c: any) => c.status === "pending").length,
    },
  };
}

export async function fetchInvestmentOpportunity(merchantId: string): Promise<InvestmentOpportunityData> {
  const [propertiesRes, unitsRes] = await Promise.all([
    db.from("properties").select("id, name, total_units, occupied_units").eq("merchant_id", merchantId),
    db.from("units").select("id, property_id, rent_amount, status").eq("merchant_id", merchantId),
  ]);

  const properties = propertiesRes.data || [];
  const units = unitsRes.data || [];

  return {
    properties: properties.map((prop: any) => {
      const propUnits = units.filter((u: any) => u.property_id === prop.id);
      const totalUnits = propUnits.length;
      const occupiedUnits = propUnits.filter((u: any) => u.status === "occupied").length;
      const avgRent = totalUnits > 0 ? propUnits.reduce((s: number, u: any) => s + (u.rent_amount || 0), 0) / totalUnits : 0;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      let recommendation = "Hold";
      if (occupancyRate > 80) recommendation = "Buy/Invest";
      else if (occupancyRate < 40) recommendation = "Sell/Divest";

      return { name: prop.name, roi: 0, occupancyRate, avgRent, recommendation };
    }),
  };
}
