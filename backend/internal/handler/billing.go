package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
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

// createInvoiceRequest is the request body for POST /v1/billing/invoices.
type createInvoiceRequest struct {
	TenantUserID string    `json:"tenant_user_id"`
	Amount       float64   `json:"amount"`
	Description  string    `json:"description"`
	DueDate      time.Time `json:"due_date"`
}

// updateInvoiceStatusRequest is the request body for PUT /v1/billing/invoices/:id/status.
type updateInvoiceStatusRequest struct {
	Status string `json:"status"`
}

// ListInvoices handles GET /v1/billing/invoices
// Merchants see all invoices for their merchant_id.
// Tenants see only their own invoices.
func ListInvoices(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		statusFilter := r.URL.Query().Get("status")
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		var merchantID, tenantUserID string

		switch claims.Role {
		case "merchant", "admin":
			mid, err := repository.GetMerchantIDByUserID(ctx, pool, claims.UserID)
			if err != nil {
				response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to resolve merchant")
				return
			}
			merchantID = mid
		case "tenant":
			tenantUserID = claims.UserID
		default:
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "unsupported role")
			return
		}

		invoices, err := repository.ListInvoices(ctx, pool, merchantID, tenantUserID, statusFilter)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}
		if invoices == nil {
			invoices = []model.Invoice{}
		}

		response.JSON(w, http.StatusOK, invoices)
	}
}

// GetInvoice handles GET /v1/billing/invoices/{id}
// Returns a single invoice scoped by role.
func GetInvoice(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invoice id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var inv *model.Invoice
		var err error

		switch claims.Role {
		case "merchant", "admin":
			merchantID, merr := repository.GetMerchantIDByUserID(ctx, pool, claims.UserID)
			if merr != nil {
				response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to resolve merchant")
				return
			}
			inv, err = repository.GetInvoiceByMerchant(ctx, pool, id, merchantID)
		case "tenant":
			inv, err = repository.GetInvoiceByTenant(ctx, pool, id, claims.UserID)
		default:
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "unsupported role")
			return
		}

		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "invoice not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, inv)
	}
}

// GetInvoicePDF handles GET /v1/billing/invoices/{id}/pdf
// Returns an HTML invoice document as an attachment.
func GetInvoicePDF(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invoice id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var inv *model.Invoice
		var err error

		switch claims.Role {
		case "merchant", "admin":
			merchantID, merr := repository.GetMerchantIDByUserID(ctx, pool, claims.UserID)
			if merr != nil {
				response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to resolve merchant")
				return
			}
			inv, err = repository.GetInvoiceByMerchant(ctx, pool, id, merchantID)
		case "tenant":
			inv, err = repository.GetInvoiceByTenant(ctx, pool, id, claims.UserID)
		default:
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "unsupported role")
			return
		}

		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "invoice not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		html, err := renderInvoiceHTML(inv)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "RENDER_ERROR", "failed to render invoice")
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"html": html})
	}
}

// CreateInvoice handles POST /v1/billing/invoices (merchant only).
func CreateInvoice(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		var req createInvoiceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.TenantUserID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "tenant_user_id is required")
			return
		}
		if req.Amount <= 0 {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "amount must be positive")
			return
		}
		if req.DueDate.IsZero() || req.DueDate.Before(time.Now()) {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "due_date must be a future date")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		merchantID, err := repository.GetMerchantIDByUserID(ctx, pool, claims.UserID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to resolve merchant")
			return
		}

		inv, err := repository.CreateInvoice(ctx, pool, merchantID, req.TenantUserID, req.Description, req.Amount, req.DueDate)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, inv)
	}
}

// UpdateInvoiceStatus handles PUT /v1/billing/invoices/{id}/status (merchant only).
func UpdateInvoiceStatus(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invoice id is required")
			return
		}

		var req updateInvoiceStatusRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		validStatuses := map[string]bool{
			"pending": true, "sent": true, "paid": true, "overdue": true, "cancelled": true,
		}
		if !validStatuses[req.Status] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", fmt.Sprintf("invalid status %q", req.Status))
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		merchantID, err := repository.GetMerchantIDByUserID(ctx, pool, claims.UserID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to resolve merchant")
			return
		}

		inv, err := repository.UpdateInvoiceStatus(ctx, pool, id, merchantID, req.Status)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "invoice not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, inv)
	}
}

// GenerateInvoices handles POST /v1/cron/generate-invoices (cron secret required).
func GenerateInvoices(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
		defer cancel()

		count, err := repository.GenerateMonthlyInvoices(ctx, pool)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "CRON_ERROR", "generate invoices failed: "+err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]any{
			"generated": count,
			"message":   "monthly invoices generated successfully",
		})
	}
}

// OverdueEscalation handles POST /v1/cron/overdue-escalation (cron secret required).
func OverdueEscalation(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
		defer cancel()

		const lateFeePercent = 0.02 // 2% late fee
		count, err := repository.MarkOverdueInvoices(ctx, pool, lateFeePercent)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "CRON_ERROR", "overdue escalation failed: "+err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]any{
			"updated": count,
			"message": "overdue escalation completed successfully",
		})
	}
}

// PaymentPlanCheck handles POST /v1/cron/payment-plan-check (cron secret required).
func PaymentPlanCheck(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
		defer cancel()

		count, err := repository.CheckPaymentPlanInstallments(ctx, pool)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "CRON_ERROR", "payment plan check failed: "+err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]any{
			"processed": count,
			"message":   "payment plan check completed successfully",
		})
	}
}

// renderInvoiceHTML renders an HTML invoice document for the given invoice.
func renderInvoiceHTML(inv *model.Invoice) (string, error) {
	const invoiceTmpl = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice {{.InvoiceNumber}}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .title { font-size: 28px; font-weight: bold; color: #1a1a2e; }
  .invoice-meta { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #1a1a2e; color: white; padding: 10px; text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #1a1a2e; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
  .status-paid { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-overdue { background: #f8d7da; color: #721c24; }
  .status-sent { background: #cce5ff; color: #004085; }
  .status-cancelled { background: #e2e3e5; color: #383d41; }
  .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="title">SiHuni</div>
    <div>Sistem Hunian Digital</div>
  </div>
  <div class="invoice-meta">
    <div><strong>Invoice #{{.InvoiceNumber}}</strong></div>
    <div>Date: {{.CreatedAt.Format "02 Jan 2006"}}</div>
    <div>Due: {{.DueDate.Format "02 Jan 2006"}}</div>
    <div><span class="status status-{{.Status}}">{{.Status}}</span></div>
  </div>
</div>
<table>
  <thead>
    <tr><th>Description</th><th>Amount</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>{{.Description}}</td>
      <td>Rp {{printf "%.0f" .Amount}}</td>
    </tr>
    {{if gt .LateFee 0.0}}
    <tr>
      <td>Late Fee</td>
      <td>Rp {{printf "%.0f" .LateFee}}</td>
    </tr>
    {{end}}
    <tr class="total-row">
      <td>Total</td>
      <td>Rp {{printf "%.0f" .TotalAmount}}</td>
    </tr>
  </tbody>
</table>
{{if .PaidAt}}
<p style="margin-top:20px;">Paid on: {{.PaidAt.Format "02 Jan 2006 15:04"}}</p>
{{end}}
<div class="footer">
  <p>Generated by SiHuni &mdash; {{.CreatedAt.Format "2006"}}</p>
</div>
</body>
</html>`

	t, err := template.New("invoice").Parse(invoiceTmpl)
	if err != nil {
		return "", fmt.Errorf("render invoice: parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, inv); err != nil {
		return "", fmt.Errorf("render invoice: execute template: %w", err)
	}

	return buf.String(), nil
}
