package handler

import (
	"net/http"
	"strings"

	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/validator"
	"github.com/itsramaa/sistem-hunian/backend/internal/repository"
	"github.com/itsramaa/sistem-hunian/backend/internal/service"
)

// ReferralHandler handles referral HTTP requests.
type ReferralHandler struct {
	svc *service.ReferralService
}

// NewReferralHandler creates a new ReferralHandler.
func NewReferralHandler(db *repository.DB) *ReferralHandler {
	repo := repository.NewReferralRepo(db)
	svc := service.NewReferralService(repo)
	return &ReferralHandler{svc: svc}
}

// ListReferrals handles GET /v1/referrals
// Returns all referrals for the authenticated user (as referrer).
func (h *ReferralHandler) ListReferrals(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	refs, err := h.svc.ListReferrals(r.Context(), userID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, refs)
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
// Processes a reward payout for a completed referral.
func (h *ReferralHandler) ProcessReferralReward(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	var req model.ProcessRewardRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	ref, err := h.svc.ProcessReward(r.Context(), userID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no rows") {
			response.APIError(w, apierror.NotFound("referral not found or already paid"))
			return
		}
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "positive") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, ref)
}

// ProcessVendorOrderReferral handles POST /v1/referrals/vendor-order
// Records a new vendor order referral for the authenticated user.
func (h *ReferralHandler) ProcessVendorOrderReferral(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		response.APIError(w, apierror.Forbidden("user_id not found in token"))
		return
	}

	var req model.VendorOrderReferralRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	ref, err := h.svc.ProcessVendorOrderReferral(r.Context(), userID, req)
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

// CronReferralCommissions handles POST /v1/cron/referral-commissions
// Processes pending commission payouts for completed referrals.
func (h *ReferralHandler) CronReferralCommissions(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.CronCommissions(r.Context()); err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "commissions processed"})
}
