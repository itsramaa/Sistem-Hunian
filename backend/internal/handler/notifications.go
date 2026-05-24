package handler

import (
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/validator"
	"github.com/itsramaa/sistem-hunian/backend/internal/service"
)

// NotificationHandler handles notification-related HTTP requests.
type NotificationHandler struct {
	svc *service.NotificationService
}

// NewNotificationHandler creates a new NotificationHandler.
func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

// Send handles POST /v1/notifications/send
// Sends a notification email to a recipient.
func (h *NotificationHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req model.SendNotificationRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	if req.RecipientEmail == "" {
		response.APIError(w, apierror.BadRequest("recipient_email is required"))
		return
	}
	if req.RecipientName == "" {
		response.APIError(w, apierror.BadRequest("recipient_name is required"))
		return
	}
	if req.Type == "" {
		response.APIError(w, apierror.BadRequest("type is required"))
		return
	}

	result, err := h.svc.Send(r.Context(), req)
	if err != nil {
		response.APIError(w, apierror.Internal("failed to send notification: "+err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// SendPaymentReminders handles POST /v1/cron/payment-reminders
// Queries overdue invoices and sends reminder emails.
// Protected by X-Cron-Secret middleware.
func (h *NotificationHandler) SendPaymentReminders(w http.ResponseWriter, r *http.Request) {
	sent, err := h.svc.SendPaymentReminders(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal("failed to send payment reminders: "+err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, model.PaymentReminderResponse{Sent: sent})
}
