import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log(`Generating PDF for invoice: ${invoiceId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        contract:contracts(
          unit:units(
            unit_number,
            property:properties(
              name,
              address,
              city
            )
          )
        ),
        merchant:merchants(
          business_name,
          address,
          city,
          province,
          postal_code
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    // Get tenant profile
    const { data: tenantProfile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", invoice.tenant_user_id)
      .single();

    const contract = invoice.contract as { 
      unit: { 
        unit_number: string; 
        property: { name: string; address: string; city: string } 
      } 
    };
    const merchant = invoice.merchant as { 
      business_name: string; 
      address: string | null; 
      city: string | null; 
      province: string | null;
      postal_code: string | null;
    };

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', Arial, sans-serif; color: #1f2937; line-height: 1.5; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 24px; color: #374151; }
    .invoice-number { color: #6b7280; margin-top: 5px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .details-section { width: 45%; }
    .details-section h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
    .details-section p { margin-bottom: 5px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .table .amount { text-align: right; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .totals-row.total { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #1f2937; padding-top: 15px; margin-top: 10px; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.sent { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">SiHuni</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="invoice-number">${invoice.invoice_number}</p>
        <span class="status ${invoice.status}">${invoice.status.toUpperCase()}</span>
      </div>
    </div>
    
    <div class="details">
      <div class="details-section">
        <h3>From</h3>
        <p><strong>${merchant?.business_name || "Property Manager"}</strong></p>
        ${merchant?.address ? `<p>${merchant.address}</p>` : ""}
        ${merchant?.city ? `<p>${merchant.city}${merchant?.province ? `, ${merchant.province}` : ""}${merchant?.postal_code ? ` ${merchant.postal_code}` : ""}</p>` : ""}
      </div>
      <div class="details-section">
        <h3>Bill To</h3>
        <p><strong>${tenantProfile?.full_name || "Tenant"}</strong></p>
        <p>${tenantProfile?.email || ""}</p>
        ${tenantProfile?.phone ? `<p>${tenantProfile.phone}</p>` : ""}
        <p>${contract?.unit?.property?.name || ""} - Unit ${contract?.unit?.unit_number || ""}</p>
        <p>${contract?.unit?.property?.address || ""}, ${contract?.unit?.property?.city || ""}</p>
      </div>
    </div>
    
    <div class="details">
      <div class="details-section">
        <h3>Invoice Date</h3>
        <p>${invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : new Date(invoice.created_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div class="details-section">
        <h3>Due Date</h3>
        <p>${new Date(invoice.due_date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.description || "Monthly Rent"}</td>
          <td class="amount">R ${Number(invoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>R ${Number(invoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
      </div>
      ${invoice.tax_amount ? `
      <div class="totals-row">
        <span>Tax</span>
        <span>R ${Number(invoice.tax_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
      </div>
      ` : ""}
      <div class="totals-row total">
        <span>Total</span>
        <span>R ${Number(invoice.total_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>For questions about this invoice, please contact your property manager.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML that can be rendered as PDF on client side
    return new Response(
      JSON.stringify({
        success: true,
        html: html,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          status: invoice.status,
          due_date: invoice.due_date,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    console.error("Error generating invoice PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
