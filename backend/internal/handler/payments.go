package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/pkg/xendit"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// createXenditInvoiceRequest is the request body for POST /v1/payments/xendit/invoice.
type createXenditInvoiceRequest struct {
	InvoiceID   string `json:"invoice_id"`
	PayerEmail  string `json:"payer_email"`
	Description string `json:"description"`
	SuccessURL  string `json:"success_url,omitempty"`
	FailureURL  string `json:"failure_url,omitempty"`
}

// createDisbursementRequest is the request body for POST /v1/payments/xendit/disbursement.
type createDisbursementRequest struct {
	ExternalID        string  `json:"external_id"`
	BankCode          string  `json:"bank_code"`
	AccountHolderName string  `json:"account_holder_name"`
	AccountNumber     string  `json:"account_number"`
	Description       string  `json:"description"`
	Amount            float64 `json:"amount"`
}

// CreateXenditInvoice handles POST /v1/payments/xendit/invoice
// Creates a Xendit payment invoice for an internal invoice.
func CreateXenditInvoice(pool *pgxpool.Pool, xClient *xendit.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		var req createXenditInvoiceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.InvoiceID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invoice_id is required")
			return
		}
		if req.PayerEmail == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "payer_email is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
		defer cancel()

		// Fetch the internal invoice to get the amount
		inv, err := repository.GetInvoiceByID(ctx, pool, req.InvoiceID)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "invoice not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		if inv.Status == "paid" {
			response.Error(w, http.StatusConflict, "ALREADY_PAID", "invoice is already paid")
			return
		}
		if inv.Status == "cancelled" {
			response.Error(w, http.StatusConflict, "INVOICE_CANCELLED", "invoice is cancelled")
			return
		}

		description := req.Description
		if description == "" {
			description = inv.Description
		}

		xenditResp, err := xClient.CreateInvoice(ctx, xendit.CreateInvoiceRequest{
			ExternalID:  inv.ID,
			Amount:      inv.TotalAmount,
			PayerEmail:  req.PayerEmail,
			Description: description,
			Currency:    "IDR",
			SuccessURL:  req.SuccessURL,
			FailureURL:  req.FailureURL,
		})
		if err != nil {
			response.Error(w, http.StatusBadGateway, "XENDIT_ERROR", "failed to create Xendit invoice: "+err.Error())
			return
		}

		// Persist the payment record
		payment, err := repository.CreatePayment(ctx, pool, inv.ID, "xendit_invoice", xenditResp.ID, xenditResp.InvoiceURL, inv.TotalAmount)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to persist payment: "+err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, map[string]any{
			"payment":     payment,
			"payment_url": xenditResp.InvoiceURL,
		})
	}
}

// CreateDisbursement handles POST /v1/payments/xendit/disbursement (merchant only).
func CreateDisbursement(pool *pgxpool.Pool, xClient *xendit.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		var req createDisbursementRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.ExternalID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "external_id is required")
			return
		}
		if req.BankCode == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "bank_code is required")
			return
		}
		if req.AccountHolderName == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "account_holder_name is required")
			return
		}
		if req.AccountNumber == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "account_number is required")
			return
		}
		if req.Amount <= 0 {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "amount must be positive")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
		defer cancel()

		resp, err := xClient.CreateDisbursement(ctx, xendit.DisbursementRequest{
			ExternalID:        req.ExternalID,
			BankCode:          req.BankCode,
			AccountHolderName: req.AccountHolderName,
			AccountNumber:     req.AccountNumber,
			Description:       req.Description,
			Amount:            req.Amount,
		})
		if err != nil {
			response.Error(w, http.StatusBadGateway, "XENDIT_ERROR", "failed to create disbursement: "+err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, resp)
	}
}
