package handler

import (
	"net/http"

	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// Health handles GET /health — returns a simple liveness check.
func Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
