package handler

import (
	"net/http"
	"strings"

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

// ListSubscriptionTiers handles GET /v1/subscriptions/tiers (public)
// Returns all active subscription tiers.
func (h *SubscriptionHandler) ListSubscriptionTiers(w http.ResponseWriter, r *http.Request) {
	tiers, err := h.svc.ListTiers(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, tiers)
}

// ListSubscriptions handles GET /v1/subscriptions (admin)
// Returns all subscriptions.
func (h *SubscriptionHandler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	subs, err := h.svc.ListSubscriptions(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, subs)
}

// GetSubscription handles GET /v1/subscriptions/{id}
// Returns a single subscription by ID.
func (h *SubscriptionHandler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("subscription id is required"))
		return
	}

	sub, err := h.svc.GetSubscription(r.Context(), id)
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

// ProcessSubscriptionPayment handles POST /v1/subscriptions/payment
// Creates or renews a subscription for the authenticated merchant.
func (h *SubscriptionHandler) ProcessSubscriptionPayment(w http.ResponseWriter, r *http.Request) {
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

	sub, err := h.svc.ProcessPayment(r.Context(), req)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, sub)
}

// SubscriptionBilling handles POST /v1/cron/subscription-billing
// Runs the billing cycle for all active subscriptions.
func (h *SubscriptionHandler) SubscriptionBilling(w http.ResponseWriter, r *http.Request) {
	if _, err := h.svc.RunBillingCycle(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "billing cycle complete"})
}

// SubscriptionRenewal handles POST /v1/cron/subscription-renewal
// Attempts to renew subscriptions in grace period.
func (h *SubscriptionHandler) SubscriptionRenewal(w http.ResponseWriter, r *http.Request) {
	if _, err := h.svc.RunRenewal(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "renewal cycle complete"})
}

// SubscriptionGraceCheck handles POST /v1/cron/subscription-grace-check
// Expires subscriptions that have exceeded the grace period.
func (h *SubscriptionHandler) SubscriptionGraceCheck(w http.ResponseWriter, r *http.Request) {
	if _, err := h.svc.RunGraceCheck(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "grace check complete"})
}
