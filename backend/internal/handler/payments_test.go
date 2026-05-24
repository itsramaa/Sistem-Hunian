package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/handler"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"context"
)

// ── POST /v1/payments/xendit/invoice ─────────────────────────────────────────

// TestCreateXenditInvoice_401_NoClaims verifies that CreateXenditInvoice returns 401
// when no JWT claims are present in the request context.
func TestCreateXenditInvoice_401_NoClaims(t *testing.T) {
	h := handler.CreateXenditInvoice(nil, nil)

	body := `{"invoice_id":"inv-1","payer_email":"user@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/invoice", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No claims injected.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateXenditInvoice_400_InvalidBody verifies that CreateXenditInvoice returns 400
// for malformed JSON.
func TestCreateXenditInvoice_400_InvalidBody(t *testing.T) {
	h := handler.CreateXenditInvoice(nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/invoice", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "user-1", "tenant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid JSON, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateXenditInvoice_400_MissingInvoiceID verifies that CreateXenditInvoice
// returns 400 when invoice_id is missing.
func TestCreateXenditInvoice_400_MissingInvoiceID(t *testing.T) {
	h := handler.CreateXenditInvoice(nil, nil)

	body := `{"payer_email":"user@example.com"}` // missing invoice_id
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/invoice", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "user-1", "tenant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing invoice_id, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateXenditInvoice_400_MissingPayerEmail verifies that CreateXenditInvoice
// returns 400 when payer_email is missing.
func TestCreateXenditInvoice_400_MissingPayerEmail(t *testing.T) {
	h := handler.CreateXenditInvoice(nil, nil)

	body := `{"invoice_id":"inv-1"}` // missing payer_email
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/invoice", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "user-1", "tenant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing payer_email, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// ── POST /v1/payments/xendit/disbursement ─────────────────────────────────────

// TestCreateDisbursement_401_NoClaims verifies that CreateDisbursement returns 401
// when no JWT claims are present.
func TestCreateDisbursement_401_NoClaims(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	body := `{"external_id":"ext-1","bank_code":"BCA","account_holder_name":"John","account_number":"1234567890","amount":50000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No claims injected.
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateDisbursement_400_InvalidBody verifies that CreateDisbursement returns 400
// for malformed JSON.
func TestCreateDisbursement_400_InvalidBody(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "merchant-1", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid JSON, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateDisbursement_400_MissingExternalID verifies that CreateDisbursement
// returns 400 when external_id is missing.
func TestCreateDisbursement_400_MissingExternalID(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	body := `{"bank_code":"BCA","account_holder_name":"John","account_number":"1234567890","amount":50000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "merchant-1", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing external_id, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateDisbursement_400_ZeroAmount verifies that CreateDisbursement returns 400
// when amount is zero or negative.
func TestCreateDisbursement_400_ZeroAmount(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	body := `{"external_id":"ext-1","bank_code":"BCA","account_holder_name":"John","account_number":"1234567890","amount":0}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "merchant-1", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for zero amount, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateDisbursement_400_NegativeAmount verifies that CreateDisbursement returns 400
// when amount is negative.
func TestCreateDisbursement_400_NegativeAmount(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	body := `{"external_id":"ext-1","bank_code":"BCA","account_holder_name":"John","account_number":"1234567890","amount":-1000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "merchant-1", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for negative amount, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestCreateDisbursement_400_MissingBankCode verifies that CreateDisbursement returns 400
// when bank_code is missing.
func TestCreateDisbursement_400_MissingBankCode(t *testing.T) {
	h := handler.CreateDisbursement(nil, nil)

	body := `{"external_id":"ext-1","account_holder_name":"John","account_number":"1234567890","amount":50000}`
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/xendit/disbursement", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectPaymentClaims(req, "merchant-1", "merchant")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing bank_code, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// injectPaymentClaims injects UserClaims into the request context for payment handler tests.
func injectPaymentClaims(r *http.Request, userID, role string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: userID,
		Role:   role,
		AppMetadata: map[string]interface{}{
			"role": role,
		},
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}
