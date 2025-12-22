import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "invoice" | "payment_reminder" | "maintenance_update" | "general";
  recipientEmail: string;
  recipientName: string;
  subject?: string;
  data: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any>, recipientName: string) => {
  switch (type) {
    case "invoice":
      return {
        subject: `New Invoice #${data.invoiceNumber} from ${data.merchantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">SiHuni</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 5px;">Property Management</p>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">New Invoice</h2>
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">You have a new invoice from <strong>${data.merchantName}</strong>.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Due:</strong> R ${Number(data.amount).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Due Date:</strong> ${data.dueDate}</p>
                ${data.description ? `<p style="margin: 5px 0; color: #374151;"><strong>Description:</strong> ${data.description}</p>` : ''}
              </div>
              
              <a href="${data.paymentLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This email was sent by SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };

    case "payment_reminder":
      return {
        subject: `Payment Reminder: R ${Number(data.amount).toLocaleString()} due ${data.dueDate}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Reminder</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">This is a friendly reminder that your payment is ${data.isOverdue ? '<strong style="color: #dc2626;">overdue</strong>' : 'coming up soon'}.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Due:</strong> R ${Number(data.amount).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Due Date:</strong> ${data.dueDate}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Property:</strong> ${data.propertyName}</p>
              </div>
              
              <a href="${data.paymentLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you have already made this payment, please disregard this email.</p>
            </div>
          </div>
        `,
      };

    case "maintenance_update":
      return {
        subject: `Maintenance Update: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Maintenance Update</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">There's an update on your maintenance request.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Request:</strong> ${data.title}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="background: ${data.status === 'completed' ? '#10b981' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.status}</span></p>
                ${data.notes ? `<p style="margin: 10px 0; color: #374151;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated notification from SiHuni.</p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: data.subject || "Notification from SiHuni",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">SiHuni</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">${data.message}</p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This email was sent by SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, data }: NotificationRequest = await req.json();
    
    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const template = getEmailTemplate(type, data, recipientName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SiHuni <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
