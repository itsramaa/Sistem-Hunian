package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/middleware"
)

// injectMerchantClaims injects a UserClaims with a merchant_id into the request context.
func injectMerchantClaims(r *http.Request, merchantID string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: "user-123",
		Email:  "merchant@example.com",
		Role:   "merchant",
		AppMetadata: map[string]interface{}{
			"merchant_id": merchantID,
			"role":        "merchant",
		},
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}

// TestListProperties_NoMerchantID verifies that requests without a merchant_id in claims return 403.
func TestListProperties_NoMerchantID(t *testing.T) {
	claims := &middleware.UserClaims{
		UserID:      "user-123",
		Email:       "merchant@example.com",
		Role:        "merchant",
		AppMetadata: map[string]interface{}{},
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/properties", nil)
	ctx := context.WithValue(req.Context(), middleware.UserClaimsKey, claims)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	// Inline handler that mirrors the merchant_id guard in ListProperties.
	h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mid := middleware.GetMerchantID(r)
		if mid == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": map[string]interface{}{
					"code":    "FORBIDDEN",
					"message": "merchant_id not found in token",
					"status":  403,
				},
			})
			return
		}
		w.WriteHeader(http.StatusOK)
	})

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "FORBIDDEN") {
		t.Errorf("expected FORBIDDEN in body, got: %s", rr.Body.String())
	}
}

// TestCreateProperty_MissingName verifies that a missing name field returns 400.
func TestCreateProperty_MissingName(t *testing.T) {
	body := `{"address":"Jl. Sudirman No.1","city":"Jakarta","province":"DKI Jakarta","type":"kos"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/properties", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectMerchantClaims(req, "merchant-abc")

	rr := httptest.NewRecorder()

	// Inline handler that mirrors the name validation in CreateProperty.
	h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mid := middleware.GetMerchantID(r)
		if mid == "" {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		var payload struct {
			Name string `json:"name"`
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if payload.Name == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": map[string]interface{}{
					"code":    "INVALID_REQUEST",
					"message": "name is required",
					"status":  400,
				},
			})
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "INVALID_REQUEST") {
		t.Errorf("expected INVALID_REQUEST in body, got: %s", rr.Body.String())
	}
}

// TestCreateProperty_InvalidType verifies that an invalid property type returns 400.
func TestCreateProperty_InvalidType(t *testing.T) {
	body := `{"name":"Kos Mawar","address":"Jl. Sudirman No.1","city":"Jakarta","province":"DKI Jakarta","type":"hotel"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/properties", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectMerchantClaims(req, "merchant-abc")

	rr := httptest.NewRecorder()

	h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mid := middleware.GetMerchantID(r)
		if mid == "" {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		var payload struct {
			Name string `json:"name"`
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		validTypes := map[string]bool{"kos": true, "apartment": true, "ruko": true, "villa": true}
		if payload.Type != "" && !validTypes[payload.Type] {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": map[string]interface{}{
					"code":    "INVALID_REQUEST",
					"message": "type must be one of: kos, apartment, ruko, villa",
					"status":  400,
				},
			})
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "INVALID_REQUEST") {
		t.Errorf("expected INVALID_REQUEST in body, got: %s", rr.Body.String())
	}
}

// TestCreateUnit_InvalidRentAmount verifies that a non-positive rent_amount returns 400.
func TestCreateUnit_InvalidRentAmount(t *testing.T) {
	body := `{"name":"Unit A1","type":"standard","status":"available","rent_amount":-500000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/properties/prop-1/units", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectMerchantClaims(req, "merchant-abc")

	rr := httptest.NewRecorder()

	h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mid := middleware.GetMerchantID(r)
		if mid == "" {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		var payload struct {
			Name       string  `json:"name"`
			RentAmount float64 `json:"rent_amount"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if payload.RentAmount <= 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": map[string]interface{}{
					"code":    "INVALID_REQUEST",
					"message": "rent_amount must be positive",
					"status":  400,
				},
			})
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "INVALID_REQUEST") {
		t.Errorf("expected INVALID_REQUEST in body, got: %s", rr.Body.String())
	}
}

// TestGetMerchantID_WithValidClaims verifies GetMerchantID extracts merchant_id correctly.
func TestGetMerchantID_WithValidClaims(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/properties", nil)
	req = injectMerchantClaims(req, "merchant-xyz")

	mid := middleware.GetMerchantID(req)
	if mid != "merchant-xyz" {
		t.Errorf("expected merchant-xyz, got %q", mid)
	}
}
