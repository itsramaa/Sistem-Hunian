import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock Whatsmeow API integration
// In production, replace with actual Whatsmeow/WhatsApp Business API integration
interface WhatsAppMessage {
  to: string;
  type: "payment_reminder" | "order_update" | "maintenance_update" | "contract_notification";
  data: Record<string, unknown>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Simulated Whatsmeow API client
async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  console.log("📱 Sending WhatsApp notification via Whatsmeow API (Mock)");
  console.log("To:", message.to);
  console.log("Type:", message.type);
  console.log("Data:", JSON.stringify(message.data, null, 2));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock successful response
  const mockMessageId = `wamid.${crypto.randomUUID().replace(/-/g, "")}`;
  
  // In production, this would call the actual Whatsmeow API:
  // const response = await fetch('https://your-whatsmeow-server.com/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('WHATSMEOW_API_KEY')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     phone: message.to,
  //     message: formatMessage(message.type, message.data),
  //   }),
  // });

  return {
    success: true,
    messageId: mockMessageId,
  };
}

function formatMessage(type: WhatsAppMessage["type"], data: Record<string, unknown>): string {
  switch (type) {
    case "payment_reminder":
      return `🔔 *Payment Reminder*\n\nHello ${data.tenantName},\n\nYour ${data.paymentType} payment of *${data.amount}* is due on ${data.dueDate}.\n\nPlease make the payment before the due date to avoid late fees.\n\nThank you,\n${data.merchantName}`;

    case "order_update":
      return `📦 *Order Update*\n\nHello ${data.customerName},\n\nYour order *${data.orderNumber}* status has been updated to: *${data.status}*\n\n${data.message || ""}\n\nVendor: ${data.vendorName}`;

    case "maintenance_update":
      return `🔧 *Maintenance Update*\n\nHello ${data.tenantName},\n\nYour maintenance request "${data.title}" has been updated.\n\nStatus: *${data.status}*\n${data.message ? `\nUpdate: ${data.message}` : ""}\n\nThank you for your patience.`;

    case "contract_notification":
      return `📝 *Contract Notification*\n\nHello ${data.tenantName},\n\n${data.message}\n\nUnit: ${data.unitNumber}\nProperty: ${data.propertyName}`;

    default:
      return String(data.message || "You have a new notification from SiHuni.");
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, to, data } = await req.json();

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number format (Indonesian format)
    const phoneNumber = to.replace(/\D/g, "");
    const formattedPhone = phoneNumber.startsWith("62") 
      ? phoneNumber 
      : phoneNumber.startsWith("0") 
        ? `62${phoneNumber.slice(1)}` 
        : `62${phoneNumber}`;

    console.log(`Sending ${type} notification to ${formattedPhone}`);

    // Send WhatsApp message
    const result = await sendWhatsAppMessage({
      to: formattedPhone,
      type,
      data: data || {},
    });

    if (!result.success) {
      console.error("WhatsApp send failed:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification (optional: store in database)
    console.log("WhatsApp notification sent successfully:", result.messageId);

    // Store notification in database for tracking
    const { error: dbError } = await supabase
      .from("notifications")
      .insert({
        user_id: data.userId || null,
        title: `WhatsApp: ${type.replace(/_/g, " ")}`,
        message: formatMessage(type, data),
        type: "whatsapp",
        link: null,
      });

    if (dbError) {
      console.warn("Failed to log notification to database:", dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        message: "WhatsApp notification sent (mock)" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});