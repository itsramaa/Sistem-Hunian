import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 
    | "invoice" 
    | "payment_reminder" 
    | "maintenance_update" 
    | "subscription_upgrade" 
    | "subscription_payment" 
    | "tenant_registration" 
    | "payment_receipt"
    | "payment_received"
    | "late_fee_applied"
    | "disbursement_processing"
    | "disbursement_success"
    | "disbursement_failed"
    | "auto_pay_invoice"
    | "general";
  recipientEmail: string;
  recipientName: string;
  subject?: string;
  data: Record<string, any>;
}

const formatCurrency = (amount: number) => {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

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
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Due:</strong> ${formatCurrency(data.amount)}</p>
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
        subject: `Payment Reminder: ${formatCurrency(data.amount)} due ${data.dueDate}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Reminder</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">This is a friendly reminder that your payment is ${data.isOverdue ? '<strong style="color: #dc2626;">overdue</strong>' : 'coming up soon'}.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Due:</strong> ${formatCurrency(data.amount)}</p>
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

    case "subscription_upgrade":
      return {
        subject: `Subscription Upgraded to ${data.tierName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Subscription Upgraded!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Congratulations! Your subscription has been successfully upgraded.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>New Plan:</strong> ${data.tierName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Paid:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Valid Until:</strong> ${data.validUntil}</p>
              </div>
              
              <h3 style="color: #1f2937;">Your New Features:</h3>
              <ul style="color: #6b7280;">
                <li>Up to ${data.maxProperties} properties</li>
                <li>Up to ${data.maxUnits} units</li>
                <li>Up to ${data.maxTenants} tenants</li>
                ${data.features?.map((f: string) => `<li>${f}</li>`).join('') || ''}
              </ul>
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Dashboard</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Thank you for choosing SiHuni!</p>
            </div>
          </div>
        `,
      };

    case "subscription_payment":
      return {
        subject: `Payment Received - ${formatCurrency(data.amount)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Received</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">We've received your subscription payment. Thank you!</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Plan:</strong> ${data.tierName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Payment Date:</strong> ${data.paymentDate}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> ${data.reference}</p>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is your payment confirmation from SiHuni.</p>
            </div>
          </div>
        `,
      };

    case "tenant_registration":
      return {
        subject: `New Tenant Registered: ${data.tenantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 New Tenant!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Great news! A new tenant has registered using your merchant code.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Tenant Name:</strong> ${data.tenantName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${data.tenantEmail}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${data.tenantPhone || 'Not provided'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Registered At:</strong> ${data.registeredAt}</p>
              </div>
              
              <p style="color: #6b7280;">You can now create a contract for this tenant and assign them to a unit.</p>
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Tenants</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This email was sent by SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Payment Receipt for Tenant
    case "payment_receipt":
      return {
        subject: `Payment Receipt - Invoice #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Payment Successful</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Your payment has been successfully processed. Here's your receipt:</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Paid:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Payment Method:</strong> ${data.paymentMethod || 'Online Payment'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Payment Date:</strong> ${data.paymentDate}</p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Property Information</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Property:</strong> ${data.propertyName || '-'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Unit:</strong> ${data.unitNumber || '-'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Period:</strong> ${data.period || '-'}</p>
              </div>
              
              <a href="${data.invoiceLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Invoice</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Thank you for your payment. This is your official receipt from SiHuni.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Payment Received Notification for Merchant
    case "payment_received":
      return {
        subject: `Payment Received - ${formatCurrency(data.netAmount)} from ${data.tenantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">💰 Payment Received!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Great news! You've received a payment from your tenant.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Tenant:</strong> ${data.tenantName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Property:</strong> ${data.propertyName || '-'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Unit:</strong> ${data.unitNumber || '-'}</p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Amount Breakdown</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Gross Amount:</strong> ${formatCurrency(data.grossAmount)}</p>
                <p style="margin: 5px 0; color: #6b7280;">Platform Fee (1%): -${formatCurrency(data.platformFee)}</p>
                <p style="margin: 5px 0; color: #6b7280;">Payment Gateway Fee (2.5%): -${formatCurrency(data.gatewayFee)}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 10px 0;">
                <p style="margin: 5px 0; color: #10b981; font-size: 18px;"><strong>Net Amount:</strong> ${formatCurrency(data.netAmount)}</p>
              </div>
              
              <p style="color: #6b7280;">This amount has been added to your escrow balance and will be disbursed according to your disbursement schedule.</p>
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Dashboard</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated notification from SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Late Fee Applied Notification
    case "late_fee_applied":
      return {
        subject: `Late Fee Applied - Invoice #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Late Fee Applied</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Your invoice has passed its due date and a late fee has been applied.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Invoice Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Original Amount:</strong> ${formatCurrency(data.originalAmount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Due Date:</strong> ${data.dueDate}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Days Overdue:</strong> ${data.daysOverdue} days</p>
              </div>
              
              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin: 5px 0; color: #374151;"><strong>Late Fee (${data.penaltyRate}%):</strong> <span style="color: #dc2626;">+${formatCurrency(data.lateFee)}</span></p>
                <hr style="border: none; border-top: 1px solid #fecaca; margin: 10px 0;">
                <p style="margin: 5px 0; color: #dc2626; font-size: 18px;"><strong>New Total:</strong> ${formatCurrency(data.totalAmount)}</p>
              </div>
              
              <p style="color: #6b7280;">Please pay the total amount as soon as possible to avoid further penalties.</p>
              
              <a href="${data.paymentLink || '#'}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you have any questions, please contact your property manager.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Disbursement Processing
    case "disbursement_processing":
      return {
        subject: `Disbursement Processing - ${formatCurrency(data.amount)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔄 Disbursement Processing</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Your disbursement is now being processed.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Disbursement Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Bank:</strong> ${data.bankName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Account:</strong> ****${data.accountNumber?.slice(-4) || '****'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> ${data.reference}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Expected Date:</strong> ${data.expectedDate || '1-2 business days'}</p>
              </div>
              
              <p style="color: #6b7280;">You'll receive a confirmation email once the transfer is complete.</p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated notification from SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Disbursement Success
    case "disbursement_success":
      return {
        subject: `Disbursement Complete - ${formatCurrency(data.amount)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Disbursement Complete!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Great news! Your disbursement has been successfully transferred.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Transfer Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Transferred:</strong> <span style="color: #10b981; font-size: 18px;">${formatCurrency(data.amount)}</span></p>
                <p style="margin: 5px 0; color: #374151;"><strong>Bank:</strong> ${data.bankName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Account:</strong> ${data.accountName} (****${data.accountNumber?.slice(-4) || '****'})</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> ${data.reference}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Completed At:</strong> ${data.completedAt}</p>
              </div>
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Transactions</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Thank you for using SiHuni Property Management.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Disbursement Failed
    case "disbursement_failed":
      return {
        subject: `Disbursement Failed - Action Required`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Disbursement Failed</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Unfortunately, your disbursement could not be processed.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Disbursement Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Bank:</strong> ${data.bankName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> ${data.reference}</p>
              </div>
              
              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin: 0; color: #dc2626;"><strong>Reason:</strong> ${data.failureReason || 'Unknown error'}</p>
              </div>
              
              <p style="color: #6b7280;"><strong>What to do:</strong></p>
              <ul style="color: #6b7280;">
                <li>Verify your bank account details are correct</li>
                <li>Ensure your account is active and can receive transfers</li>
                <li>Contact our support if the issue persists</li>
              </ul>
              
              <a href="${data.settingsLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Update Bank Details</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Your funds remain in your escrow account and will be retried in the next disbursement cycle.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Auto-Pay Invoice Created
    case "auto_pay_invoice":
      return {
        subject: `Auto-Pay Invoice Created - #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔄 Auto-Pay Invoice</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">As part of your Auto-Pay subscription, we've created an invoice for your rent payment.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Invoice Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Property:</strong> ${data.propertyName || '-'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Unit:</strong> ${data.unitNumber || '-'}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Due Date:</strong> ${data.dueDate}</p>
              </div>
              
              <p style="color: #6b7280;">Please complete the payment using the link below:</p>
              
              <a href="${data.paymentLink}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">You're receiving this because you have Auto-Pay enabled. To disable, update your profile settings.</p>
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
