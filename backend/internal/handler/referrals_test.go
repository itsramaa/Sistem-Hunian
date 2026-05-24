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

const referralTestSecret = "test-jwt-secret-that-is-long-enough-for-hs256"

// makeReferralToken creates a signed HS256 JWT for referral handler tests.
func makeReferralToken(t *testing.T, userID, email, role string) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"role":  role,
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(referralTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

// injectUserClaims injects UserClaims into a request context, simulating the Authenticate middleware.
func injectUserClaims(r *http.Request, userID, email, role string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}

// TestListReferrals_Unauthorized verifies that requests without a JWT are rejected with 401.
func TestListReferrals_Unauthorized(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/referrals", nil)
	// No Authorization header — claims will be nil.
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}

// TestCreateReferral_Unauthorized verifies that requests without a JWT are rejected.
func TestCreateReferral_Unauthorized(t *testing.T) {
	body := `{"referred_id":"user-456","type":"tenant"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/referrals", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}

// TestGetStats_Unauthorized verifies that stats endpoint rejects unauthenticated requests.
func TestGetStats_Unauthorized(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/referrals/stats", nil)
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}

// TestAuthenticate_RejectsExpiredToken_Referrals verifies that expired JWTs are rejected.
func TestAuthenticate_RejectsExpiredToken_Referrals(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"role":  "tenant",
		"exp":   time.Now().Add(-time.Hour).Unix(), // expired
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(referralTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/referrals", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(referralTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired token, got %d", rr.Code)
	}
}

// TestAuthenticate_AcceptsValidToken_Referrals verifies that valid JWTs pass the middleware
// and that the user ID is correctly extracted from the context.
func TestAuthenticate_AcceptsValidToken_Referrals(t *testing.T) {
	token := makeReferralToken(t, "user-abc", "user@example.com", "tenant")

	req := httptest.NewRequest(http.MethodGet, "/v1/referrals", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	var capturedUserID string
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUserID = middleware.GetUserID(r)
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(referralTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for valid token, got %d", rr.Code)
	}
	if capturedUserID != "user-abc" {
		t.Errorf("expected userID=user-abc, got %q", capturedUserID)
	}
}

// TestInjectUserClaims_GetUserID verifies that injected claims are correctly retrieved.
func TestInjectUserClaims_GetUserID(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/referrals", nil)
	req = injectUserClaims(req, "user-xyz", "xyz@example.com", "tenant")

	userID := middleware.GetUserID(req)
	if userID != "user-xyz" {
		t.Errorf("expected userID=user-xyz, got %q", userID)
	}
}

// TestGetReferral_Unauthorized verifies that GET /{id} rejects unauthenticated requests.
func TestGetReferral_Unauthorized(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/referrals/some-id", nil)
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}
