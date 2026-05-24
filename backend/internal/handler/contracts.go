package handler

import (
	"net/http"
	"strings"

	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/validator"
	"github.com/itsramaa/sistem-hunian/backend/internal/service"
)

// ContractHandler handles contract and move-out HTTP requests.
type ContractHandler struct {
	svc *service.ContractService
}

// NewContractHandler creates a new ContractHandler.
func NewContractHandler(svc *service.ContractService) *ContractHandler {
	return &ContractHandler{svc: svc}
}

// ListContracts handles GET /v1/contracts
// Returns all contracts for the authenticated merchant.
func (h *ContractHandler) ListContracts(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	contracts, err := h.svc.ListContracts(r.Context(), merchantID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, contracts)
}

// GetContract handles GET /v1/contracts/{id}
// Returns a single contract by ID, scoped to the authenticated merchant.
func (h *ContractHandler) GetContract(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("contract id is required"))
		return
	}

	contract, err := h.svc.GetContract(r.Context(), id, merchantID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("contract not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, contract)
}

// ProcessDepositRefund handles POST /v1/contracts/{id}/deposit-refund
// Processes a deposit refund for a contract (replaces process-deposit-refund edge function).
func (h *ContractHandler) ProcessDepositRefund(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("contract id is required"))
		return
	}

	var req model.DepositRefundRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	contract, err := h.svc.ProcessDepositRefund(r.Context(), id, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "already processed") {
			response.APIError(w, apierror.NotFound("contract not found or deposit already processed"))
			return
		}
		if strings.Contains(err.Error(), "positive") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, contract)
}

// ListMoveOuts handles GET /v1/contracts/move-outs
// Returns all move-out notices for the authenticated merchant.
func (h *ContractHandler) ListMoveOuts(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	notices, err := h.svc.ListMoveOuts(r.Context(), merchantID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, notices)
}

// GetMoveOut handles GET /v1/contracts/move-outs/{id}
// Returns a single move-out notice by ID, scoped to the authenticated merchant.
func (h *ContractHandler) GetMoveOut(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("move-out id is required"))
		return
	}

	notice, err := h.svc.GetMoveOut(r.Context(), id, merchantID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("move-out notice not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, notice)
}

// UpdateMoveOutStatus handles PUT /v1/contracts/move-outs/{id}/status
// Updates the status of a move-out notice.
func (h *ContractHandler) UpdateMoveOutStatus(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("move-out id is required"))
		return
	}

	var req model.UpdateMoveOutStatusRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	notice, err := h.svc.UpdateMoveOutStatus(r.Context(), id, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("move-out notice not found"))
			return
		}
		if strings.Contains(err.Error(), "invalid status") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, notice)
}
