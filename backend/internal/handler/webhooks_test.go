package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/handler"
)

// ── POST /v1/webhooks/xendit ──────────────────────────────────────────────────

// TestXenditPaymentWebhook_401_InvalidToken verifies that the webhook handler
// returns 401 when the X-CALLBACK-TOKEN header does not match the configured token.
func TestXenditPaymentWebhook_401_InvalidToken(t *testing.T) {
	h := handler.XenditPaymentWebhook(nil, "secret-token")

	body := `{"id":"pay-1","external_id":"inv-1","status":"PAID","amount":100000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CALLBACK-TOKEN", "wrong-token")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized for invalid token, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestXenditPaymentWebhook_401_MissingToken verifies that the webhook handler
// returns 401 when the X-CALLBACK-TOKEN header is absent.
func TestXenditPaymentWebhook_401_MissingToken(t *testing.T) {
	h := handler.XenditPaymentWebhook(nil, "secret-token")

	body := `{"id":"pay-1","external_id":"inv-1","status":"PAID","amount":100000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No X-CALLBACK-TOKEN header.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized for missing token, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestXenditPaymentWebhook_400_InvalidBody verifies that the webhook handler
// returns 400 for malformed JSON payload.
func TestXenditPaymentWebhook_400_InvalidBody(t *testing.T) {
	h := handler.XenditPaymentWebhook(nil, "secret-token")

	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CALLBACK-TOKEN", "secret-token")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid JSON, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestXenditPaymentWebhook_DevMode_NoToken verifies that when webhookToken is empty
// (dev mode), the handler skips token validation and proceeds.
// With nil pool it will fail at DB layer (not 401).
func TestXenditPaymentWebhook_DevMode_SkipsTokenValidation(t *testing.T) {
	// Empty token = dev mode, skip validation.
	h := handler.XenditPaymentWebhook(nil, "")

	body := `{"id":"pay-1","external_id":"inv-1","status":"PAID","amount":100000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No X-CALLBACK-TOKEN header — should be allowed in dev mode.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	// Should NOT return 401 in dev mode.
	if rr.Code == http.StatusUnauthorized {
		t.Errorf("dev mode should skip token validation, but got 401")
	}
}

// ── POST /v1/webhooks/xendit/disbursement ─────────────────────────────────────

// TestXenditDisbursementWebhook_401_InvalidToken verifies that the disbursement
// webhook handler returns 401 for an invalid callback token.
func TestXenditDisbursementWebhook_401_InvalidToken(t *testing.T) {
	h := handler.XenditDisbursementWebhook(nil, "secret-token")

	body := `{"id":"disb-1","external_id":"ext-1","status":"COMPLETED","amount":50000,"bank_code":"BCA"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CALLBACK-TOKEN", "wrong-token")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized for invalid token, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestXenditDisbursementWebhook_400_InvalidBody verifies that the disbursement
// webhook handler returns 400 for malformed JSON.
func TestXenditDisbursementWebhook_400_InvalidBody(t *testing.T) {
	h := handler.XenditDisbursementWebhook(nil, "secret-token")

	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit/disbursement", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CALLBACK-TOKEN", "secret-token")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid JSON, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestXenditDisbursementWebhook_200_ValidToken verifies that the disbursement
// webhook handler returns 200 for a valid token and valid payload.
// (Disbursement webhooks are informational — no DB write required.)
func TestXenditDisbursementWebhook_200_ValidToken(t *testing.T) {
	h := handler.XenditDisbursementWebhook(nil, "secret-token")

	body := `{"id":"disb-1","external_id":"ext-1","status":"COMPLETED","amount":50000,"bank_code":"BCA"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CALLBACK-TOKEN", "secret-token")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 OK for valid disbursement webhook, got %d — body: %s", rr.Code, rr.Body.String())
	}
}
