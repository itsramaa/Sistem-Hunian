package model

import "time"

// Notification represents a notification record in the database.
type Notification struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	MerchantID string     `json:"merchant_id,omitempty"`
	Type       string     `json:"type"`    // invoice, payment_reminder, maintenance_update, general, whatsapp
	Title      string     `json:"title"`
	Message    string     `json:"message"`
	IsRead     bool       `json:"is_read"`
	CreatedAt  time.Time  `json:"created_at"`
	ReadAt     *time.Time `json:"read_at,omitempty"`
}

// SendNotificationRequest is the request body for POST /v1/notifications.
type SendNotificationRequest struct {
	Type           string                 `json:"type"`
	RecipientEmail string                 `json:"recipient_email"`
	RecipientName  string                 `json:"recipient_name"`
	Data           map[string]interface{} `json:"data"`
}

// SendWhatsAppRequest is the request body for sending a WhatsApp notification.
type SendWhatsAppRequest struct {
	PhoneNumber string                 `json:"phone_number"`
	Template    string                 `json:"template"`
	Data        map[string]interface{} `json:"data"`
}
