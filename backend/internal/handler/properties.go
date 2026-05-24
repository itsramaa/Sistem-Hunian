package handler

import (
	"context"
	"encoding/json"
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

// ── Properties ────────────────────────────────────────────────────────────────

// ListProperties handles GET /v1/properties
// Returns all properties belonging to the authenticated merchant.
func ListProperties(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		props, err := repository.ListProperties(ctx, pool, merchantID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}
		if props == nil {
			props = []model.Property{}
		}

		response.JSON(w, http.StatusOK, props)
	}
}

// GetProperty handles GET /v1/properties/{id}
// Returns a single property scoped to the authenticated merchant.
func GetProperty(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		prop, err := repository.GetProperty(ctx, pool, id, merchantID)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "property not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, prop)
	}
}

// CreateProperty handles POST /v1/properties
// Creates a new property for the authenticated merchant.
func CreateProperty(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		var req model.CreatePropertyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.Name == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "name is required")
			return
		}
		if req.Address == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "address is required")
			return
		}
		if req.Type == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type is required")
			return
		}

		validTypes := map[string]bool{"kos": true, "apartment": true, "ruko": true, "villa": true}
		if !validTypes[req.Type] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type must be one of: kos, apartment, ruko, villa")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		prop, err := repository.CreateProperty(ctx, pool, merchantID, req)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, prop)
	}
}

// UpdateProperty handles PUT /v1/properties/{id}
// Updates an existing property scoped to the authenticated merchant.
func UpdateProperty(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property id is required")
			return
		}

		var req model.UpdatePropertyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.Name == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "name is required")
			return
		}
		if req.Type != "" {
			validTypes := map[string]bool{"kos": true, "apartment": true, "ruko": true, "villa": true}
			if !validTypes[req.Type] {
				response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type must be one of: kos, apartment, ruko, villa")
				return
			}
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		prop, err := repository.UpdateProperty(ctx, pool, id, merchantID, req)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "property not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, prop)
	}
}

// DeleteProperty handles DELETE /v1/properties/{id}
// Deletes a property scoped to the authenticated merchant.
func DeleteProperty(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		if err := repository.DeleteProperty(ctx, pool, id, merchantID); err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "property not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"message": "property deleted"})
	}
}

// ── Units ─────────────────────────────────────────────────────────────────────

// ListUnits handles GET /v1/properties/{id}/units
// Returns all units for a property scoped to the authenticated merchant.
func ListUnits(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		propertyID := chi.URLParam(r, "id")
		if propertyID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		units, err := repository.ListUnits(ctx, pool, propertyID, merchantID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}
		if units == nil {
			units = []model.Unit{}
		}

		response.JSON(w, http.StatusOK, units)
	}
}

// CreateUnit handles POST /v1/properties/{id}/units
// Creates a new unit under a property for the authenticated merchant.
func CreateUnit(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		propertyID := chi.URLParam(r, "id")
		if propertyID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property id is required")
			return
		}

		var req model.CreateUnitRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.Name == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "name is required")
			return
		}
		if req.RentAmount <= 0 {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "rent_amount must be positive")
			return
		}

		validUnitTypes := map[string]bool{"standard": true, "deluxe": true, "suite": true}
		if req.Type != "" && !validUnitTypes[req.Type] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type must be one of: standard, deluxe, suite")
			return
		}

		validStatuses := map[string]bool{"available": true, "occupied": true, "maintenance": true}
		if req.Status != "" && !validStatuses[req.Status] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "status must be one of: available, occupied, maintenance")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		unit, err := repository.CreateUnit(ctx, pool, propertyID, merchantID, req)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, unit)
	}
}

// GetUnit handles GET /v1/units/{id}
// Returns a single unit scoped to the authenticated merchant.
func GetUnit(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "unit id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		unit, err := repository.GetUnit(ctx, pool, id, merchantID)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "unit not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, unit)
	}
}

// UpdateUnit handles PUT /v1/units/{id}
// Updates an existing unit scoped to the authenticated merchant.
func UpdateUnit(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "unit id is required")
			return
		}

		var req model.UpdateUnitRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		if req.Name == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "name is required")
			return
		}
		if req.RentAmount <= 0 {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "rent_amount must be positive")
			return
		}

		validUnitTypes := map[string]bool{"standard": true, "deluxe": true, "suite": true}
		if req.Type != "" && !validUnitTypes[req.Type] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "type must be one of: standard, deluxe, suite")
			return
		}

		validStatuses := map[string]bool{"available": true, "occupied": true, "maintenance": true}
		if req.Status != "" && !validStatuses[req.Status] {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "status must be one of: available, occupied, maintenance")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		unit, err := repository.UpdateUnit(ctx, pool, id, merchantID, req)
		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "unit not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, unit)
	}
}

// DeleteUnit handles DELETE /v1/units/{id}
// Deletes a unit scoped to the authenticated merchant.
func DeleteUnit(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		merchantID := middleware.GetMerchantID(r)
		if merchantID == "" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "merchant_id not found in token")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "unit id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		if err := repository.DeleteUnit(ctx, pool, id, merchantID); err != nil {
			if strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "unit not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"message": "unit deleted"})
	}
}
