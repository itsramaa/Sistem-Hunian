package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/itsramaa/sistem-hunian/backend/internal/handler"
	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
)

// ── Helpers ───────────────────────────────────────────────────────────────────

// injectAuthClaims injects UserClaims into the request context for auth handler tests.
func injectAuthClaims(r *http.Request, userID, email, role string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		AppMetadata: map[string]interface{}{
			"role": role,
		},
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}

// ── POST /v1/auth/bootstrap ───────────────────────────────────────────────────

// TestBootstrap_401_NoClaims verifies that Bootstrap returns 401 when no JWT claims
// are present in the request context.
func TestBootstrap_401_NoClaims(t *testing.T) {
	// Bootstrap requires a real pgxpool.Pool — we test the auth guard path only.
	// Pass nil pool; the handler must reject before touching the DB.
	h := handler.Bootstrap(nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/bootstrap", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	// No claims injected.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestBootstrap_400_InvalidBody verifies that Bootstrap returns 400 for malformed JSON.
func TestBootstrap_400_InvalidBody(t *testing.T) {
	h := handler.Bootstrap(nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/bootstrap", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req = injectAuthClaims(req, "user-1", "user@example.com", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// ── GET /v1/auth/me ───────────────────────────────────────────────────────────

// TestGetMe_401_NoClaims verifies that Me returns 401 when no JWT claims are present.
func TestGetMe_401_NoClaims(t *testing.T) {
	h := handler.Me(nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	// No claims injected.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestMe_200_AuthGuardPasses verifies that Me returns non-401 when valid claims are present.
// NOTE: With nil pool the handler will return 500 (DB error), but NOT 401.
func TestMe_200_AuthGuardPasses(t *testing.T) {
	h := handler.Me(nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req = injectAuthClaims(req, "user-1", "user@example.com", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	// With nil pool the handler will return 500 (DB error), but NOT 401.
	// This confirms the auth guard passed.
	if rr.Code == http.StatusUnauthorized {
		t.Errorf("auth guard should have passed with valid claims, got 401")
	}
}

// ── Auth response shape ───────────────────────────────────────────────────────

// TestBootstrap_ResponseShape verifies the 401 error response follows the standard
// API error envelope: { data: null, error: { code, message, status } }.
func TestBootstrap_ResponseShape_401(t *testing.T) {
	h := handler.Bootstrap(nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/bootstrap", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	var envelope struct {
		Data  interface{} `json:"data"`
		Error *struct {
			Code    string `json:"code"`
			Message string `json:"message"`
			Status  int    `json:"status"`
		} `json:"error"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&envelope); err != nil {
		t.Fatalf("response is not valid JSON: %v — body: %s", err, rr.Body.String())
	}
	if envelope.Error == nil {
		t.Fatal("expected error envelope, got nil")
	}
	if envelope.Error.Code == "" {
		t.Error("expected non-empty error code")
	}
	if envelope.Error.Status != http.StatusUnauthorized {
		t.Errorf("expected error.status=401, got %d", envelope.Error.Status)
	}
}
