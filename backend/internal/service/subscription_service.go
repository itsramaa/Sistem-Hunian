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

// ListSubscriptions returns all subscriptions (admin-scoped).
func (s *SubscriptionService) ListSubscriptions(ctx context.Context) ([]model.Subscription, error) {
	subs, err := s.repo.ListSubscriptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("subscription_service: list: %w", err)
	}
	if subs == nil {
		subs = []model.Subscription{}
	}
	return subs, nil
}

// GetSubscription returns a single subscription by ID.
func (s *SubscriptionService) GetSubscription(ctx context.Context, id string) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	sub, err := s.repo.GetSubscription(ctx, id)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: get: %w", err)
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
func (s *SubscriptionService) ProcessPayment(ctx context.Context, req model.SubscriptionPaymentRequest) (*model.Subscription, error) {
	if req.SubscriptionID == "" {
		return nil, errors.New("subscription_service: subscription_id is required")
	}
	if req.Amount <= 0 {
		return nil, errors.New("subscription_service: amount must be positive")
	}
	if req.PaymentMethod == "" {
		return nil, errors.New("subscription_service: payment_method is required")
	}

	sub, err := s.repo.ProcessPayment(ctx, req)
	if err != nil {
		if isSubscriptionNotFound(err) {
			return nil, fmt.Errorf("subscription_service: subscription not found")
		}
		return nil, fmt.Errorf("subscription_service: process payment: %w", err)
	}
	return sub, nil
}

// RunBillingCycle generates invoices for subscriptions due for renewal.
// Returns the count of invoices created.
func (s *SubscriptionService) RunBillingCycle(ctx context.Context) (int, error) {
	count, err := s.repo.RunBillingCycle(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: billing cycle: %w", err)
	}
	return count, nil
}

// RunRenewal processes paid subscriptions and extends their billing period.
// Returns the count of subscriptions renewed.
func (s *SubscriptionService) RunRenewal(ctx context.Context) (int, error) {
	count, err := s.repo.RunRenewal(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: renewal: %w", err)
	}
	return count, nil
}

// RunGraceCheck transitions overdue subscriptions to grace_period or expired.
// Returns the count of subscriptions updated.
func (s *SubscriptionService) RunGraceCheck(ctx context.Context) (int, error) {
	count, err := s.repo.RunGraceCheck(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: grace check: %w", err)
	}
	return count, nil
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
