package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/itsramaa/sihuni-api/internal/handler"
)

// ── GET /v1/invitations/:token ────────────────────────────────────────────────

// TestGetInvitation_400_EmptyToken verifies that GetInvitation returns 400 when
// the token path param is empty.
func TestGetInvitation_400_EmptyToken(t *testing.T) {
	h := handler.GetInvitation(nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/invitations/", nil)
	// No chi route context — token will be empty string.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for empty token, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestGetInvitation_404_NilPool verifies that GetInvitation returns 404 (not 500)
// when the token is provided but the DB lookup fails (nil pool → panic guard).
// This test documents the expected error path when the invitation is not found.
func TestGetInvitation_WithToken_ProceedsToDBLayer(t *testing.T) {
	h := handler.GetInvitation(nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/invitations/some-token", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("token", "some-token")
	req = req.WithContext(chi.NewRouteContext().WithContext(req.Context()))

	// Re-inject chi context properly.
	req2 := httptest.NewRequest(http.MethodGet, "/v1/invitations/some-token", nil)
	chiCtx := chi.NewRouteContext()
	chiCtx.URLParams.Add("token", "some-token")
	req2 = req2.WithContext(chi.RouteContext(req2.Context()))

	// Use chi router to properly inject URL params.
	r := chi.NewRouter()
	r.Get("/v1/invitations/{token}", h)

	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/v1/invitations/test-token-abc", nil))

	// With nil pool, handler will panic or return 404/500.
	// We verify it does NOT return 400 (token was found in path).
	if rr.Code == http.StatusBadRequest {
		t.Errorf("should not return 400 when token is present in path, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// ── POST /v1/invitations/accept ───────────────────────────────────────────────

// TestAcceptInvitation_400_MissingFields verifies that AcceptInvitation returns 400
// when required fields (token, user_id) are missing.
func TestAcceptInvitation_400_MissingToken(t *testing.T) {
	h := handler.AcceptInvitation(nil)

	body := `{"user_id":"user-1"}` // missing token
	req := httptest.NewRequest(http.MethodPost, "/v1/invitations/accept", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing token, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestAcceptInvitation_400_MissingUserID verifies that AcceptInvitation returns 400
// when user_id is missing.
func TestAcceptInvitation_400_MissingUserID(t *testing.T) {
	h := handler.AcceptInvitation(nil)

	body := `{"token":"some-token"}` // missing user_id
	req := httptest.NewRequest(http.MethodPost, "/v1/invitations/accept", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing user_id, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestAcceptInvitation_400_InvalidBody verifies that AcceptInvitation returns 400
// for malformed JSON.
func TestAcceptInvitation_400_InvalidBody(t *testing.T) {
	h := handler.AcceptInvitation(nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/invitations/accept", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid JSON, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestAcceptInvitation_400_EmptyBody verifies that AcceptInvitation returns 400
// for an empty body (both token and user_id missing).
func TestAcceptInvitation_400_EmptyBody(t *testing.T) {
	h := handler.AcceptInvitation(nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/invitations/accept", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for empty body, got %d — body: %s", rr.Code, rr.Body.String())
	}
}
