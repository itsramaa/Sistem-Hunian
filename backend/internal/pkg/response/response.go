package response

import (
	"encoding/json"
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
)

// envelope is the standard JSON response wrapper.
type envelope struct {
	Data  any          `json:"data"`
	Error *errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

// JSON writes a successful JSON response.
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Data: data, Error: nil})
}

// Error writes an error JSON response.
func Error(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{
		Data: nil,
		Error: &errorDetail{
			Code:    code,
			Message: message,
			Status:  status,
		},
	})
}

// APIError writes an *apierror.APIError response.
func APIError(w http.ResponseWriter, err *apierror.APIError) {
	Error(w, err.Status, err.Code, err.Message)
}

// NoContent writes a 204 No Content response.
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}
