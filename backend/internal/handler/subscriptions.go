package handler

import (
	"net/http"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/apierror"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/pkg/validator"
	"github.com/itsramaa/sihuni-api/internal/service"
)

// SubscriptionHandler handles subscription HTTP requests.
type SubscriptionHandler struct {
	svc *service.SubscriptionService
}

// NewSubscriptionHandler creates a new SubscriptionHandler.
func NewSubscriptionHandler(svc *service.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{svc: svc}
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

// GetSubscription handles GET /v1/subscriptions/{id}
// Returns a single subscription by ID, scoped to the authenticated merchant.
func (h *SubscriptionHandler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
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

// CreateSubscription handles POST /v1/subscriptions
// Creates a new subscription for the authenticated merchant.
func (h *SubscriptionHandler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	var req model.CreateSubscriptionRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	sub, err := h.svc.CreateSubscription(r.Context(), merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "inactive") {
			response.APIError(w, apierror.NotFound("subscription tier not found or inactive"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, sub)
}

// UpdateSubscriptionStatus handles PUT /v1/subscriptions/{id}/status
// Updates the status of a subscription.
func (h *SubscriptionHandler) UpdateSubscriptionStatus(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
		return
	}

	var req model.UpdateSubscriptionStatusRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	sub, err := h.svc.UpdateSubscriptionStatus(r.Context(), id, merchantID, req)
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

// ListTiers handles GET /v1/subscriptions/tiers
// Returns all active subscription tiers.
func (h *SubscriptionHandler) ListTiers(w http.ResponseWriter, r *http.Request) {
	tiers, err := h.svc.ListTiers(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, tiers)
}

// ProcessPayment handles POST /v1/subscriptions/{id}/pay
// Processes a subscription payment and extends the period.
func (h *SubscriptionHandler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
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
// Runs the subscription billing cycle (replaces subscription-billing edge function).
func (h *SubscriptionHandler) CronBilling(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.RunBillingCycle(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, map[string]int{"processed": count})
}

// CronRenewal handles POST /v1/cron/subscription-renewal
// Processes subscription renewals (replaces subscription-renewal edge function).
func (h *SubscriptionHandler) CronRenewal(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.RunRenewal(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, map[string]int{"renewed": count})
}

// CronGraceCheck handles POST /v1/cron/subscription-grace-check
// Checks grace period expirations (replaces subscription-grace-check edge function).
func (h *SubscriptionHandler) CronGraceCheck(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.RunGraceCheck(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, map[string]int{"updated": count})
}
