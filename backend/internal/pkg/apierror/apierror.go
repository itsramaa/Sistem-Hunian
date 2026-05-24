package apierror

import "net/http"

// APIError represents a structured API error.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

func (e *APIError) Error() string {
	return e.Message
}

// Common error constructors.

func NotFound(msg string) *APIError {
	return &APIError{Code: "NOT_FOUND", Message: msg, Status: http.StatusNotFound}
}

func BadRequest(msg string) *APIError {
	return &APIError{Code: "BAD_REQUEST", Message: msg, Status: http.StatusBadRequest}
}

func Unauthorized(msg string) *APIError {
	return &APIError{Code: "UNAUTHORIZED", Message: msg, Status: http.StatusUnauthorized}
}

func Forbidden(msg string) *APIError {
	return &APIError{Code: "FORBIDDEN", Message: msg, Status: http.StatusForbidden}
}

func Internal(msg string) *APIError {
	return &APIError{Code: "INTERNAL_ERROR", Message: msg, Status: http.StatusInternalServerError}
}

func Conflict(msg string) *APIError {
	return &APIError{Code: "CONFLICT", Message: msg, Status: http.StatusConflict}
}

func UnprocessableEntity(msg string) *APIError {
	return &APIError{Code: "UNPROCESSABLE_ENTITY", Message: msg, Status: http.StatusUnprocessableEntity}
}
