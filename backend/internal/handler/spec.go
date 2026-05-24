package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"gopkg.in/yaml.v3"
)

// OpenAPISpec handles GET /openapi.json — reads the OpenAPI YAML spec and serves it as JSON.
// The spec file is resolved relative to the binary's source tree for development,
// and from an embedded path for production builds.
func OpenAPISpec(specPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile(specPath)
		if err != nil {
			http.Error(w, `{"error":"spec file not found"}`, http.StatusInternalServerError)
			return
		}

		// Parse YAML into a generic map
		var spec interface{}
		if err := yaml.Unmarshal(data, &spec); err != nil {
			http.Error(w, `{"error":"failed to parse spec"}`, http.StatusInternalServerError)
			return
		}

		// Convert map[interface{}]interface{} keys to string keys (YAML quirk)
		spec = convertKeys(spec)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(spec)
	}
}

// ResolveSpecPath returns the absolute path to the openapi.yaml file.
// In development it resolves relative to the source file location.
// Falls back to a path relative to the working directory.
func ResolveSpecPath() string {
	// Try relative to this source file (works with `go run`)
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		// handler/ -> internal/ -> backend/ -> api/openapi.yaml
		candidate := filepath.Join(filepath.Dir(filename), "..", "..", "api", "openapi.yaml")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	// Fallback: relative to working directory (works with compiled binary)
	return "api/openapi.yaml"
}

// convertKeys recursively converts map[interface{}]interface{} to map[string]interface{}
// which is required for JSON marshaling of YAML-parsed data.
func convertKeys(v interface{}) interface{} {
	switch val := v.(type) {
	case map[interface{}]interface{}:
		result := make(map[string]interface{}, len(val))
		for k, v2 := range val {
			result[fmt.Sprintf("%v", k)] = convertKeys(v2)
		}
		return result
	case map[string]interface{}:
		for k, v2 := range val {
			val[k] = convertKeys(v2)
		}
		return val
	case []interface{}:
		for i, v2 := range val {
			val[i] = convertKeys(v2)
		}
		return val
	default:
		return v
	}
}
