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
	contractH := handler.NewContractHandler(
		service.NewContractService(repository.NewContractRepo(db)),
	)
	subH := handler.NewSubscriptionHandler(db)
	referralH := handler.NewReferralHandler(db)
	contractH := handler.NewContractHandler(
		service.NewContractService(repository.NewContractRepo(db)),
	)
	subH := handler.NewSubscriptionHandler(
		service.NewSubscriptionService(repository.NewSubscriptionRepo(db)),
	)
	referralH := handler.NewReferralHandler(
		service.NewReferralService(repository.NewReferralRepo(db)),
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

	// Contracts (JWT + merchant role)
	mux.Handle("GET /v1/contracts",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ListContracts))),
	)
	mux.Handle("GET /v1/contracts/move-outs",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ListMoveOuts))),
	)
	mux.Handle("GET /v1/contracts/move-outs/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.GetMoveOut))),
	)
	mux.Handle("PUT /v1/contracts/move-outs/{id}/status",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.UpdateMoveOutStatus))),
	)
	mux.Handle("GET /v1/contracts/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.GetContract))),
	)
	mux.Handle("POST /v1/contracts/{id}/deposit-refund",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ProcessDepositRefund))),
	)

	// Subscriptions (JWT required; tiers public to any authenticated user)
	mux.Handle("GET /v1/subscriptions/tiers",
		requireAuth(http.HandlerFunc(subH.ListTiers)),
	)
	mux.Handle("GET /v1/subscriptions",
		requireAuth(requireMerchant(http.HandlerFunc(subH.ListSubscriptions))),
	)
	mux.Handle("POST /v1/subscriptions",
		requireAuth(requireMerchant(http.HandlerFunc(subH.CreateSubscription))),
	)
	mux.Handle("GET /v1/subscriptions/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(subH.GetSubscription))),
	)
	mux.Handle("PUT /v1/subscriptions/{id}/status",
		requireAuth(requireMerchant(http.HandlerFunc(subH.UpdateSubscriptionStatus))),
	)
	mux.Handle("POST /v1/subscriptions/{id}/pay",
		requireAuth(requireMerchant(http.HandlerFunc(subH.ProcessPayment))),
	)

	// Referrals (JWT required)
	mux.Handle("GET /v1/referrals",
		requireAuth(http.HandlerFunc(referralH.ListReferrals)),
	)
	mux.Handle("GET /v1/referrals/stats",
		requireAuth(http.HandlerFunc(referralH.GetReferralStats)),
	)
	mux.Handle("POST /v1/referrals/reward",
		requireAuth(http.HandlerFunc(referralH.ProcessReferralReward)),
	)
	mux.Handle("POST /v1/referrals/vendor-order",
		requireAuth(http.HandlerFunc(referralH.ProcessVendorOrderReferral)),
	)

	// Cron additions
	mux.Handle("POST /v1/cron/subscription-billing",
		requireCron(http.HandlerFunc(subH.CronBilling)),
	)
	mux.Handle("POST /v1/cron/subscription-renewal",
		requireCron(http.HandlerFunc(subH.CronRenewal)),
	)
	mux.Handle("POST /v1/cron/subscription-grace-check",
		requireCron(http.HandlerFunc(subH.CronGraceCheck)),
	)
	mux.Handle("POST /v1/cron/referral-commissions",
		requireCron(http.HandlerFunc(referralH.CronReferralCommissions)),
	)

	// Contracts (JWT + merchant/admin)
	mux.Handle("GET /v1/contracts",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ListContracts))),
	)
	mux.Handle("GET /v1/contracts/move-outs",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ListMoveOuts))),
	)
	mux.Handle("GET /v1/contracts/move-outs/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.GetMoveOut))),
	)
	mux.Handle("PUT /v1/contracts/move-outs/{id}/status",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.UpdateMoveOutStatus))),
	)
	mux.Handle("GET /v1/contracts/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.GetContract))),
	)
	mux.Handle("POST /v1/contracts/{id}/deposit-refund",
		requireAuth(requireMerchant(http.HandlerFunc(contractH.ProcessDepositRefund))),
	)

	// Subscriptions
	mux.Handle("GET /v1/subscriptions/tiers",
		requireAuth(http.HandlerFunc(subH.ListTiers)),
	)
	mux.Handle("GET /v1/subscriptions",
		requireAuth(requireMerchant(http.HandlerFunc(subH.ListSubscriptions))),
	)
	mux.Handle("POST /v1/subscriptions",
		requireAuth(requireMerchant(http.HandlerFunc(subH.CreateSubscription))),
	)
	mux.Handle("GET /v1/subscriptions/{id}",
		requireAuth(requireMerchant(http.HandlerFunc(subH.GetSubscription))),
	)
	mux.Handle("PUT /v1/subscriptions/{id}/status",
		requireAuth(requireMerchant(http.HandlerFunc(subH.UpdateSubscriptionStatus))),
	)
	mux.Handle("POST /v1/subscriptions/{id}/pay",
		requireAuth(requireMerchant(http.HandlerFunc(subH.ProcessPayment))),
	)

	// Referrals (JWT required)
	mux.Handle("GET /v1/referrals",
		requireAuth(http.HandlerFunc(referralH.ListReferrals)),
	)
	mux.Handle("GET /v1/referrals/stats",
		requireAuth(http.HandlerFunc(referralH.GetReferralStats)),
	)
	mux.Handle("POST /v1/referrals/reward",
		requireAuth(http.HandlerFunc(referralH.ProcessReferralReward)),
	)
	mux.Handle("POST /v1/referrals/vendor-order",
		requireAuth(http.HandlerFunc(referralH.ProcessVendorOrderReferral)),
	)

	// Cron: subscription lifecycle
	mux.Handle("POST /v1/cron/subscription-billing",
		requireCron(http.HandlerFunc(subH.CronBilling)),
	)
	mux.Handle("POST /v1/cron/subscription-renewal",
		requireCron(http.HandlerFunc(subH.CronRenewal)),
	)
	mux.Handle("POST /v1/cron/subscription-grace-check",
		requireCron(http.HandlerFunc(subH.CronGraceCheck)),
	)

	// Cron: referral commissions
	mux.Handle("POST /v1/cron/referral-commissions",
		requireCron(http.HandlerFunc(referralH.CronReferralCommissions)),
	)

	// --- Global middleware stack ---
	var h http.Handler = mux
	h = middleware.Logger(h)
	h = middleware.CORS(nil)(h)
	h = middleware.RateLimit(100, time.Minute)(h)

	return h
}
