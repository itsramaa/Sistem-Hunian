import { supabase } from "@/lib/integrations/supabase/client";

interface SendNotificationParams {
  type: "invoice" | "payment_reminder" | "maintenance_update" | "general";
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: params,
  });

  if (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }

  return data;
}

export async function sendInvoiceNotification(
  recipientEmail: string,
  recipientName: string,
  invoiceData: {
    invoiceNumber: string;
    merchantName: string;
    amount: number;
    dueDate: string;
    description?: string;
    paymentLink?: string;
  }
) {
  return sendNotification({
    type: "invoice",
    recipientEmail,
    recipientName,
    data: invoiceData,
  });
}

export async function sendPaymentReminder(
  recipientEmail: string,
  recipientName: string,
  paymentData: {
    amount: number;
    dueDate: string;
    propertyName: string;
    isOverdue: boolean;
    paymentLink?: string;
  }
) {
  return sendNotification({
    type: "payment_reminder",
    recipientEmail,
    recipientName,
    data: paymentData,
  });
}

export async function sendMaintenanceUpdate(
  recipientEmail: string,
  recipientName: string,
  maintenanceData: {
    title: string;
    status: string;
    notes?: string;
  }
) {
  return sendNotification({
    type: "maintenance_update",
    recipientEmail,
    recipientName,
    data: maintenanceData,
  });
}
