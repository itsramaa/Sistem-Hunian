package response_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

func TestJSON_StatusAndEnvelope(t *testing.T) {
	rr := httptest.NewRecorder()
	response.JSON(rr, http.StatusOK, map[string]string{"key": "value"})

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", contentType)
	}

	var env response.Envelope
	if err := json.NewDecoder(rr.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if env.Error != nil {
		t.Errorf("expected nil error in success response, got %+v", env.Error)
	}
	if env.Data == nil {
		t.Error("expected non-nil data in success response")
	}
}

func TestJSON_201Created(t *testing.T) {
	rr := httptest.NewRecorder()
	response.JSON(rr, http.StatusCreated, map[string]string{"id": "abc"})

	if rr.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rr.Code)
	}
}

func TestError_EnvelopeShape(t *testing.T) {
	rr := httptest.NewRecorder()
	response.Error(rr, http.StatusNotFound, "NOT_FOUND", "resource not found")

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", rr.Code)
	}

	var env response.Envelope
	if err := json.NewDecoder(rr.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if env.Data != nil {
		t.Errorf("expected nil data in error response, got %+v", env.Data)
	}
	if env.Error == nil {
		t.Fatal("expected non-nil error in error response")
	}
	if env.Error.Code != "NOT_FOUND" {
		t.Errorf("expected error code NOT_FOUND, got %s", env.Error.Code)
	}
	if env.Error.Message != "resource not found" {
		t.Errorf("expected error message 'resource not found', got %s", env.Error.Message)
	}
	if env.Error.Status != http.StatusNotFound {
		t.Errorf("expected error status 404, got %d", env.Error.Status)
	}
}

func TestError_401Unauthorized(t *testing.T) {
	rr := httptest.NewRecorder()
	response.Error(rr, http.StatusUnauthorized, "UNAUTHORIZED", "missing bearer token")

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", rr.Code)
	}

	var env response.Envelope
	if err := json.NewDecoder(rr.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error.Code != "UNAUTHORIZED" {
		t.Errorf("expected UNAUTHORIZED, got %s", env.Error.Code)
	}
}

func TestError_500InternalServerError(t *testing.T) {
	rr := httptest.NewRecorder()
	response.Error(rr, http.StatusInternalServerError, "DB_ERROR", "database connection failed")

	if rr.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", rr.Code)
	}
}

func TestNoContent(t *testing.T) {
	rr := httptest.NewRecorder()
	response.NoContent(rr)

	if rr.Code != http.StatusNoContent {
		t.Errorf("expected status 204, got %d", rr.Code)
	}
	if rr.Body.Len() != 0 {
		t.Errorf("expected empty body for 204, got %d bytes", rr.Body.Len())
	}
}

func TestJSON_NilData(t *testing.T) {
	rr := httptest.NewRecorder()
	response.JSON(rr, http.StatusOK, nil)

	var env response.Envelope
	if err := json.NewDecoder(rr.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected nil error, got %+v", env.Error)
	}
}
