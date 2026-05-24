package model

// NotificationType defines the type of notification to send.
type NotificationType string

const (
	NotificationTypeInvoice          NotificationType = "invoice"
	NotificationTypePaymentReminder  NotificationType = "payment_reminder"
	NotificationTypeMaintenanceUpdate NotificationType = "maintenance_update"
	NotificationTypeGeneral          NotificationType = "general"
)

// SendNotificationRequest is the request body for POST /v1/notifications/send.
type SendNotificationRequest struct {
	Type           NotificationType       `json:"type"`
	RecipientEmail string                 `json:"recipient_email"`
	RecipientName  string                 `json:"recipient_name"`
	Data           map[string]any         `json:"data"`
}

// SendNotificationResponse is the response for POST /v1/notifications/send.
type SendNotificationResponse struct {
	ID string `json:"id"`
}

// PaymentReminderResponse is the response for POST /v1/cron/payment-reminders.
type PaymentReminderResponse struct {
	Sent int `json:"sent"`
}
