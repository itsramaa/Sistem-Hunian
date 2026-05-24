package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/apierror"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/pkg/validator"
	"github.com/itsramaa/sihuni-api/internal/repository"
	"github.com/itsramaa/sihuni-api/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SubscriptionHandler handles subscription HTTP requests.
type SubscriptionHandler struct {
	svc *service.SubscriptionService
}

// NewSubscriptionHandler creates a new SubscriptionHandler.
func NewSubscriptionHandler(pool *pgxpool.Pool) *SubscriptionHandler {
	repo := repository.NewSubscriptionRepo(pool)
	svc := service.NewSubscriptionService(repo)
	return &SubscriptionHandler{svc: svc}
}

// ListTiers handles GET /v1/subscriptions/tiers
// Returns all active subscription tiers. Accessible by any authenticated user.
func (h *SubscriptionHandler) ListTiers(w http.ResponseWriter, r *http.Request) {
	tiers, err := h.svc.ListTiers(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, tiers)
}

// ListSubscriptions handles GET /v1/subscriptions
// Returns all subscriptions for the authenticated merchant.
func (h *SubscriptionHandler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	subs, err := h.svc.ListSubscriptions(r.Context(), merchantID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, subs)
}

// CreateSubscription handles POST /v1/subscriptions
// Creates a new subscription for the authenticated merchant.
func (h *SubscriptionHandler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	var req struct {
		TierID string `json:"tier_id"`
	}
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}
	if req.TierID == "" {
		response.APIError(w, apierror.BadRequest("tier_id is required"))
		return
	}

	sub, err := h.svc.CreateSubscription(r.Context(), merchantID, req.TierID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "inactive") {
			response.APIError(w, apierror.NotFound("tier not found or inactive"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, sub)
}

// GetSubscription handles GET /v1/subscriptions/{id}
// Returns a single subscription by ID scoped to the authenticated merchant.
func (h *SubscriptionHandler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
		return
	}

	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	sub, err := h.svc.GetSubscription(r.Context(), id, merchantID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("subscription not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, sub)
}

// UpdateSubscriptionStatus handles PUT /v1/subscriptions/{id}/status
// Updates the status of a subscription scoped to the authenticated merchant.
func (h *SubscriptionHandler) UpdateSubscriptionStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
		return
	}

	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}
	if req.Status == "" {
		response.APIError(w, apierror.BadRequest("status is required"))
		return
	}

	sub, err := h.svc.UpdateSubscriptionStatus(r.Context(), id, merchantID, req.Status)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("subscription not found"))
			return
		}
		if strings.Contains(err.Error(), "invalid status") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, sub)
}

// ProcessPayment handles POST /v1/subscriptions/{id}/pay
// Processes a payment for a subscription scoped to the authenticated merchant.
func (h *SubscriptionHandler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
		return
	}

	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	var req model.SubscriptionPaymentRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	sub, err := h.svc.ProcessPayment(r.Context(), id, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("subscription not found"))
			return
		}
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "positive") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, sub)
}

// CronBilling handles POST /v1/cron/subscription-billing
// Runs the billing cycle for all active subscriptions.
func (h *SubscriptionHandler) CronBilling(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.CronBilling(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "billing cycle complete"})
}

// CronRenewal handles POST /v1/cron/subscription-renewal
// Attempts to renew subscriptions in grace period.
func (h *SubscriptionHandler) CronRenewal(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.CronRenewal(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "renewal cycle complete"})
}

// CronGraceCheck handles POST /v1/cron/subscription-grace-check
// Expires subscriptions that have exceeded the grace period.
func (h *SubscriptionHandler) CronGraceCheck(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.CronGraceCheck(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "grace check complete"})
}
