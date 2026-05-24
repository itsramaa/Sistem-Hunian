package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// xenditPaymentWebhookPayload is the payload received from Xendit payment webhooks.
type xenditPaymentWebhookPayload struct {
	ID            string  `json:"id"`
	ExternalID    string  `json:"external_id"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	PaidAmount    float64 `json:"paid_amount"`
	PaymentMethod string  `json:"payment_method"`
}

// xenditDisbursementWebhookPayload is the payload received from Xendit disbursement webhooks.
type xenditDisbursementWebhookPayload struct {
	ID         string  `json:"id"`
	ExternalID string  `json:"external_id"`
	Status     string  `json:"status"`
	Amount     float64 `json:"amount"`
	BankCode   string  `json:"bank_code"`
}

// XenditPaymentWebhook handles POST /v1/webhooks/xendit
// Validates the X-CALLBACK-TOKEN header and processes the payment webhook.
func XenditPaymentWebhook(pool *pgxpool.Pool, webhookToken string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !validateXenditToken(r, webhookToken) {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid webhook token")
			return
		}

		var payload xenditPaymentWebhookPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid webhook payload")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()

		internalStatus := mapXenditStatus(payload.Status)

		// Update payment status
		if err := repository.UpdatePaymentStatus(ctx, pool, payload.ID, internalStatus); err != nil {
			if !strings.Contains(err.Error(), "not found") {
				response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to update payment status")
				return
			}
			// Payment not found — may be a duplicate or out-of-order webhook; acknowledge it
		}

		// If paid, mark the linked invoice as paid
		if internalStatus == "paid" {
			payment, err := repository.GetPaymentByXenditID(ctx, pool, payload.ID)
			if err == nil {
				_ = repository.MarkInvoicePaid(ctx, pool, payment.InvoiceID)
			}
		}

		response.JSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

// XenditDisbursementWebhook handles POST /v1/webhooks/xendit/disbursement
// Validates the X-CALLBACK-TOKEN header and acknowledges the disbursement webhook.
func XenditDisbursementWebhook(pool *pgxpool.Pool, webhookToken string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !validateXenditToken(r, webhookToken) {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid webhook token")
			return
		}

		var payload xenditDisbursementWebhookPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid webhook payload")
			return
		}

		// Disbursement webhooks are informational.
		// Future: update disbursement records, trigger notifications, etc.
		_ = payload

		response.JSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

// validateXenditToken checks the X-CALLBACK-TOKEN header against the configured token.
// Xendit uses simple token-based validation (not HMAC).
func validateXenditToken(r *http.Request, token string) bool {
	if token == "" {
		// If no token configured, skip validation (dev mode)
		return true
	}
	return r.Header.Get("X-CALLBACK-TOKEN") == token
}

// mapXenditStatus maps a Xendit invoice status to the internal payment status.
func mapXenditStatus(xenditStatus string) string {
	switch xenditStatus {
	case "PAID", "SETTLED":
		return "paid"
	case "EXPIRED", "FAILED":
		return "failed"
	default:
		return "pending"
	}
}
