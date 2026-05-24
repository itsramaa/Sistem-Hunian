package apierror

import "net/http"

// APIError is a structured error with HTTP status, code, and message.
type APIError struct {
	Status  int    `json:"status"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string { return e.Message }

func New(status int, code, message string) *APIError {
	return &APIError{Status: status, Code: code, Message: message}
}

func BadRequest(message string) *APIError {
	return New(http.StatusBadRequest, "BAD_REQUEST", message)
}

func Unauthorized(message string) *APIError {
	return New(http.StatusUnauthorized, "UNAUTHORIZED", message)
}

func Forbidden(message string) *APIError {
	return New(http.StatusForbidden, "FORBIDDEN", message)
}

func NotFound(message string) *APIError {
	return New(http.StatusNotFound, "NOT_FOUND", message)
}

func Internal(message string) *APIError {
	return New(http.StatusInternalServerError, "INTERNAL_ERROR", message)
}
