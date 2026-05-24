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

// ReferralHandler handles referral HTTP requests.
type ReferralHandler struct {
	svc *service.ReferralService
}

// NewReferralHandler creates a new ReferralHandler.
func NewReferralHandler(pool *pgxpool.Pool) *ReferralHandler {
	repo := repository.NewReferralRepo(pool)
	svc := service.NewReferralService(repo)
	return &ReferralHandler{svc: svc}
}

// ListReferrals handles GET /v1/referrals
// Returns all referrals for the authenticated user.
func (h *ReferralHandler) ListReferrals(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	referrals, err := h.svc.ListReferrals(r.Context(), userID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, referrals)
}

// GetReferral handles GET /v1/referrals/{id}
// Returns a single referral by ID for the authenticated user.
func (h *ReferralHandler) GetReferral(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("id is required"))
		return
	}

	ref, err := h.svc.GetReferral(r.Context(), id, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("referral not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, ref)
}

// CreateReferral handles POST /v1/referrals
// Creates a new referral record for the authenticated user as referrer.
func (h *ReferralHandler) CreateReferral(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	var req struct {
		ReferredID string `json:"referred_id"`
		Type       string `json:"type"`
	}
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	ref, err := h.svc.CreateReferral(r.Context(), userID, req.ReferredID, req.Type)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, ref)
}

// GetStats handles GET /v1/referrals/stats
// Returns aggregated referral statistics for the authenticated user.
// Delegates to GetReferralStats.
func (h *ReferralHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	h.GetReferralStats(w, r)
}

// GetReferralStats handles GET /v1/referrals/stats
// Returns aggregated referral statistics for the authenticated user.
func (h *ReferralHandler) GetReferralStats(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	stats, err := h.svc.GetStats(r.Context(), userID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, stats)
}

// ProcessReferralReward handles POST /v1/referrals/reward
// Processes a reward payout for a referral.
func (h *ReferralHandler) ProcessReferralReward(w http.ResponseWriter, r *http.Request) {
	var req model.ReferralRewardRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	ref, err := h.svc.ProcessReward(r.Context(), req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("referral not found"))
			return
		}
		if strings.Contains(err.Error(), "required") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, ref)
}

// ProcessVendorOrderReferral handles POST /v1/referrals/vendor-order
// Creates a new vendor order referral record.
func (h *ReferralHandler) ProcessVendorOrderReferral(w http.ResponseWriter, r *http.Request) {
	var req model.VendorOrderReferralRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	ref, err := h.svc.ProcessVendorOrderReferral(r.Context(), req)
	if err != nil {
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "non-negative") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, ref)
}

// CronProcessCommissions handles POST /v1/cron/referral-commissions
// Processes all unpaid commissions for completed referrals.
func (h *ReferralHandler) CronProcessCommissions(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.ProcessCommissions(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]int{"processed": count})
}

// ReferralCommissions is an alias for CronProcessCommissions for backward compatibility.
func (h *ReferralHandler) ReferralCommissions(w http.ResponseWriter, r *http.Request) {
	h.CronProcessCommissions(w, r)
}

// CronProcessRewards handles POST /v1/cron/referral-reward
// Processes pending referral reward payouts.
func (h *ReferralHandler) CronProcessRewards(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.ProcessCommissions(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]int{"processed": count})
}

// CronProcessVendorOrderReferrals handles POST /v1/cron/vendor-order-referral
// Processes pending vendor order referrals by finalising commissions.
func (h *ReferralHandler) CronProcessVendorOrderReferrals(w http.ResponseWriter, r *http.Request) {
	count, err := h.svc.ProcessCommissions(r.Context())
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]int{"processed": count})
}
