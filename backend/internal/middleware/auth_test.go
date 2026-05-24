package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
)

const testSecret = "test-jwt-secret-that-is-long-enough-for-hs256"

// makeToken creates a signed HS256 JWT for testing.
func makeToken(t *testing.T, claims jwt.MapClaims, secret string) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

// dummyHandler is a simple handler that returns 200 OK.
var dummyHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func TestAuthenticate_ValidToken(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"role":  "merchant",
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
	token := makeToken(t, claims, testSecret)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}

	// The test verifies the handler was reached (200 OK), which means auth passed.
	// Claims injection is verified in TestAuthenticate_ValidToken_ClaimsInjected.
}

func TestAuthenticate_ValidToken_ClaimsInjected(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-456",
		"email": "admin@example.com",
		"role":  "tenant",
		"exp":   time.Now().Add(time.Hour).Unix(),
		"app_metadata": map[string]interface{}{
			"role": "admin",
		},
	}
	token := makeToken(t, claims, testSecret)

	var capturedClaims *middleware.UserClaims
	captureHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedClaims = middleware.GetUserClaims(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(captureHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	if capturedClaims == nil {
		t.Fatal("expected UserClaims in context, got nil")
	}
	if capturedClaims.UserID != "user-456" {
		t.Errorf("expected UserID=user-456, got %s", capturedClaims.UserID)
	}
	if capturedClaims.Email != "admin@example.com" {
		t.Errorf("expected Email=admin@example.com, got %s", capturedClaims.Email)
	}
	// app_metadata.role should override top-level role
	if capturedClaims.Role != "admin" {
		t.Errorf("expected Role=admin (from app_metadata), got %s", capturedClaims.Role)
	}
}

func TestAuthenticate_MissingToken(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestAuthenticate_MalformedBearerPrefix(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Token some-token")
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestAuthenticate_ExpiredToken(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-789",
		"email": "expired@example.com",
		"role":  "merchant",
		"exp":   time.Now().Add(-time.Hour).Unix(), // expired 1 hour ago
	}
	token := makeToken(t, claims, testSecret)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired token, got %d", rr.Code)
	}
}

func TestAuthenticate_WrongSecret(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-000",
		"email": "wrong@example.com",
		"role":  "merchant",
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
	token := makeToken(t, claims, "different-secret-key-that-wont-match")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for wrong secret, got %d", rr.Code)
	}
}

func TestAuthenticate_InvalidJWT(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer not.a.valid.jwt.token")
	rr := httptest.NewRecorder()

	handler := middleware.Authenticate(testSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for invalid JWT, got %d", rr.Code)
	}
}

func TestGetUserClaims_NilWhenNotSet(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Errorf("expected nil claims on unauthenticated context, got %+v", claims)
	}
}
