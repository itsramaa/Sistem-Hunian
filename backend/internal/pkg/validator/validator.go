package validator

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// DecodeJSONLenient decodes the request body into dst.
// Returns an error if the body is not valid JSON.
func DecodeJSONLenient(r *http.Request, dst interface{}) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return fmt.Errorf("decode: %w", err)
	}
	return nil
}
