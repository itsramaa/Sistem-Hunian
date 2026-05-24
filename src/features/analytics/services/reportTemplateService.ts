import { apiClient } from "@/lib/axios";

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
    apiClient.get('/properties', { params: { select: 'id,total_units,occupied_units', merchant_id: merchantId } }),
    apiClient.get('/units', { params: { select: 'id,status', merchant_id: merchantId } }),
    apiClient.get('/payments', { params: { select: 'amount,status', merchant_id: merchantId, status: 'eq.paid' } }),
    apiClient.get('/maintenance-requests', { params: { select: 'id,status', merchant_id: merchantId } }),
  ]);

  const units = (unitsRes.data || []) as { status: string }[];
  const payments = (paymentsRes.data || []) as { amount: number }[];
  const maintenance = (maintenanceRes.data || []) as { status: string }[];

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === "occupied").length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingMaintenance = maintenance.filter((m) => m.status === "pending" || m.status === "in_progress").length;

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
    apiClient.get(`/properties/${propertyId}`, { params: { select: 'id,name,address,property_type,total_units,occupied_units' } }),
    apiClient.get('/units', { params: { select: 'id,unit_number,status,rent_amount', property_id: propertyId } }),
    apiClient.get('/contracts', { params: { select: 'id,status', merchant_id: merchantId, status: 'eq.active' } }),
    apiClient.get('/maintenance-requests', { params: { select: 'id,status', merchant_id: merchantId } }),
  ]);

  const maintenance = (maintenanceRes.data || []) as { status: string }[];
  const prop = propertyRes.data as { id: string; name: string; address: string; property_type: string; total_units: number; occupied_units: number } | null;

  return {
    property: prop
      ? { id: prop.id, name: prop.name, address: prop.address || "", property_type: prop.property_type || "", total_units: prop.total_units || 0, occupied_units: prop.occupied_units || 0 }
      : { id: "", name: "", address: "", property_type: "", total_units: 0, occupied_units: 0 },
    units: ((unitsRes.data || []) as { id: string; unit_number: string; status: string; rent_amount: number }[]).map((u) => ({
      id: u.id, unit_number: u.unit_number, status: u.status, rent_amount: u.rent_amount || 0,
    })),
    activeContracts: (contractsRes.data || []).length,
    maintenanceRequests: {
      total: maintenance.length,
      pending: maintenance.filter((m) => m.status === "pending").length,
      completed: maintenance.filter((m) => m.status === "completed").length,
    },
  };
}

export async function fetchFinancialPerformance(merchantId: string): Promise<FinancialPerformanceData> {
  const [propertiesRes, unitsRes, expensesRes, paymentsRes] = await Promise.all([
    apiClient.get('/properties', { params: { select: 'id,name', merchant_id: merchantId } }),
    apiClient.get('/units', { params: { select: 'id,property_id,rent_amount,status', merchant_id: merchantId } }),
    apiClient.get('/maintenance-expenses', { params: { select: 'total_amount', merchant_id: merchantId } }),
    apiClient.get('/payments', { params: { select: 'amount,status', merchant_id: merchantId, status: 'eq.paid' } }),
  ]);

  const properties = (propertiesRes.data || []) as { id: string; name: string }[];
  const units = (unitsRes.data || []) as { id: string; property_id: string; rent_amount: number; status: string }[];
  const totalExpenses = ((expensesRes.data || []) as { total_amount: number }[]).reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const totalRevenue = ((paymentsRes.data || []) as { amount: number }[]).reduce((sum, p) => sum + (p.amount || 0), 0);

  const propertyData = properties.map((prop) => {
    const propUnits = units.filter((u) => u.property_id === prop.id);
    const annualRevenue = propUnits.reduce((sum, u) => sum + ((u.rent_amount || 0) * 12), 0);
    return { name: prop.name, revenue: annualRevenue, expenses: 0, netIncome: annualRevenue, roi: 0 };
  });

  return { properties: propertyData, totalRevenue, totalExpenses, totalNetIncome: totalRevenue - totalExpenses };
}

export async function fetchRiskAssessment(merchantId: string): Promise<RiskAssessmentData> {
  const [riskProfilesRes, complianceRes] = await Promise.all([
    apiClient.get('/disaster-risk-profiles', {
      params: { select: 'risk_zone,overall_risk_score,flood_risk,earthquake_risk,fire_risk,property_id', merchant_id: merchantId },
    }),
    apiClient.get('/compliance-documents', { params: { select: 'id,status', merchant_id: merchantId } }),
  ]);

  const profiles = (riskProfilesRes.data || []) as { risk_zone: string; overall_risk_score: number; flood_risk: string; earthquake_risk: string; fire_risk: string; property_id: string }[];
  const compliance = (complianceRes.data || []) as { status: string }[];

  // Fetch property names separately
  const propertyIds = profiles.map((p) => p.property_id);
  const propertyNames: Record<string, string> = {};
  if (propertyIds.length > 0) {
    const propsRes = await apiClient.get('/properties', { params: { select: 'id,name', id: `in.(${propertyIds.join(',')})` } });
    ((propsRes.data || []) as { id: string; name: string }[]).forEach((p) => { propertyNames[p.id] = p.name; });
  }

  return {
    properties: profiles.map((p) => ({
      name: propertyNames[p.property_id] || "Unknown",
      disasterRiskLevel: p.risk_zone,
      overallRiskScore: p.overall_risk_score || 0,
      floodRisk: p.flood_risk || "unknown",
      earthquakeRisk: p.earthquake_risk || "unknown",
      fireRisk: p.fire_risk || "unknown",
    })),
    tenantRiskDistribution: [],
    complianceStatus: {
      valid: compliance.filter((c) => c.status === "valid" || c.status === "active").length,
      expired: compliance.filter((c) => c.status === "expired").length,
      pending: compliance.filter((c) => c.status === "pending").length,
    },
  };
}

export async function fetchInvestmentOpportunity(merchantId: string): Promise<InvestmentOpportunityData> {
  const [propertiesRes, unitsRes] = await Promise.all([
    apiClient.get('/properties', { params: { select: 'id,name,total_units,occupied_units', merchant_id: merchantId } }),
    apiClient.get('/units', { params: { select: 'id,property_id,rent_amount,status', merchant_id: merchantId } }),
  ]);

  const properties = (propertiesRes.data || []) as { id: string; name: string; total_units: number; occupied_units: number }[];
  const units = (unitsRes.data || []) as { id: string; property_id: string; rent_amount: number; status: string }[];

  return {
    properties: properties.map((prop) => {
      const propUnits = units.filter((u) => u.property_id === prop.id);
      const totalUnits = propUnits.length;
      const occupiedUnits = propUnits.filter((u) => u.status === "occupied").length;
      const avgRent = totalUnits > 0 ? propUnits.reduce((s, u) => s + (u.rent_amount || 0), 0) / totalUnits : 0;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      let recommendation = "Hold";
      if (occupancyRate > 80) recommendation = "Buy/Invest";
      else if (occupancyRate < 40) recommendation = "Sell/Divest";

      return { name: prop.name, roi: 0, occupancyRate, avgRent, recommendation };
    }),
  };
}
