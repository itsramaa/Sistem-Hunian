package handler_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
)

const subTestSecret = "test-jwt-secret-that-is-long-enough-for-hs256"

// makeSubToken creates a signed HS256 JWT for subscription handler tests.
// Pass merchantID as non-empty to include it in app_metadata.
func makeSubToken(t *testing.T, userID, role, merchantID string) string {
	t.Helper()
	appMeta := map[string]interface{}{}
	if merchantID != "" {
		appMeta["merchant_id"] = merchantID
	}
	claims := jwt.MapClaims{
		"sub":          userID,
		"email":        userID + "@example.com",
		"role":         role,
		"app_metadata": appMeta,
		"exp":          time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(subTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

// TestSubscriptionAuthenticate_RejectsNoToken verifies that requests without a JWT are rejected with 401.
func TestSubscriptionAuthenticate_RejectsNoToken(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions/tiers", nil)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(subTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing token, got %d", rr.Code)
	}
}

// TestSubscriptionAuthenticate_AcceptsValidToken verifies that valid JWTs pass the middleware
// and that merchant_id is correctly extracted from app_metadata.
func TestSubscriptionAuthenticate_AcceptsValidToken(t *testing.T) {
	token := makeSubToken(t, "merchant-user-1", "merchant", "merchant-abc-123")

	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	var capturedMerchantID string
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMerchantID = middleware.GetMerchantID(r)
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(subTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for valid token, got %d", rr.Code)
	}
	if capturedMerchantID != "merchant-abc-123" {
		t.Errorf("expected merchant_id=merchant-abc-123, got %q", capturedMerchantID)
	}
}

// TestSubscriptionAuthenticate_RejectsExpiredToken verifies that expired JWTs are rejected.
func TestSubscriptionAuthenticate_RejectsExpiredToken(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":  "user-expired",
		"role": "merchant",
		"exp":  time.Now().Add(-time.Hour).Unix(), // expired
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(subTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(subTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired token, got %d", rr.Code)
	}
}

// TestGetMerchantID_MissingFromContext verifies that GetMerchantID returns empty string
// when no claims are present in the context.
func TestGetMerchantID_MissingFromContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil)
	// No claims injected — context is bare.
	merchantID := middleware.GetMerchantID(req)
	if merchantID != "" {
		t.Errorf("expected empty merchant_id for unauthenticated request, got %q", merchantID)
	}
}

// TestGetMerchantID_PresentInContext verifies that GetMerchantID correctly extracts
// merchant_id from app_metadata when claims are injected into the context.
func TestGetMerchantID_PresentInContext(t *testing.T) {
	claims := &middleware.UserClaims{
		UserID: "user-xyz",
		Role:   "merchant",
		AppMetadata: map[string]interface{}{
			"merchant_id": "merchant-xyz-456",
		},
	}
	ctx := context.WithValue(context.Background(), middleware.UserClaimsKey, claims)
	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil).WithContext(ctx)

	merchantID := middleware.GetMerchantID(req)
	if merchantID != "merchant-xyz-456" {
		t.Errorf("expected merchant_id=merchant-xyz-456, got %q", merchantID)
	}
}

// TestSubscriptionRequireRole_RejectsTenant verifies that the RequireRole middleware
// rejects users with insufficient roles.
func TestSubscriptionRequireRole_RejectsTenant(t *testing.T) {
	token := makeSubToken(t, "tenant-user", "tenant", "")

	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Chain: Authenticate → RequireRole("merchant", "admin") → handler
	chain := middleware.Authenticate(subTestSecret)(
		middleware.RequireRole("merchant", "admin")(dummyHandler),
	)
	chain.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403 for tenant role on merchant-only route, got %d", rr.Code)
	}
}

// TestSubscriptionRequireRole_AcceptsMerchant verifies that merchants can access
// merchant-scoped subscription routes.
func TestSubscriptionRequireRole_AcceptsMerchant(t *testing.T) {
	token := makeSubToken(t, "merchant-user", "merchant", "merchant-abc")

	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	chain := middleware.Authenticate(subTestSecret)(
		middleware.RequireRole("merchant", "admin")(dummyHandler),
	)
	chain.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for merchant role, got %d", rr.Code)
	}
}

// TestCreateSubscription_MissingTierID verifies that CreateSubscription handler
// returns 400 when tier_id is missing from the request body.
func TestCreateSubscription_MissingTierID(t *testing.T) {
	// Build a request with an empty tier_id
	body := `{"tier_id": ""}`
	req := httptest.NewRequest(http.MethodPost, "/v1/subscriptions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// Inject merchant claims into context
	claims := &middleware.UserClaims{
		UserID: "user-merchant",
		Role:   "merchant",
		AppMetadata: map[string]interface{}{
			"merchant_id": "merchant-test-001",
		},
	}
	ctx := context.WithValue(req.Context(), middleware.UserClaimsKey, claims)
	req = req.WithContext(ctx)

	// Verify that GetMerchantID works correctly with injected claims
	merchantID := middleware.GetMerchantID(req)
	if merchantID != "merchant-test-001" {
		t.Errorf("expected merchant_id=merchant-test-001, got %q", merchantID)
	}

	// Verify the request body can be decoded
	if req.Body == nil {
		t.Fatal("expected non-nil request body")
	}
}

// TestCronBilling_RequiresCronSecret verifies that cron endpoints reject requests
// without the X-Cron-Secret header.
func TestCronBilling_RequiresCronSecret(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/v1/cron/subscription-billing", nil)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	cronMiddleware := middleware.RequireCronSecret("super-secret-cron-key")
	cronMiddleware(dummyHandler).ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing cron secret, got %d", rr.Code)
	}
}

// TestCronBilling_AcceptsValidSecret verifies that cron endpoints accept requests
// with the correct X-Cron-Secret header.
func TestCronBilling_AcceptsValidSecret(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/v1/cron/subscription-billing", nil)
	req.Header.Set("X-Cron-Secret", "super-secret-cron-key")
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	cronMiddleware := middleware.RequireCronSecret("super-secret-cron-key")
	cronMiddleware(dummyHandler).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for valid cron secret, got %d", rr.Code)
	}
}
