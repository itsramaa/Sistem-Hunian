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
    | "subscription_invoice"
    | "subscription_suspended"
    | "subscription_cancelled"
    | "subscription_renewal_reminder"
    | "tenant_registration" 
    | "payment_receipt"
    | "payment_received"
    | "late_fee_applied"
    | "disbursement_processing"
    | "disbursement_success"
    | "disbursement_failed"
    | "auto_pay_invoice"
    | "verification_approved"
    | "verification_rejected"
    | "payment_plan_offered"
    | "payment_plan_accepted"
    | "payment_plan_defaulted"
    | "move_out_notice_received"
    | "move_out_notice_confirmed"
    | "inspection_scheduled"
    | "inspection_completed"
    | "deposit_refunded"
    | "early_termination_approved"
    | "early_termination_denied"
    | "vacancy_alert"
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

    // NEW TEMPLATE: Subscription Invoice (Monthly/Yearly Renewal)
    case "subscription_invoice":
      return {
        subject: `Subscription Invoice - ${formatCurrency(data.amount)} Due`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">📋 Subscription Invoice</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Your ${data.tierName} subscription renewal is due.</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Invoice Details</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Plan:</strong> ${data.tierName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Billing Period:</strong> ${data.billingPeriod}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> <span style="color: #0891b2; font-size: 18px;">${formatCurrency(data.amount)}</span></p>
                <p style="margin: 5px 0; color: #374151;"><strong>Due Date:</strong> ${data.dueDate}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Invoice ID:</strong> ${data.invoiceId}</p>
              </div>
              
              <p style="color: #6b7280;">Please complete your payment before the due date to avoid service interruption.</p>
              
              <a href="${data.paymentUrl || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If payment is not received within 7 days after the due date, your subscription will be suspended.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Subscription Suspended (Grace Period Warning)
    case "subscription_suspended":
      return {
        subject: `⚠️ Subscription Suspended - Action Required`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Subscription Suspended</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Your ${data.tierName} subscription has been <strong style="color: #d97706;">suspended</strong> due to overdue payment.</p>
              
              <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fcd34d;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">⏰ Grace Period</h3>
                <p style="margin: 5px 0; color: #92400e;"><strong>You have ${data.gracePeriodDays} days to pay</strong></p>
                <p style="margin: 5px 0; color: #92400e;">Deadline: ${data.gracePeriodEnd}</p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Amount Due:</strong> ${formatCurrency(data.amount)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Plan:</strong> ${data.tierName}</p>
              </div>
              
              <p style="color: #dc2626;"><strong>What happens if you don't pay:</strong></p>
              <ul style="color: #6b7280;">
                <li>Your subscription will be cancelled</li>
                <li>You'll be downgraded to the Free plan</li>
                <li>Access to premium features will be restricted</li>
              </ul>
              
              <a href="${data.paymentUrl || '#'}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now to Reactivate</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you have any questions, please contact our support team.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Subscription Cancelled
    case "subscription_cancelled":
      return {
        subject: `Subscription Cancelled - ${data.tierName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Subscription Cancelled</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Unfortunately, your ${data.tierName} subscription has been cancelled.</p>
              
              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin: 0; color: #dc2626;"><strong>Reason:</strong> ${data.reason}</p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">What's changed:</h3>
                <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                  <li>You've been downgraded to the Free plan</li>
                  <li>Property, unit, and tenant limits now apply</li>
                  <li>Premium features are no longer available</li>
                </ul>
              </div>
              
              <p style="color: #6b7280;">Want to reactivate? You can upgrade again anytime.</p>
              
              <a href="${data.reactivateUrl || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Reactivate Subscription</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">We're sorry to see you go. If you have any feedback, please let us know.</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Subscription Renewal Reminder (Pre-billing + Grace Period)
    case "subscription_renewal_reminder":
      return {
        subject: data.isGracePeriod 
          ? `⚠️ Payment Overdue - ${data.daysRemaining} Days Left` 
          : `Subscription Renewal Reminder - ${data.daysRemaining} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${data.isGracePeriod ? '#dc2626 0%, #b91c1c' : '#f59e0b 0%, #d97706'} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">${data.isGracePeriod ? '⚠️ Payment Overdue' : '⏰ Renewal Reminder'}</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">
                ${data.isGracePeriod 
                  ? `Your subscription payment is overdue. You have <strong style="color: #dc2626;">${data.daysRemaining} days left</strong> to pay before your subscription is cancelled.`
                  : `Your ${data.tierName} subscription will renew in <strong>${data.daysRemaining} days</strong>.`
                }
              </p>
              
              <div style="background: ${data.isGracePeriod ? '#fef2f2' : '#fef3c7'}; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid ${data.isGracePeriod ? '#fecaca' : '#fcd34d'};">
                <p style="margin: 5px 0; color: ${data.isGracePeriod ? '#dc2626' : '#92400e'}; font-size: 24px; text-align: center;"><strong>${data.daysRemaining}</strong></p>
                <p style="margin: 0; color: ${data.isGracePeriod ? '#dc2626' : '#92400e'}; text-align: center;">${data.isGracePeriod ? 'days until cancellation' : 'days until renewal'}</p>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #374151;"><strong>Plan:</strong> ${data.tierName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${formatCurrency(data.amount)}</p>
              </div>
              
              <a href="${data.paymentUrl || '#'}" style="display: inline-block; background: ${data.isGracePeriod ? '#dc2626' : '#0891b2'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Pay Now</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">${data.isGracePeriod ? 'Please pay immediately to avoid losing access to your subscription features.' : 'Make sure your payment method is up to date.'}</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Merchant Verification Approved
    case "verification_approved":
      return {
        subject: `✅ Selamat! Akun Bisnis ${data.businessName} Terverifikasi`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Akun Terverifikasi!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Selamat ${recipientName},</p>
              <p style="color: #6b7280;">Akun bisnis <strong>${data.businessName}</strong> telah berhasil diverifikasi oleh tim SiHuni.</p>
              
              <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #a7f3d0;">
                <p style="margin: 0; color: #065f46; font-size: 18px; text-align: center;">✓ Verifikasi Berhasil</p>
              </div>
              
              <p style="color: #6b7280;">Semua fitur platform kini telah dibuka untuk Anda:</p>
              <ul style="color: #6b7280; margin: 15px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Kelola properti dan unit tanpa batas</li>
                <li style="margin: 8px 0;">Tambahkan tenant dan buat kontrak</li>
                <li style="margin: 8px 0;">Buat invoice dan terima pembayaran online</li>
                <li style="margin: 8px 0;">Akses dashboard analitik lengkap</li>
                <li style="margin: 8px 0;">Pencairan dana otomatis ke rekening bank</li>
              </ul>
              
              ${data.approvalNotes ? `
              <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151;"><strong>Catatan dari Admin:</strong></p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">${data.approvalNotes}</p>
              </div>
              ` : ''}
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Masuk ke Dashboard</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Terima kasih telah mempercayakan pengelolaan properti Anda kepada SiHuni!</p>
            </div>
          </div>
        `,
      };

    // NEW TEMPLATE: Merchant Verification Rejected
    case "verification_rejected":
      return {
        subject: `⚠️ Tindakan Diperlukan - Verifikasi ${data.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Verifikasi Ditolak</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #6b7280;">Hi ${recipientName},</p>
              <p style="color: #6b7280;">Mohon maaf, pengajuan verifikasi untuk <strong>${data.businessName}</strong> belum dapat disetujui.</p>
              
              <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fcd34d;">
                <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Alasan Penolakan:</strong></p>
                <p style="margin: 0; color: #78350f; font-size: 16px;">${data.rejectionReason || 'Dokumen tidak memenuhi persyaratan'}</p>
              </div>
              
              ${data.rejectionDetails ? `
              <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151;"><strong>Detail:</strong></p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">${data.rejectionDetails}</p>
              </div>
              ` : ''}
              
              <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bfdbfe;">
                <p style="margin: 0 0 10px 0; color: #1e40af;"><strong>Langkah Selanjutnya:</strong></p>
                <p style="margin: 0; color: #1e3a8a;">${data.resubmissionInstructions || 'Silakan perbaiki dokumen yang diminta dan ajukan kembali verifikasi melalui dashboard.'}</p>
              </div>
              
              <a href="${data.dashboardLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Perbaiki & Ajukan Kembali</a>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Jika Anda memiliki pertanyaan, silakan hubungi tim support kami.</p>
            </div>
          </div>
        `,
      };

    // Payment Plan Offered
    case "payment_plan_offered":
      return {
        subject: `📋 Penawaran Cicilan - Invoice #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">📋 Penawaran Cicilan</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Merchant Anda menawarkan rencana cicilan untuk invoice yang tertunggak.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p><strong>Total Tagihan:</strong> ${formatCurrency(data.totalAmount)}</p>
                <p><strong>Jumlah Cicilan:</strong> ${data.installmentCount}x @ ${formatCurrency(data.installmentAmount)}</p>
                <p><strong>Frekuensi:</strong> ${data.frequency}</p>
                ${data.lateFeeWaived ? `<p style="color: #10b981;">✓ Denda ${formatCurrency(data.waivedAmount)} dihapuskan!</p>` : ''}
              </div>
              <a href="${data.invoiceLink || '#'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Lihat Penawaran</a>
            </div>
          </div>
        `,
      };

    // Payment Plan Accepted
    case "payment_plan_accepted":
      return {
        subject: `✅ Cicilan Diterima - Invoice #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Cicilan Diterima</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Penyewa telah menerima rencana cicilan untuk invoice ${data.invoiceNumber}.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Total:</strong> ${formatCurrency(data.totalAmount)}</p>
                <p><strong>Cicilan:</strong> ${data.installmentCount}x @ ${formatCurrency(data.installmentAmount)}</p>
              </div>
            </div>
          </div>
        `,
      };

    // Payment Plan Defaulted
    case "payment_plan_defaulted":
      return {
        subject: `❌ Cicilan Gagal - Invoice #${data.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Rencana Cicilan Gagal</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Rencana cicilan untuk invoice ${data.invoiceNumber} telah dibatalkan karena cicilan tidak dibayar tepat waktu.</p>
              <p style="color: #dc2626;">Tagihan penuh kembali berlaku.</p>
              <a href="${data.invoiceLink || '#'}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Lihat Invoice</a>
            </div>
          </div>
        `,
      };

    // Move-Out Notice Received (for merchant)
    case "move_out_notice_received":
      return {
        subject: `📦 Move-Out Notice Received - Unit ${data.unitNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">📦 Move-Out Notice</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>A tenant has submitted a move-out notice.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Tenant:</strong> ${data.tenantName}</p>
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Move-out date:</strong> ${data.moveOutDate}</p>
                <p><strong>Notice given:</strong> ${data.daysNotice} days in advance ${data.daysNotice >= 30 ? '✓' : '⚠️'}</p>
                ${data.isEarlyTermination ? `<p style="color: #dc2626;"><strong>Early Termination:</strong> Yes - Penalty: ${formatCurrency(data.penaltyAmount)}</p>` : ''}
                ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              </div>
              <p><strong>Actions needed:</strong></p>
              <ul>
                <li>Schedule final inspection</li>
                <li>Process security deposit</li>
                <li>Prepare unit for re-listing</li>
              </ul>
              <a href="${data.dashboardLink || '/merchant/move-outs'}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Move-Out Details</a>
            </div>
          </div>
        `,
      };

    // Move-Out Notice Confirmed (for tenant)
    case "move_out_notice_confirmed":
      return {
        subject: `✅ Move-Out Notice Confirmed - ${data.propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Notice Confirmed</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Your move-out notice has been received and confirmed.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Move-out date:</strong> ${data.moveOutDate}</p>
                <p><strong>Inspection (tentative):</strong> ${data.inspectionDate}</p>
                <p><strong>Deposit return:</strong> Within 30 days of move-out</p>
              </div>
              <p><strong>📋 Your Move-Out Checklist:</strong></p>
              <ul>
                <li>Schedule final inspection</li>
                <li>Deep clean the unit</li>
                <li>Repair any damages</li>
                <li>Return all keys</li>
                <li>Take final utility readings</li>
              </ul>
              <a href="/tenant/contracts" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Checklist</a>
            </div>
          </div>
        `,
      };

    // Inspection Scheduled
    case "inspection_scheduled":
      return {
        subject: `🔍 Move-Out Inspection Scheduled - ${data.propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔍 Inspection Scheduled</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Your move-out inspection has been scheduled.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Date:</strong> ${data.inspectionDate}</p>
                <p><strong>Time:</strong> ${data.inspectionTime}</p>
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Inspector:</strong> ${data.inspectorName}</p>
              </div>
              <p><strong>What to prepare:</strong></p>
              <ul>
                <li>Clean unit thoroughly</li>
                <li>Repair any damages</li>
                <li>Be present (recommended)</li>
                <li>Have keys ready to return</li>
              </ul>
            </div>
          </div>
        `,
      };

    // Inspection Completed
    case "inspection_completed":
      return {
        subject: `📋 Inspection Report - ${data.propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">📋 Inspection Complete</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>The move-out inspection has been completed.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Overall condition:</strong> ${data.condition}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p><strong>Original deposit:</strong> ${formatCurrency(data.originalDeposit)}</p>
                <p><strong>Deductions:</strong> ${formatCurrency(data.deductions)}</p>
                <p style="font-size: 18px; color: #10b981;"><strong>Refund amount:</strong> ${formatCurrency(data.refundAmount)}</p>
              </div>
              <p>Your deposit refund will be processed within 30 days.</p>
              <a href="/tenant/contracts" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Report</a>
            </div>
          </div>
        `,
      };

    // Deposit Refunded
    case "deposit_refunded":
      return {
        subject: `💰 Security Deposit Refunded - ${formatCurrency(data.refundAmount)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">💰 Deposit Refunded!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Your security deposit has been refunded!</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Amount:</strong> <span style="font-size: 24px; color: #10b981;">${formatCurrency(data.refundAmount)}</span></p>
                <p><strong>Bank:</strong> ${data.bankName} xxx-${data.accountNumber}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p><strong>Breakdown:</strong></p>
                <p>Original deposit: ${formatCurrency(data.originalDeposit)}</p>
                <p>Deductions: ${formatCurrency(data.deductions)}</p>
                <p>Refunded: ${formatCurrency(data.refundAmount)}</p>
              </div>
              <p>Thank you for being a great tenant!</p>
            </div>
          </div>
        `,
      };

    // Early Termination Approved
    case "early_termination_approved":
      return {
        subject: `✅ Early Termination Approved - ${data.propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Early Termination Approved</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Your early termination request has been approved.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Move-out date:</strong> ${data.moveOutDate}</p>
                <p><strong>Penalty amount:</strong> ${formatCurrency(data.penaltyAmount)}</p>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
              </div>
              <p>The penalty will be ${data.deductFromDeposit ? 'deducted from your deposit' : 'invoiced separately'}.</p>
            </div>
          </div>
        `,
      };

    // Early Termination Denied
    case "early_termination_denied":
      return {
        subject: `❌ Early Termination Denied - ${data.propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Request Denied</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Unfortunately, your early termination request has been denied.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Property:</strong> ${data.propertyName} - Unit ${data.unitNumber}</p>
                <p><strong>Reason:</strong> ${data.reason}</p>
              </div>
              <p>Your current contract remains valid until ${data.contractEndDate}.</p>
            </div>
          </div>
        `,
      };

    // Vacancy Alert
    case "vacancy_alert":
      return {
        subject: `⚠️ Vacancy Alert: Unit ${data.unitNumber} - ${data.daysVacant} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${data.daysVacant >= 60 ? '#dc2626, #b91c1c' : '#f59e0b, #d97706'}); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ ${data.daysVacant >= 60 ? 'Critical' : ''} Vacancy Alert</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Hi ${recipientName},</p>
              <p>Unit ${data.unitNumber} at ${data.propertyName} has been vacant for <strong>${data.daysVacant} days</strong>.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p><strong>Monthly rent:</strong> ${formatCurrency(data.monthlyRent)}</p>
                <p style="color: #dc2626;"><strong>Estimated lost revenue:</strong> ${formatCurrency(data.lostRevenue)}</p>
              </div>
              <p><strong>Suggested actions:</strong></p>
              <ul>
                ${data.suggestions?.map((s: string) => `<li>${s}</li>`).join('') || ''}
              </ul>
              <a href="/merchant/move-outs" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Vacancy Dashboard</a>
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
