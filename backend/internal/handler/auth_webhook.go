package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// AuthWebhook handles POST /v1/webhooks/auth
// Replaces the auth-webhook Supabase Edge Function.
// Handles Supabase auth events (user.created, user.deleted, etc.)
func AuthWebhook(secret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Validate webhook secret
		if r.Header.Get("X-Webhook-Secret") != secret {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid webhook secret")
			return
		}

		var event map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		eventType, _ := event["type"].(string)
		slog.Info("auth webhook received", "event_type", eventType)

		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}
