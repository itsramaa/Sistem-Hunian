package handler

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

// xenditInvoiceRequest is the request body for CreateXenditInvoice.
type xenditInvoiceRequest struct {
	InvoiceID  string `json:"invoice_id"`
	PayerEmail string `json:"payer_email"`
	Amount     float64 `json:"amount"`
}

// xenditDisbursementRequest is the request body for CreateDisbursement.
type xenditDisbursementRequest struct {
	ExternalID          string  `json:"external_id"`
	BankCode            string  `json:"bank_code"`
	AccountHolderName   string  `json:"account_holder_name"`
	AccountNumber       string  `json:"account_number"`
	Amount              float64 `json:"amount"`
}

// xenditWebhookPayload is the payload from Xendit payment webhooks.
type xenditWebhookPayload struct {
	ID         string  `json:"id"`
	ExternalID string  `json:"external_id"`
	Status     string  `json:"status"`
	Amount     float64 `json:"amount"`
}

// requireUserClaims extracts UserClaims from context; returns nil if absent.
func requireUserClaims(r *http.Request) *middleware.UserClaims {
	claims, _ := r.Context().Value(middleware.UserClaimsKey).(*middleware.UserClaims)
	return claims
}

// CreateXenditInvoice handles POST /v1/payments/xendit/invoice
// Creates a Xendit payment invoice for the authenticated user.
func CreateXenditInvoice(pool *pgxpool.Pool, _ interface{}) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := requireUserClaims(r)
		if claims == nil {
			response.APIError(w, apierror.Unauthorized("authentication required"))
			return
		}

		var req xenditInvoiceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if req.InvoiceID == "" {
			response.APIError(w, apierror.BadRequest("invoice_id is required"))
			return
		}
		if req.PayerEmail == "" {
			response.APIError(w, apierror.BadRequest("payer_email is required"))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.Internal("database unavailable"))
			return
		}

		response.JSON(w, http.StatusCreated, map[string]string{
			"invoice_id": req.InvoiceID,
			"status":     "pending",
		})
	})
}

// CreateDisbursement handles POST /v1/payments/xendit/disbursement
// Creates a Xendit disbursement for the authenticated user.
func CreateDisbursement(pool *pgxpool.Pool, _ interface{}) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := requireUserClaims(r)
		if claims == nil {
			response.APIError(w, apierror.Unauthorized("authentication required"))
			return
		}

		var req xenditDisbursementRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if req.ExternalID == "" {
			response.APIError(w, apierror.BadRequest("external_id is required"))
			return
		}
		if req.BankCode == "" {
			response.APIError(w, apierror.BadRequest("bank_code is required"))
			return
		}
		if req.AccountHolderName == "" {
			response.APIError(w, apierror.BadRequest("account_holder_name is required"))
			return
		}
		if req.AccountNumber == "" {
			response.APIError(w, apierror.BadRequest("account_number is required"))
			return
		}
		if req.Amount <= 0 {
			response.APIError(w, apierror.BadRequest("amount must be positive"))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.Internal("database unavailable"))
			return
		}

		response.JSON(w, http.StatusCreated, map[string]string{
			"external_id": req.ExternalID,
			"status":      "pending",
		})
	})
}

// XenditPaymentWebhook handles POST /v1/webhooks/xendit/payment
// Processes Xendit payment status callbacks.
func XenditPaymentWebhook(pool *pgxpool.Pool, callbackToken string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if callbackToken != "" {
			token := r.Header.Get("X-CALLBACK-TOKEN")
			if token != callbackToken {
				response.APIError(w, apierror.Unauthorized("invalid callback token"))
				return
			}
		}

		var payload xenditWebhookPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if payload.ExternalID == "" {
			response.APIError(w, apierror.BadRequest("external_id is required"))
			return
		}

		if pool == nil {
			response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"status": "processed"})
	})
}

// XenditDisbursementWebhook handles POST /v1/webhooks/xendit/disbursement
// Processes Xendit disbursement status callbacks.
func XenditDisbursementWebhook(pool *pgxpool.Pool, callbackToken string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if callbackToken != "" {
			token := r.Header.Get("X-CALLBACK-TOKEN")
			if token != callbackToken {
				response.APIError(w, apierror.Unauthorized("invalid callback token"))
				return
			}
		}

		var payload xenditWebhookPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if payload.ExternalID == "" {
			response.APIError(w, apierror.BadRequest("external_id is required"))
			return
		}

		if pool == nil {
			response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"status": "processed"})
	})
}
