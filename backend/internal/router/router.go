package router

import (
	"net/http"
	"time"

	"github.com/itsramaa/sistem-hunian/backend/internal/config"
	"github.com/itsramaa/sistem-hunian/backend/internal/handler"
	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/resend"
	"github.com/itsramaa/sistem-hunian/backend/internal/repository"
	"github.com/itsramaa/sistem-hunian/backend/internal/service"
)

// New builds and returns the main HTTP router.
func New(cfg *config.Config, db *repository.DB) http.Handler {
	mux := http.NewServeMux()

	// --- Dependencies ---
	resendClient := resend.New(cfg.ResendAPIKey, cfg.ResendFrom)

	// Handlers
	healthH := handler.NewHealthHandler()
	authH := handler.NewAuthHandler(db.Pool)
	notifH := handler.NewNotificationHandler(
		service.NewNotificationService(resendClient, db.Pool),
	)
	propRepo := repository.NewPropertyRepo(db)
	propH := handler.NewPropertyHandler(
		service.NewPropertyService(propRepo),
	)

	// --- Middleware chains ---
	requireAuth := middleware.RequireAuth(cfg.SupabaseJWTSecret)
	requireMerchant := middleware.RequireRole("merchant", "admin")
	requireCron := middleware.RequireCronSecret(cfg.CronSecret)
	requireWebhook := middleware.RequireWebhookSecret(cfg.WebhookSecret)

	// --- Routes ---

	// Health check (no auth)
	mux.HandleFunc("GET /health", healthH.Health)

	// Auth webhook (webhook secret)
	mux.Handle("POST /v1/auth/webhook",
		requireWebhook(http.HandlerFunc(authH.Webhook)),
	)

	// Notifications (JWT required)
	mux.Handle("POST /v1/notifications/send",
		requireAuth(http.HandlerFunc(notifH.Send)),
	)

	// Cron endpoints (cron secret, no JWT)
	mux.Handle("POST /v1/cron/payment-reminders",
		requireCron(http.HandlerFunc(notifH.SendPaymentReminders)),
	)

	// Properties (JWT + merchant role)
	mux.Handle("GET /v1/properties",
		requireAuth(requireMerchant(http.HandlerFunc(propH.ListProperties))),
	)
	mux.Handle("POST /v1/properties",
		requireAuth(requireMerchant(http.HandlerFunc(propH.CreateProperty))),
	)
	mux.Handle("GET /v1/properties/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.GetProperty))),
	)
	mux.Handle("PUT /v1/properties/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.UpdateProperty))),
	)
	mux.Handle("DELETE /v1/properties/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.DeleteProperty))),
	)

	// Units (JWT + merchant role)
	mux.Handle("GET /v1/properties/{id}/units",
		requireAuth(requireMerchant(http.HandlerFunc(propH.ListUnits))),
	)
	mux.Handle("POST /v1/properties/{id}/units",
		requireAuth(requireMerchant(http.HandlerFunc(propH.CreateUnit))),
	)
	mux.Handle("GET /v1/units/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.GetUnit))),
	)
	mux.Handle("PUT /v1/units/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.UpdateUnit))),
	)
	mux.Handle("DELETE /v1/units/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(propH.DeleteUnit))),
	)

	// --- Global middleware stack ---
	var h http.Handler = mux
	h = middleware.Logger(h)
	h = middleware.CORS(nil)(h)
	h = middleware.RateLimit(100, time.Minute)(h)

	return h
}
