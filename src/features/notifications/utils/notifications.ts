import { apiClient } from "@/lib/axios";

interface SendNotificationParams {
  type: "invoice" | "payment_reminder" | "maintenance_update" | "general";
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const response = await apiClient.post('/notifications', params);
    return response.data;
  } catch (error: any) {
    console.error("Failed to send notification:", error);
    throw new Error(error.response?.data?.error?.message || error.message || 'Failed to send notification');
  }
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
