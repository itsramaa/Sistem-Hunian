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

// PropertyHandler handles property and unit HTTP requests.
type PropertyHandler struct {
	svc *service.PropertyService
}

// NewPropertyHandler creates a new PropertyHandler.
func NewPropertyHandler(svc *service.PropertyService) *PropertyHandler {
	return &PropertyHandler{svc: svc}
}

// ListProperties handles GET /v1/properties
// Returns all properties for the authenticated merchant.
func (h *PropertyHandler) ListProperties(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	props, err := h.svc.ListProperties(r.Context(), merchantID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, props)
}

// GetProperty handles GET /v1/properties/{id}
// Returns a single property by ID, scoped to the authenticated merchant.
func (h *PropertyHandler) GetProperty(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("property id is required"))
		return
	}

	prop, err := h.svc.GetProperty(r.Context(), id, merchantID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("property not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, prop)
}

// CreateProperty handles POST /v1/properties
// Creates a new property for the authenticated merchant.
func (h *PropertyHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	var req model.CreatePropertyRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	prop, err := h.svc.CreateProperty(r.Context(), merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, prop)
}

// UpdateProperty handles PUT /v1/properties/{id}
// Updates a property, scoped to the authenticated merchant.
func (h *PropertyHandler) UpdateProperty(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("property id is required"))
		return
	}

	var req model.UpdatePropertyRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	prop, err := h.svc.UpdateProperty(r.Context(), id, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("property not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, prop)
}

// DeleteProperty handles DELETE /v1/properties/{id}
// Deletes a property, scoped to the authenticated merchant.
func (h *PropertyHandler) DeleteProperty(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	id := r.PathValue("id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("property id is required"))
		return
	}

	if err := h.svc.DeleteProperty(r.Context(), id, merchantID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("property not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.NoContent(w)
}

// ListUnits handles GET /v1/properties/{id}/units
// Returns all units for a property, scoped to the authenticated merchant.
func (h *PropertyHandler) ListUnits(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	propertyID := r.PathValue("id")
	if propertyID == "" {
		response.APIError(w, apierror.BadRequest("property id is required"))
		return
	}

	units, err := h.svc.ListUnits(r.Context(), propertyID, merchantID)
	if err != nil {
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, units)
}

// GetUnit handles GET /v1/units/{id}
// Returns a single unit by ID, scoped to the authenticated merchant.
func (h *PropertyHandler) GetUnit(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	unitID := r.PathValue("id")
	if unitID == "" {
		response.APIError(w, apierror.BadRequest("unit id is required"))
		return
	}

	unit, err := h.svc.GetUnit(r.Context(), unitID, merchantID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("unit not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, unit)
}

// CreateUnit handles POST /v1/properties/{id}/units
// Creates a new unit for a property, scoped to the authenticated merchant.
func (h *PropertyHandler) CreateUnit(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	propertyID := r.PathValue("id")
	if propertyID == "" {
		response.APIError(w, apierror.BadRequest("property id is required"))
		return
	}

	var req model.CreateUnitRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	unit, err := h.svc.CreateUnit(r.Context(), propertyID, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "positive") {
			response.APIError(w, apierror.BadRequest(err.Error()))
			return
		}
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "access denied") {
			response.APIError(w, apierror.NotFound("property not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, unit)
}

// UpdateUnit handles PUT /v1/units/{id}
// Updates a unit, scoped to the authenticated merchant.
func (h *PropertyHandler) UpdateUnit(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	unitID := r.PathValue("id")
	if unitID == "" {
		response.APIError(w, apierror.BadRequest("unit id is required"))
		return
	}

	var req model.UpdateUnitRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	unit, err := h.svc.UpdateUnit(r.Context(), unitID, merchantID, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("unit not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, unit)
}

// DeleteUnit handles DELETE /v1/units/{id}
// Deletes a unit, scoped to the authenticated merchant.
func (h *PropertyHandler) DeleteUnit(w http.ResponseWriter, r *http.Request) {
	merchantID := middleware.GetMerchantID(r)
	if merchantID == "" {
		response.APIError(w, apierror.Forbidden("merchant_id not found in token"))
		return
	}

	unitID := r.PathValue("id")
	if unitID == "" {
		response.APIError(w, apierror.BadRequest("unit id is required"))
		return
	}

	if err := h.svc.DeleteUnit(r.Context(), unitID, merchantID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			response.APIError(w, apierror.NotFound("unit not found"))
			return
		}
		response.APIError(w, apierror.Internal(err.Error()))
		return
	}

	response.NoContent(w)
}
