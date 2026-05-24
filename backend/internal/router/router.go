package router

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/config"
	"github.com/itsramaa/sihuni-api/internal/handler"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/pkg/xendit"
)

// New creates and returns the configured Chi router with all middleware and routes registered.
func New(cfg *config.Config, pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	// ── Global middleware ──────────────────────────────────────────────────────
	r.Use(middleware.CORS(cfg.AllowedOrigins))
	r.Use(middleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(middleware.RateLimit(200, time.Minute)) // 200 req/min per IP globally

	// ── Xendit client ──────────────────────────────────────────────────────────
	xClient := xendit.New(cfg.XenditSecretKey)

	// ── Public routes (no auth) ────────────────────────────────────────────────
	r.Get("/health", handler.Health)
	r.Get("/docs", handler.ScalarDocs)
	r.Get("/openapi.json", handler.OpenAPISpec(handler.ResolveSpecPath()))

	// ── API v1 ─────────────────────────────────────────────────────────────────
	r.Route("/v1", func(r chi.Router) {

		// Auth endpoints
		r.Route("/auth", func(r chi.Router) {
			// Bootstrap and me require a valid JWT
			r.Group(func(r chi.Router) {
				r.Use(middleware.Authenticate(cfg.JWTSecret))
				r.Post("/bootstrap", handler.Bootstrap(pool))
				r.Get("/me", handler.Me(pool))
			})

			// Admin 2FA — requires JWT + admin role
			r.Group(func(r chi.Router) {
				r.Use(middleware.Authenticate(cfg.JWTSecret))
				r.Use(middleware.RequireRole("admin"))
				r.Post("/admin/2fa/validate", handler.ValidateAdmin2FA(cfg.AdminSecret))
			})
		})

		// Invitation endpoints — public (no auth required)
		r.Route("/invitations", func(r chi.Router) {
			r.Get("/{token}", handler.GetInvitation(pool))
			r.Post("/accept", handler.AcceptInvitation(pool))
		})

		// Billing endpoints — JWT required
		r.Route("/billing", func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))

			r.Get("/invoices", handler.ListInvoices(pool))
			r.Post("/invoices", handler.CreateInvoice(pool))

			r.Route("/invoices/{id}", func(r chi.Router) {
				r.Get("/", handler.GetInvoice(pool))
				r.Get("/pdf", handler.GetInvoicePDF(pool))
				r.Put("/status", handler.UpdateInvoiceStatus(pool))
			})
		})

		// Payment endpoints — JWT required
		r.Route("/payments", func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))

			r.Post("/xendit/invoice", handler.CreateXenditInvoice(pool, xClient))

			// Disbursement — merchant only
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("merchant", "admin"))
				r.Post("/xendit/disbursement", handler.CreateDisbursement(pool, xClient))
			})
		})

		// Notifications endpoints — JWT required
		r.Route("/notifications", func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))
			r.Get("/", handler.ListNotifications(pool))
			r.Post("/", handler.SendNotification(pool))
			r.Put("/{id}/read", handler.MarkNotificationRead(pool))
		})

		// Subscriptions endpoints — JWT required
		subHandler := handler.NewSubscriptionHandler(pool)
		r.Route("/subscriptions", func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))
			r.Get("/tiers", subHandler.ListTiers) // any authenticated user
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("merchant", "admin"))
				r.Get("/", subHandler.ListSubscriptions)
				r.Post("/", subHandler.CreateSubscription)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", subHandler.GetSubscription)
					r.Put("/status", subHandler.UpdateSubscriptionStatus)
					r.Post("/pay", subHandler.ProcessPayment)
				})
			})
		})

		// Referrals endpoints — JWT required
		refHandler := handler.NewReferralHandler(pool)
		r.Route("/referrals", func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))
			r.Get("/", refHandler.ListReferrals)
			r.Post("/", refHandler.CreateReferral)
			r.Get("/stats", refHandler.GetStats)
			r.Get("/{id}", refHandler.GetReferral)
		})

		// Cron endpoints — cron secret required (no JWT)
		r.Route("/cron", func(r chi.Router) {
			r.Use(middleware.RequireCronSecret(cfg.CronSecret))
			r.Post("/generate-invoices", handler.GenerateInvoices(pool))
			r.Post("/overdue-escalation", handler.OverdueEscalation(pool))
			r.Post("/payment-plan-check", handler.PaymentPlanCheck(pool))
			r.Post("/payment-reminder", handler.PaymentReminder(pool))
			r.Post("/referral-commissions", refHandler.CronProcessCommissions)
			r.Post("/referral-reward", refHandler.CronProcessRewards)
			r.Post("/vendor-order-referral", refHandler.CronProcessVendorOrderReferrals)
			r.Post("/subscription-billing", subHandler.CronBilling)
			r.Post("/subscription-renewal", subHandler.CronRenewal)
			r.Post("/subscription-grace-check", subHandler.CronGraceCheck)
		})
	})

	// ── Webhook endpoints (no auth — validated by token in handler) ────────────
	r.Post("/v1/webhooks/xendit", handler.XenditPaymentWebhook(pool, cfg.XenditWebhookToken))
	r.Post("/v1/webhooks/xendit/disbursement", handler.XenditDisbursementWebhook(pool, cfg.XenditWebhookToken))
	r.Post("/v1/webhooks/auth", handler.AuthWebhook(cfg.WebhookSecret))

	return r
}
