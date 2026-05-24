package response

import (
	"encoding/json"
	"net/http"

	"github.com/itsramaa/sihuni-api/internal/pkg/apierror"
)

// Envelope is the standard API response wrapper for all endpoints.
type Envelope struct {
	Data  interface{} `json:"data"`
	Error *errorBody  `json:"error"`
	Meta  *Meta       `json:"meta,omitempty"`
}

// errorBody represents a structured error response payload.
type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

// Meta holds optional response metadata such as request IDs.
type Meta struct {
	RequestID string `json:"request_id,omitempty"`
}

// JSON writes a successful JSON response with the given status code and data payload.
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Envelope{Data: data, Error: nil})
}

// Error writes a structured error JSON response.
func Error(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Envelope{
		Data:  nil,
		Error: &errorBody{Code: code, Message: message, Status: status},
	})
}

// NoContent writes a 204 No Content response.
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// APIError writes a structured error response from an *apierror.APIError.
func APIError(w http.ResponseWriter, err *apierror.APIError) {
	Error(w, err.Status, err.Code, err.Message)
}
