import { apiClient } from '@/lib/axios';

interface SendNotificationParams {
  type: "invoice" | "payment_reminder" | "maintenance_update" | "general" | "tenant_registration" | "verification_approved" | "verification_rejected";
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const response = await apiClient.post('/notifications/send', params);
    return response.data.data;
  } catch (error: any) {
    const apiError = error.response?.data?.error;
    console.error("Failed to send notification:", error);
    throw new Error(apiError?.message || error.message || 'Failed to send notification');
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
