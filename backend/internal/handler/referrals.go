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

// ReferralCommissions handles POST /v1/cron/referral-commissions
// Processes all unpaid commissions for completed referrals.
func (h *ReferralHandler) ReferralCommissions(w http.ResponseWriter, r *http.Request) {
	if _, err := h.svc.ProcessCommissions(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "commissions processed"})
}
