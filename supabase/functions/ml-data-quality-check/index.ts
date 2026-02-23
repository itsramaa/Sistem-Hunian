import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_LIMITS: Record<string, number> = { free: 1, starter: 5, professional: -1, enterprise: -1 };

interface ValidationResult {
  entity_type: string;
  entity_id: string;
  rule: string;
  status: "pass" | "warning" | "error";
  message: string;
  suggestion?: string;
  severity: "low" | "medium" | "high" | "critical";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { property_id, include_suggestions = true } = await req.json();
    if (!property_id) throw new Error("property_id is required");

    // Get merchant
    const { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).single();
    if (!merchant) throw new Error("Merchant not found");

    // Check tier limits
    const { data: sub } = await supabase
      .from("merchant_subscriptions")
      .select("tier_id, subscription_tiers(name)")
      .eq("merchant_id", merchant.id)
      .eq("status", "active")
      .single();
    const tierName = (sub?.subscription_tiers as any)?.name || "free";
    const limit = TIER_LIMITS[tierName] ?? 1;

    if (limit !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("data_quality_checks")
        .select("id", { count: "exact", head: true })
        .eq("merchant_id", merchant.id)
        .gte("created_at", startOfMonth.toISOString());
      if ((count || 0) >= limit) {
        return new Response(JSON.stringify({ success: false, error: `Batas validasi bulan ini tercapai (${limit}x). Upgrade paket untuk lebih banyak.` }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch property + units
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .eq("merchant_id", merchant.id)
      .single();
    if (propErr || !property) throw new Error("Property not found or not owned by merchant");

    const { data: units } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", property_id)
      .order("unit_number");

    const allUnits = units || [];
    const validations: ValidationResult[] = [];

    // === DETERMINISTIC VALIDATIONS ===

    // 1. Property completeness
    const requiredFields = ["address", "city", "province"];
    for (const field of requiredFields) {
      if (!property[field] || String(property[field]).trim() === "") {
        validations.push({
          entity_type: "property", entity_id: property_id, rule: "completeness",
          status: "error", message: `Field '${field}' belum diisi pada properti`,
          severity: "high", suggestion: `Lengkapi field '${field}' pada data properti`,
        });
      }
    }

    // 2. Logical consistency: occupied_units <= total_units
    if (property.occupied_units > property.total_units) {
      validations.push({
        entity_type: "property", entity_id: property_id, rule: "logical_consistency",
        status: "error", message: `Unit terisi (${property.occupied_units}) melebihi total unit (${property.total_units})`,
        severity: "critical", suggestion: "Perbarui jumlah unit terisi agar tidak melebihi total unit",
      });
    }

    // 3. Unit validations
    const unitNumbers = new Map<string, string[]>();
    for (const unit of allUnits) {
      // Range: rent_amount > 0
      if (!unit.rent_amount || unit.rent_amount <= 0) {
        validations.push({
          entity_type: "unit", entity_id: unit.id, rule: "range_validation",
          status: "error", message: `Unit ${unit.unit_number}: Harga sewa harus lebih dari 0`,
          severity: "high", suggestion: "Isi harga sewa yang valid",
        });
      }

      // Range: size_sqm reasonable
      if (unit.size_sqm !== null && unit.size_sqm !== undefined) {
        if (unit.size_sqm <= 0 || unit.size_sqm > 500) {
          validations.push({
            entity_type: "unit", entity_id: unit.id, rule: "range_validation",
            status: "warning", message: `Unit ${unit.unit_number}: Luas ${unit.size_sqm} m² tidak wajar`,
            severity: "medium", suggestion: "Periksa kembali luas unit (umumnya 5-100 m²)",
          });
        }
      }

      // Logical: floor <= floor_count
      if (unit.floor && property.floor_count && unit.floor > property.floor_count) {
        validations.push({
          entity_type: "unit", entity_id: unit.id, rule: "logical_consistency",
          status: "error", message: `Unit ${unit.unit_number}: Lantai ${unit.floor} melebihi jumlah lantai properti (${property.floor_count})`,
          severity: "high", suggestion: `Perbaiki lantai unit agar tidak melebihi ${property.floor_count}`,
        });
      }

      // Duplicate check
      const num = unit.unit_number?.toLowerCase() || "";
      if (!unitNumbers.has(num)) unitNumbers.set(num, []);
      unitNumbers.get(num)!.push(unit.id);
    }

    // Flag duplicates
    for (const [num, ids] of unitNumbers) {
      if (ids.length > 1) {
        for (const id of ids) {
          validations.push({
            entity_type: "unit", entity_id: id, rule: "duplicate_check",
            status: "error", message: `Nomor unit '${num}' duplikat (${ids.length} unit)`,
            severity: "high", suggestion: "Ubah nomor unit agar unik dalam properti ini",
          });
        }
      }
    }

    // === SCORING ===
    const totalChecks = requiredFields.length + 1 + allUnits.length * 4; // rough count
    const errorCount = validations.filter(v => v.status === "error").length;
    const warningCount = validations.filter(v => v.status === "warning").length;
    const propertyScore = Math.max(0, Math.round(100 - (errorCount * 15) - (warningCount * 5)));
    const unitScores = allUnits.map(u => {
      const unitErrors = validations.filter(v => v.entity_id === u.id && v.status === "error").length;
      const unitWarnings = validations.filter(v => v.entity_id === u.id && v.status === "warning").length;
      return { unit_id: u.id, score: Math.max(0, Math.round(100 - (unitErrors * 20) - (unitWarnings * 8))) };
    });
    const aggregateScore = unitScores.length > 0
      ? Math.round((propertyScore + unitScores.reduce((s, u) => s + u.score, 0)) / (1 + unitScores.length))
      : propertyScore;

    // === AI OUTLIER DETECTION ===
    let outliers: any[] = [];
    let summary = "";

    if (include_suggestions && allUnits.length > 0) {
      try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          const rentAmounts = allUnits.filter(u => u.rent_amount > 0).map(u => ({ id: u.id, number: u.unit_number, rent: u.rent_amount, size: u.size_sqm }));

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a property data quality analyst. Analyze rental data for outliers and provide suggestions in Indonesian. Return JSON only." },
                { role: "user", content: `Analisis data unit berikut untuk properti "${property.name}" di ${property.city}, ${property.province}. Identifikasi outlier harga sewa dan berikan saran perbaikan.\n\nData unit:\n${JSON.stringify(rentAmounts)}\n\nValidasi error yang ditemukan:\n${JSON.stringify(validations.map(v => ({ rule: v.rule, message: v.message, entity_id: v.entity_id })))}\n\nReturn JSON format:\n{"outliers": [{"entity_id": "uuid", "field": "rent_amount", "value": number, "expected_range": "string", "anomaly_type": "too_high|too_low"}], "summary": "string ringkasan kualitas data keseluruhan dalam 2-3 kalimat"}` },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "analyze_data_quality",
                  description: "Return outlier analysis and summary",
                  parameters: {
                    type: "object",
                    properties: {
                      outliers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            entity_id: { type: "string" },
                            field: { type: "string" },
                            value: { type: "number" },
                            expected_range: { type: "string" },
                            anomaly_type: { type: "string", enum: ["too_high", "too_low"] },
                          },
                          required: ["entity_id", "field", "value", "expected_range", "anomaly_type"],
                        },
                      },
                      summary: { type: "string" },
                    },
                    required: ["outliers", "summary"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "analyze_data_quality" } },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              const parsed = JSON.parse(toolCall.function.arguments);
              outliers = parsed.outliers || [];
              summary = parsed.summary || "";

              // Add outlier validations
              for (const o of outliers) {
                validations.push({
                  entity_type: "unit", entity_id: o.entity_id, rule: "outlier_detection",
                  status: "warning", message: `Harga ${o.field} (${o.value}) ${o.anomaly_type === 'too_high' ? 'terlalu tinggi' : 'terlalu rendah'}. Range wajar: ${o.expected_range}`,
                  severity: "medium", suggestion: `Periksa kembali ${o.field} unit ini`,
                });
              }
            }
          }
        }
      } catch (aiErr) {
        console.error("AI analysis error:", aiErr);
        summary = "Analisis AI tidak tersedia. Validasi deterministik berhasil dijalankan.";
      }
    }

    if (!summary) {
      summary = errorCount === 0
        ? `Data properti "${property.name}" dalam kondisi baik. Skor kualitas: ${aggregateScore}/100.`
        : `Ditemukan ${errorCount} error dan ${warningCount} warning pada properti "${property.name}". Skor kualitas: ${aggregateScore}/100.`;
    }

    // Save to data_quality_checks
    await supabase.from("data_quality_checks").insert({
      merchant_id: merchant.id,
      entity_type: "property",
      entity_id: property_id,
      quality_score: aggregateScore,
      validation_results: validations,
      overrides: [],
    });

    return new Response(JSON.stringify({
      success: true,
      property_score: propertyScore,
      unit_scores: unitScores,
      aggregate_score: aggregateScore,
      validations,
      outliers,
      summary,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("ml-data-quality-check error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
