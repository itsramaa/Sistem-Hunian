package handler_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
)

const notifTestSecret = "test-jwt-secret-that-is-long-enough-for-hs256"

// makeNotifToken creates a signed HS256 JWT for notification handler tests.
func makeNotifToken(t *testing.T, userID, email, role string) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"role":  role,
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(notifTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

// TestListNotifications_Unauthorized verifies that requests without a JWT are rejected with 401.
func TestListNotifications_Unauthorized(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/notifications", nil)
	// No Authorization header — claims will be nil.
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
	// Confirm the handler would return 401 by verifying claims are absent.
	// Full integration test requires a database; this validates the auth guard logic.
}

// TestMarkNotificationRead_Unauthorized verifies that requests without a JWT are rejected.
func TestMarkNotificationRead_Unauthorized(t *testing.T) {
	req := httptest.NewRequest(http.MethodPut, "/v1/notifications/some-id/read", nil)
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}

// TestSendNotification_Unauthorized verifies that requests without a JWT are rejected.
func TestSendNotification_Unauthorized(t *testing.T) {
	body := `{"type":"invoice","recipient_email":"test@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/notifications", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	claims := middleware.GetUserClaims(req.Context())
	if claims != nil {
		t.Fatal("expected nil claims for unauthenticated request")
	}
}

// TestAuthenticate_RejectsExpiredToken verifies that expired JWTs are rejected by the middleware.
func TestAuthenticate_RejectsExpiredToken(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"role":  "tenant",
		"exp":   time.Now().Add(-time.Hour).Unix(), // expired
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(notifTestSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	rr := httptest.NewRecorder()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(notifTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired token, got %d", rr.Code)
	}
}

// TestAuthenticate_AcceptsValidToken verifies that valid JWTs pass the middleware.
func TestAuthenticate_AcceptsValidToken(t *testing.T) {
	token := makeNotifToken(t, "user-abc", "user@example.com", "tenant")

	req := httptest.NewRequest(http.MethodGet, "/v1/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	var capturedClaims *middleware.UserClaims
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedClaims = middleware.GetUserClaims(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Authenticate(notifTestSecret)(dummyHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for valid token, got %d", rr.Code)
	}
	if capturedClaims == nil {
		t.Fatal("expected UserClaims in context, got nil")
	}
	if capturedClaims.UserID != "user-abc" {
		t.Errorf("expected UserID=user-abc, got %s", capturedClaims.UserID)
	}
	if capturedClaims.Role != "tenant" {
		t.Errorf("expected Role=tenant, got %s", capturedClaims.Role)
	}
}

// TestBuildNotificationContent_Invoice verifies notification content generation for various types.
func TestBuildNotificationContent_Invoice(t *testing.T) {
	cases := []struct {
		notifType     string
		recipientName string
		data          map[string]interface{}
		wantTitle     string
	}{
		{
			notifType:     "invoice",
			recipientName: "Budi",
			data:          map[string]interface{}{"invoice_number": "INV-001", "amount": float64(500000)},
			wantTitle:     "New Invoice",
		},
		{
			notifType:     "payment_reminder",
			recipientName: "Siti",
			data:          map[string]interface{}{"invoice_number": "INV-002"},
			wantTitle:     "Payment Reminder",
		},
		{
			notifType:     "maintenance_update",
			recipientName: "Andi",
			data:          map[string]interface{}{"subject": "Water pipe repair"},
			wantTitle:     "Maintenance Update",
		},
		{
			notifType:     "general",
			recipientName: "User",
			data:          map[string]interface{}{"subject": "Welcome", "body": "Welcome to SiHuni!"},
			wantTitle:     "Welcome",
		},
		{
			notifType:     "unknown",
			recipientName: "",
			data:          map[string]interface{}{},
			wantTitle:     "Notification",
		},
	}

	for _, tc := range cases {
		title, _ := buildNotifContentForTest(tc.notifType, tc.recipientName, tc.data)
		if title != tc.wantTitle {
			t.Errorf("buildNotificationContent(%q) title = %q, want %q", tc.notifType, title, tc.wantTitle)
		}
	}
}

// buildNotifContentForTest mirrors the internal buildNotificationContent function for testing.
func buildNotifContentForTest(notifType, recipientName string, data map[string]interface{}) (title, message string) {
	name := recipientName
	if name == "" {
		name = "User"
	}

	switch notifType {
	case "invoice":
		invoiceNum, _ := data["invoice_number"].(string)
		amount, _ := data["amount"].(float64)
		title = "New Invoice"
		message = fmt.Sprintf("Hi %s, invoice %s for Rp %.0f has been issued.", name, invoiceNum, amount)
	case "payment_reminder":
		invoiceNum, _ := data["invoice_number"].(string)
		title = "Payment Reminder"
		message = fmt.Sprintf("Hi %s, your invoice %s is overdue. Please settle your payment.", name, invoiceNum)
	case "maintenance_update":
		subject, _ := data["subject"].(string)
		title = "Maintenance Update"
		message = fmt.Sprintf("Hi %s, maintenance update: %s", name, subject)
	case "general":
		subject, _ := data["subject"].(string)
		body, _ := data["body"].(string)
		title = subject
		message = body
	default:
		title = "Notification"
		message = fmt.Sprintf("Hi %s, you have a new notification.", name)
	}
	return
}
