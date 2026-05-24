package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// SubscriptionService handles business logic for subscriptions.
type SubscriptionService struct {
	repo *repository.SubscriptionRepo
}

// NewSubscriptionService creates a new SubscriptionService.
func NewSubscriptionService(repo *repository.SubscriptionRepo) *SubscriptionService {
	return &SubscriptionService{repo: repo}
}

// ListSubscriptions returns all subscriptions scoped to a merchant.
func (s *SubscriptionService) ListSubscriptions(ctx context.Context, merchantID string) ([]model.Subscription, error) {
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	subs, err := s.repo.ListSubscriptions(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("subscription_service: list: %w", err)
	}
	if subs == nil {
		subs = []model.Subscription{}
	}
	return subs, nil
}

// GetSubscription returns a single subscription by ID scoped to a merchant.
func (s *SubscriptionService) GetSubscription(ctx context.Context, id, merchantID string) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	sub, err := s.repo.GetSubscription(ctx, id, merchantID)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: get: %w", err)
	}
	return sub, nil
}

// CreateSubscription creates a new subscription for a merchant with the given tier.
func (s *SubscriptionService) CreateSubscription(ctx context.Context, merchantID, tierID string) (*model.Subscription, error) {
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	if tierID == "" {
		return nil, errors.New("subscription_service: tier_id is required")
	}
	sub, err := s.repo.CreateSubscription(ctx, merchantID, tierID)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: tier not found or inactive")
		}
		return nil, fmt.Errorf("subscription_service: create: %w", err)
	}
	return sub, nil
}

// UpdateSubscriptionStatus updates the status of a subscription scoped to a merchant.
func (s *SubscriptionService) UpdateSubscriptionStatus(ctx context.Context, id, merchantID, status string) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	validStatuses := map[string]bool{
		"active":       true,
		"grace_period": true,
		"expired":      true,
		"cancelled":    true,
	}
	if !validStatuses[status] {
		return nil, fmt.Errorf("subscription_service: invalid status %q", status)
	}
	sub, err := s.repo.UpdateSubscriptionStatus(ctx, id, merchantID, status)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: update status: %w", err)
	}
	return sub, nil
}

// ListTiers returns all active subscription tiers.
func (s *SubscriptionService) ListTiers(ctx context.Context) ([]model.SubscriptionTier, error) {
	tiers, err := s.repo.ListTiers(ctx)
	if err != nil {
		return nil, fmt.Errorf("subscription_service: list tiers: %w", err)
	}
	if tiers == nil {
		tiers = []model.SubscriptionTier{}
	}
	return tiers, nil
}

// ProcessPayment processes a subscription payment and extends the billing period.
// The subscription is scoped to the given merchantID for security.
func (s *SubscriptionService) ProcessPayment(ctx context.Context, id, merchantID string, req model.SubscriptionPaymentRequest) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	if req.Amount <= 0 {
		return nil, errors.New("subscription_service: amount must be positive")
	}
	if req.PaymentMethod == "" {
		return nil, errors.New("subscription_service: payment_method is required")
	}

	sub, err := s.repo.ProcessPayment(ctx, id, merchantID, req)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: subscription not found")
		}
		return nil, fmt.Errorf("subscription_service: process payment: %w", err)
	}
	return sub, nil
}

// CronBilling generates invoices for subscriptions due for renewal.
// Returns an error if the billing cycle fails.
func (s *SubscriptionService) CronBilling(ctx context.Context) error {
	_, err := s.repo.RunBillingCycle(ctx)
	if err != nil {
		return fmt.Errorf("subscription_service: billing cycle: %w", err)
	}
	return nil
}

// CronRenewal processes paid subscriptions and extends their billing period.
// Returns an error if the renewal cycle fails.
func (s *SubscriptionService) CronRenewal(ctx context.Context) error {
	_, err := s.repo.RunRenewal(ctx)
	if err != nil {
		return fmt.Errorf("subscription_service: renewal: %w", err)
	}
	return nil
}

// CronGraceCheck transitions overdue subscriptions to grace_period or expired.
// Returns an error if the grace check fails.
func (s *SubscriptionService) CronGraceCheck(ctx context.Context) error {
	_, err := s.repo.RunGraceCheck(ctx)
	if err != nil {
		return fmt.Errorf("subscription_service: grace check: %w", err)
	}
	return nil
}

// isSubscriptionNotFound checks if an error indicates a not-found condition.
func isSubscriptionNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
