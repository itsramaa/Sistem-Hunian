package service

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/resend"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NotificationService handles sending notifications via email.
type NotificationService struct {
	resend *resend.Client
	db     *pgxpool.Pool
}

// NewNotificationService creates a new NotificationService.
func NewNotificationService(resendClient *resend.Client, db *pgxpool.Pool) *NotificationService {
	return &NotificationService{
		resend: resendClient,
		db:     db,
	}
}

// Send sends a notification email based on the request type.
func (s *NotificationService) Send(ctx context.Context, req model.SendNotificationRequest) (*model.SendNotificationResponse, error) {
	if req.RecipientEmail == "" {
		return nil, fmt.Errorf("notification_service: recipient_email is required")
	}
	if req.RecipientName == "" {
		return nil, fmt.Errorf("notification_service: recipient_name is required")
	}
	if s.resend == nil {
		return nil, fmt.Errorf("notification_service: resend client not configured")
	}

	subject, html := buildEmailTemplate(string(req.Type), req.RecipientName, req.Data)

	result, err := s.resend.SendEmail(ctx, resend.SendEmailRequest{
		To:      []string{req.RecipientEmail},
		Subject: subject,
		HTML:    html,
	})
	if err != nil {
		return nil, fmt.Errorf("notification_service: send email: %w", err)
	}

	return &model.SendNotificationResponse{ID: result.ID}, nil
}

// SendPaymentReminders queries overdue invoices and sends reminder emails.
// Returns the number of reminders sent.
func (s *NotificationService) SendPaymentReminders(ctx context.Context) (int, error) {
	// Query invoices that are overdue or due within 7 days
	rows, err := s.db.Query(ctx, `
		SELECT
			i.id,
			i.amount,
			i.due_date,
			p.email AS tenant_email,
			p.full_name AS tenant_name,
			pr.name AS property_name,
			u.unit_number
		FROM invoices i
		JOIN tenants t ON t.id = i.tenant_id
		JOIN profiles p ON p.user_id = t.user_id
		LEFT JOIN contracts c ON c.id = i.contract_id
		LEFT JOIN units u ON u.id = c.unit_id
		LEFT JOIN properties pr ON pr.id = u.property_id
		WHERE i.status = 'pending'
		  AND i.due_date <= NOW() + INTERVAL '7 days'
		  AND i.due_date >= NOW() - INTERVAL '30 days'
		ORDER BY i.due_date ASC
	`)
	if err != nil {
		return 0, fmt.Errorf("notification_service: query overdue invoices: %w", err)
	}
	defer rows.Close()

	type invoiceRow struct {
		ID           string
		Amount       float64
		DueDate      string
		TenantEmail  string
		TenantName   string
		PropertyName string
		UnitNumber   string
	}

	var invoices []invoiceRow
	for rows.Next() {
		var inv invoiceRow
		if err := rows.Scan(
			&inv.ID, &inv.Amount, &inv.DueDate,
			&inv.TenantEmail, &inv.TenantName,
			&inv.PropertyName, &inv.UnitNumber,
		); err != nil {
			continue
		}
		invoices = append(invoices, inv)
	}
	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("notification_service: rows error: %w", err)
	}

	sent := 0
	for _, inv := range invoices {
		_, err := s.resend.SendEmail(ctx, resend.SendEmailRequest{
			To:      []string{inv.TenantEmail},
			Subject: fmt.Sprintf("Payment Reminder: Rp %.0f due %s", inv.Amount, inv.DueDate),
			HTML:    buildPaymentReminderHTML(inv.TenantName, inv.Amount, inv.DueDate, inv.PropertyName, inv.UnitNumber),
		})
		if err != nil {
			// Log but don't fail the whole batch
			continue
		}
		sent++
	}

	return sent, nil
}

// buildEmailTemplate returns subject and HTML for a given notification type.
func buildEmailTemplate(notifType, recipientName string, data map[string]any) (subject, html string) {
	getString := func(key string) string {
		if v, ok := data[key].(string); ok {
			return v
		}
		return ""
	}
	getFloat := func(key string) float64 {
		switch v := data[key].(type) {
		case float64:
			return v
		case int:
			return float64(v)
		}
		return 0
	}

	switch notifType {
	case "invoice":
		invoiceNum := getString("invoiceNumber")
		merchantName := getString("merchantName")
		amount := getFloat("amount")
		dueDate := getString("dueDate")
		paymentLink := getString("paymentLink")

		subject = fmt.Sprintf("New Invoice #%s from %s", invoiceNum, merchantName)
		html = fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0891b2,#065f73);padding:30px;text-align:center;">
    <h1 style="color:white;margin:0;">SiHuni</h1>
    <p style="color:rgba(255,255,255,0.9);margin-top:5px;">Property Management</p>
  </div>
  <div style="padding:30px;background:#f9fafb;">
    <h2 style="color:#1f2937;">New Invoice</h2>
    <p style="color:#6b7280;">Hi %s,</p>
    <p style="color:#6b7280;">You have a new invoice from <strong>%s</strong>.</p>
    <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;">
      <p style="margin:5px 0;color:#374151;"><strong>Invoice #:</strong> %s</p>
      <p style="margin:5px 0;color:#374151;"><strong>Amount Due:</strong> Rp %.0f</p>
      <p style="margin:5px 0;color:#374151;"><strong>Due Date:</strong> %s</p>
    </div>
    <a href="%s" style="display:inline-block;background:#0891b2;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:15px;">Pay Now</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:30px;">This email was sent by SiHuni Property Management.</p>
  </div>
</div>`, recipientName, merchantName, invoiceNum, amount, dueDate, paymentLink)

	case "payment_reminder":
		amount := getFloat("amount")
		dueDate := getString("dueDate")
		propertyName := getString("propertyName")
		paymentLink := getString("paymentLink")

		subject = fmt.Sprintf("Payment Reminder: Rp %.0f due %s", amount, dueDate)
		html = buildPaymentReminderHTML(recipientName, amount, dueDate, propertyName, "")
		_ = paymentLink

	case "maintenance_update":
		title := getString("title")
		status := getString("status")
		notes := getString("notes")

		subject = fmt.Sprintf("Maintenance Update: %s", title)
		html = fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0891b2,#065f73);padding:30px;text-align:center;">
    <h1 style="color:white;margin:0;">Maintenance Update</h1>
  </div>
  <div style="padding:30px;background:#f9fafb;">
    <p style="color:#6b7280;">Hi %s,</p>
    <p style="color:#6b7280;">There's an update on your maintenance request.</p>
    <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;">
      <p style="margin:5px 0;color:#374151;"><strong>Request:</strong> %s</p>
      <p style="margin:5px 0;color:#374151;"><strong>Status:</strong> %s</p>
      <p style="margin:5px 0;color:#374151;"><strong>Notes:</strong> %s</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:30px;">This is an automated notification from SiHuni.</p>
  </div>
</div>`, recipientName, title, status, notes)

	default:
		// General notification
		message := getString("message")
		subject = getString("subject")
		if subject == "" {
			subject = "Notification from SiHuni"
		}
		html = fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0891b2,#065f73);padding:30px;text-align:center;">
    <h1 style="color:white;margin:0;">SiHuni</h1>
  </div>
  <div style="padding:30px;background:#f9fafb;">
    <p style="color:#6b7280;">Hi %s,</p>
    <p style="color:#374151;">%s</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:30px;">This is an automated notification from SiHuni.</p>
  </div>
</div>`, recipientName, message)
	}

	return subject, html
}

func buildPaymentReminderHTML(recipientName string, amount float64, dueDate, propertyName, unitNumber string) string {
	location := propertyName
	if unitNumber != "" {
		location = fmt.Sprintf("%s - Unit %s", propertyName, unitNumber)
	}
	return fmt.Sprintf(`
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;text-align:center;">
    <h1 style="color:white;margin:0;">Payment Reminder</h1>
  </div>
  <div style="padding:30px;background:#f9fafb;">
    <p style="color:#6b7280;">Hi %s,</p>
    <p style="color:#6b7280;">This is a friendly reminder that your payment is coming up soon.</p>
    <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;">
      <p style="margin:5px 0;color:#374151;"><strong>Amount Due:</strong> Rp %.0f</p>
      <p style="margin:5px 0;color:#374151;"><strong>Due Date:</strong> %s</p>
      <p style="margin:5px 0;color:#374151;"><strong>Property:</strong> %s</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:30px;">If you have already made this payment, please disregard this email.</p>
  </div>
</div>`, recipientName, amount, dueDate, location)
}
