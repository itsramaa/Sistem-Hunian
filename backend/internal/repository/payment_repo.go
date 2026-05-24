package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// CreatePayment inserts a new payment record and returns it.
func CreatePayment(ctx context.Context, pool *pgxpool.Pool, invoiceID, paymentMethod, xenditID, paymentURL string, amount float64) (*model.Payment, error) {
	var p model.Payment
	err := pool.QueryRow(ctx, `
		INSERT INTO payments (invoice_id, amount, status, payment_method, xendit_id, payment_url)
		VALUES ($1, $2, 'pending', $3, $4, $5)
		RETURNING id, invoice_id, amount, status, payment_method, xendit_id, payment_url, created_at, updated_at
	`, invoiceID, amount, paymentMethod, xenditID, paymentURL).Scan(
		&p.ID, &p.InvoiceID, &p.Amount, &p.Status,
		&p.PaymentMethod, &p.XenditID, &p.PaymentURL,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("payment_repo: create payment: %w", err)
	}
	return &p, nil
}

// GetPaymentByXenditID returns a payment by its Xendit ID.
func GetPaymentByXenditID(ctx context.Context, pool *pgxpool.Pool, xenditID string) (*model.Payment, error) {
	var p model.Payment
	err := pool.QueryRow(ctx, `
		SELECT id, invoice_id, amount, status, payment_method, xendit_id, payment_url, created_at, updated_at
		FROM payments
		WHERE xendit_id = $1
	`, xenditID).Scan(
		&p.ID, &p.InvoiceID, &p.Amount, &p.Status,
		&p.PaymentMethod, &p.XenditID, &p.PaymentURL,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("payment_repo: get by xendit id: %w", err)
	}
	return &p, nil
}

// UpdatePaymentStatus updates the status of a payment by Xendit ID.
func UpdatePaymentStatus(ctx context.Context, pool *pgxpool.Pool, xenditID, status string) error {
	result, err := pool.Exec(ctx, `
		UPDATE payments
		SET status = $1, updated_at = NOW()
		WHERE xendit_id = $2
	`, status, xenditID)
	if err != nil {
		return fmt.Errorf("payment_repo: update payment status: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("payment_repo: payment not found for xendit_id=%s", xenditID)
	}
	return nil
}
