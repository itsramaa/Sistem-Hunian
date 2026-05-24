package validator

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// DecodeJSON decodes the request body into dst.
// Returns an error if the body is empty or malformed.
func DecodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return fmt.Errorf("request body is empty")
	}
	defer r.Body.Close()

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		return fmt.Errorf("decode json: %w", err)
	}
	return nil
}

// DecodeJSONLenient decodes the request body into dst, allowing unknown fields.
func DecodeJSONLenient(r *http.Request, dst any) error {
	if r.Body == nil {
		return fmt.Errorf("request body is empty")
	}
	defer r.Body.Close()

	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return fmt.Errorf("decode json: %w", err)
	}
	return nil
}
