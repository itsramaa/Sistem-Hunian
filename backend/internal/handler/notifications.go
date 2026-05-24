package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// ListNotifications handles GET /v1/notifications
// Returns all notifications for the authenticated user, ordered by created_at DESC.
func ListNotifications(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		notifications, err := repository.ListNotifications(ctx, pool, claims.UserID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}
		if notifications == nil {
			notifications = []model.Notification{}
		}

		response.JSON(w, http.StatusOK, notifications)
	}
}

// MarkNotificationRead handles PUT /v1/notifications/{id}/read
// Marks a notification as read for the authenticated user.
func MarkNotificationRead(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "notification id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		if err := repository.MarkRead(ctx, pool, id, claims.UserID); err != nil {
			if strings.Contains(err.Error(), "no rows updated") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "notification not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"message": "notification marked as read"})
	}
}

// SendNotification handles POST /v1/notifications
// Replaces the send-notification edge function.
// Inserts a notification record into the DB. Email sending is out of scope — logged only.
func SendNotification(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		var req model.SendNotificationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.Type == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type is required")
			return
		}
		if req.RecipientEmail == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "recipient_email is required")
			return
		}

		// Build title and message from type and data
		title, message := buildNotificationContent(req.Type, req.RecipientName, req.Data)

		// Log email sending (actual email delivery is out of scope)
		log.Printf("[notifications] send email to=%s type=%s title=%q", req.RecipientEmail, req.Type, title)

		// Handle WhatsApp type — log only, no actual API call
		if req.Type == "whatsapp" {
			log.Printf("[notifications] whatsapp request: recipient=%s data=%v", req.RecipientEmail, req.Data)
			response.JSON(w, http.StatusOK, map[string]string{
				"message": "whatsapp notification queued (logged)",
			})
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		n := &model.Notification{
			UserID:  claims.UserID,
			Type:    req.Type,
			Title:   title,
			Message: message,
		}

		if err := repository.CreateNotification(ctx, pool, n); err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, n)
	}
}

// PaymentReminder handles POST /v1/cron/payment-reminder
// Replaces the send-payment-reminder edge function.
// Queries overdue invoices and creates a payment_reminder notification for each tenant.
func PaymentReminder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
		defer cancel()

		overdueList, err := repository.ListOverdueInvoicesForReminder(ctx, pool)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "CRON_ERROR", "payment reminder failed: "+err.Error())
			return
		}

		created := 0
		for _, inv := range overdueList {
			n := &model.Notification{
				UserID:  inv.UserID,
				Type:    "payment_reminder",
				Title:   "Payment Reminder",
				Message: fmt.Sprintf("Invoice %s of Rp %.0f was due on %s. Please settle your payment.", inv.InvoiceNumber, inv.Amount, inv.DueDate.Format("02 Jan 2006")),
			}
			if err := repository.CreateNotification(ctx, pool, n); err != nil {
				log.Printf("[notifications] payment-reminder: failed to create notification for user=%s invoice=%s: %v", inv.UserID, inv.InvoiceID, err)
				continue
			}
			log.Printf("[notifications] payment-reminder: created notification for user=%s invoice=%s", inv.UserID, inv.InvoiceID)
			created++
		}

		response.JSON(w, http.StatusOK, map[string]any{
			"processed": len(overdueList),
			"created":   created,
			"message":   "payment reminders sent successfully",
		})
	}
}

// buildNotificationContent returns a title and message for the given notification type.
func buildNotificationContent(notifType, recipientName string, data map[string]interface{}) (title, message string) {
	name := recipientName
	if name == "" {
		name = "User"
	}

	switch notifType {
	case "invoice":
		invoiceNum, _ := data["invoice_number"].(string)
		amount, _ := data["amount"].(float64)
		title = "New Invoice"
		message = fmt.Sprintf("Hi %s, invoice %s for Rp %.0f has been issued.", name, invoiceNum, amount)
	case "payment_reminder":
		invoiceNum, _ := data["invoice_number"].(string)
		title = "Payment Reminder"
		message = fmt.Sprintf("Hi %s, your invoice %s is overdue. Please settle your payment.", name, invoiceNum)
	case "maintenance_update":
		subject, _ := data["subject"].(string)
		title = "Maintenance Update"
		message = fmt.Sprintf("Hi %s, maintenance update: %s", name, subject)
	case "general":
		subject, _ := data["subject"].(string)
		body, _ := data["body"].(string)
		title = subject
		message = body
	default:
		title = "Notification"
		message = fmt.Sprintf("Hi %s, you have a new notification.", name)
	}
	return
}
