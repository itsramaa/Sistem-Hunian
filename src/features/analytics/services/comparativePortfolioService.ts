import { apiClient } from "@/lib/axios";

export interface PropertyBenchmark {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  avgRent: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  roi: number;
  pricePosition: "above" | "at" | "below";
  occupancyPosition: "above" | "at" | "below";
  overallRating: "excellent" | "good" | "average" | "poor";
}

export interface PortfolioSummary {
  totalProperties: number;
  totalUnits: number;
  totalOccupied: number;
  avgOccupancy: number;
  totalMonthlyRevenue: number;
  totalExpenses: number;
  portfolioROI: number;
}

export interface PerformanceRanking {
  propertyId: string;
  propertyName: string;
  occupancyRate: number;
  roi: number;
  avgRentPercentile: number;
  compositeScore: number;
  tier: "top" | "average" | "under";
}

export interface OptimizationRecommendation {
  propertyId: string;
  propertyName: string;
  type: "price_decrease" | "price_increase" | "high_demand" | "evaluate";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ComparativePortfolioData {
  benchmarks: PropertyBenchmark[];
  avgRent: number;
  avgOccupancy: number;
  portfolio: PortfolioSummary;
  rankings: PerformanceRanking[];
  recommendations: OptimizationRecommendation[];
}

function getPosition(value: number, avg: number): "above" | "at" | "below" {
  const threshold = avg * 0.1;
  if (value > avg + threshold) return "above";
  if (value < avg - threshold) return "below";
  return "at";
}

function getOverallRating(occupancyRate: number, pricePos: string): "excellent" | "good" | "average" | "poor" {
  if (occupancyRate >= 85 && pricePos !== "below") return "excellent";
  if (occupancyRate >= 70) return "good";
  if (occupancyRate >= 50) return "average";
  return "poor";
}

export async function fetchComparativePortfolioData(merchantId: string): Promise<ComparativePortfolioData> {
  try {
    const [propertiesRes, unitsRes, paymentsRes, expensesRes] = await Promise.all([
      apiClient.get('/properties', { params: { merchant_id: merchantId } }),
      apiClient.get('/units', { params: { merchant_id: merchantId } }),
      apiClient.get('/payments', { params: { merchant_id: merchantId, status: 'paid' } }),
      apiClient.get('/maintenance-expenses', { params: { merchant_id: merchantId } }),
    ]);

    const properties = propertiesRes.data || [];
    const units = unitsRes.data || [];
    const payments = paymentsRes.data || [];
    const expenses = expensesRes.data || [];

    const totalRevenue = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.total_amount || 0), 0);

    // Build per-property data
    const propertyData: PropertyBenchmark[] = properties.map((prop: any) => {
      const propUnits = units.filter((u: any) => u.property_id === prop.id);
      const totalU = propUnits.length || prop.total_units || 0;
      const occupiedU = propUnits.filter((u: any) => u.status === "occupied").length;
      const avgRent = totalU > 0 ? propUnits.reduce((s: number, u: any) => s + (u.rent_amount || 0), 0) / totalU : 0;
      const annualRevenue = propUnits.reduce((s: number, u: any) => s + ((u.rent_amount || 0) * 12), 0);
      const occupancyRate = totalU > 0 ? (occupiedU / totalU) * 100 : 0;

      return {
        id: prop.id,
        name: prop.name,
        address: prop.address || "",
        propertyType: prop.property_type || "kosan",
        totalUnits: totalU,
        occupiedUnits: occupiedU,
        occupancyRate,
        avgRent,
        totalRevenue: annualRevenue,
        totalExpenses: 0,
        netIncome: annualRevenue,
        roi: 0,
        pricePosition: "at" as const,
        occupancyPosition: "at" as const,
        overallRating: "average" as const,
      };
    });

    // Calculate averages
    const avgRent = propertyData.length > 0 ? propertyData.reduce((s, p) => s + p.avgRent, 0) / propertyData.length : 0;
    const avgOccupancy = propertyData.length > 0 ? propertyData.reduce((s, p) => s + p.occupancyRate, 0) / propertyData.length : 0;

    // Set positions and ratings
    propertyData.forEach(p => {
      p.pricePosition = getPosition(p.avgRent, avgRent);
      p.occupancyPosition = getPosition(p.occupancyRate, avgOccupancy);
      p.overallRating = getOverallRating(p.occupancyRate, p.pricePosition);
    });

    // Portfolio summary
    const totalUnits = propertyData.reduce((s, p) => s + p.totalUnits, 0);
    const totalOccupied = propertyData.reduce((s, p) => s + p.occupiedUnits, 0);
    const totalMonthlyRevenue = propertyData.reduce((s, p) => s + (p.avgRent * p.occupiedUnits), 0);

    const portfolio: PortfolioSummary = {
      totalProperties: propertyData.length,
      totalUnits,
      totalOccupied,
      avgOccupancy,
      totalMonthlyRevenue,
      totalExpenses,
      portfolioROI: totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0,
    };

    // Performance rankings
    const rents = propertyData.map(p => p.avgRent).sort((a, b) => a - b);
    const rankings: PerformanceRanking[] = propertyData.map(p => {
      const rentIdx = rents.indexOf(p.avgRent);
      const avgRentPercentile = rents.length > 1 ? (rentIdx / (rents.length - 1)) * 100 : 50;
      const compositeScore = p.occupancyRate * 0.4 + (p.roi || 0) * 0.3 + avgRentPercentile * 0.3;

      let tier: "top" | "average" | "under" = "average";
      if (compositeScore >= 60) tier = "top";
      else if (compositeScore < 35) tier = "under";

      return {
        propertyId: p.id,
        propertyName: p.name,
        occupancyRate: p.occupancyRate,
        roi: p.roi,
        avgRentPercentile,
        compositeScore,
        tier,
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);

    // Optimization recommendations
    const recommendations: OptimizationRecommendation[] = [];
    propertyData.forEach(p => {
      if (p.occupancyRate < 50) {
        recommendations.push({
          propertyId: p.id, propertyName: p.name,
          type: "price_decrease",
          title: "Occupancy Rendah",
          description: `${p.name} memiliki occupancy ${p.occupancyRate.toFixed(0)}%. Pertimbangkan penurunan harga atau renovasi untuk meningkatkan daya tarik.`,
          priority: "high",
        });
      }
      if (p.avgRent < avgRent * 0.8 && p.occupancyRate < 90) {
        recommendations.push({
          propertyId: p.id, propertyName: p.name,
          type: "price_increase",
          title: "Potensi Kenaikan Harga",
          description: `${p.name} memiliki harga 20%+ di bawah rata-rata. Ada ruang untuk menaikkan harga sewa.`,
          priority: "medium",
        });
      }
      if (p.occupancyRate > 90 && p.avgRent < avgRent) {
        recommendations.push({
          propertyId: p.id, propertyName: p.name,
          type: "high_demand",
          title: "Demand Tinggi — Naikkan Harga",
          description: `${p.name} memiliki occupancy ${p.occupancyRate.toFixed(0)}% dengan harga di bawah rata-rata. Demand tinggi memungkinkan kenaikan harga.`,
          priority: "high",
        });
      }
    });

    return { benchmarks: propertyData, avgRent, avgOccupancy, portfolio, rankings, recommendations };
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('properties/units/payments/maintenance_expenses')
    return {
      benchmarks: [],
      avgRent: 0,
      avgOccupancy: 0,
      portfolio: { totalProperties: 0, totalUnits: 0, totalOccupied: 0, avgOccupancy: 0, totalMonthlyRevenue: 0, totalExpenses: 0, portfolioROI: 0 },
      rankings: [],
      recommendations: [],
    };
  }
}
