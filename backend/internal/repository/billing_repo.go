package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ListInvoices returns invoices filtered by merchantID and/or tenantUserID.
// At least one of merchantID or tenantUserID must be non-empty.
func ListInvoices(ctx context.Context, pool *pgxpool.Pool, merchantID, tenantUserID, status string) ([]model.Invoice, error) {
	clauses := []string{}
	args := []any{}
	idx := 1

	if merchantID != "" {
		clauses = append(clauses, fmt.Sprintf("merchant_id = $%d", idx))
		args = append(args, merchantID)
		idx++
	}
	if tenantUserID != "" {
		clauses = append(clauses, fmt.Sprintf("tenant_user_id = $%d", idx))
		args = append(args, tenantUserID)
		idx++
	}
	if status != "" {
		clauses = append(clauses, fmt.Sprintf("status = $%d", idx))
		args = append(args, status)
		idx++
	}

	query := `
		SELECT id, invoice_number, merchant_id, tenant_user_id,
		       amount, total_amount, late_fee, status,
		       due_date, paid_at, description, created_at, updated_at
		FROM invoices`
	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}
	query += " ORDER BY created_at DESC"

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: list invoices: %w", err)
	}
	defer rows.Close()

	var invoices []model.Invoice
	for rows.Next() {
		var inv model.Invoice
		if err := rows.Scan(
			&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
			&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
			&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("billing_repo: scan invoice: %w", err)
		}
		invoices = append(invoices, inv)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("billing_repo: invoice rows: %w", err)
	}
	return invoices, nil
}

// GetInvoiceByMerchant returns a single invoice by ID scoped to a merchant.
func GetInvoiceByMerchant(ctx context.Context, pool *pgxpool.Pool, id, merchantID string) (*model.Invoice, error) {
	var inv model.Invoice
	err := pool.QueryRow(ctx, `
		SELECT id, invoice_number, merchant_id, tenant_user_id,
		       amount, total_amount, late_fee, status,
		       due_date, paid_at, description, created_at, updated_at
		FROM invoices
		WHERE id = $1 AND merchant_id = $2
	`, id, merchantID).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
		&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
		&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: get invoice by merchant: %w", err)
	}
	return &inv, nil
}

// GetInvoiceByTenant returns a single invoice by ID scoped to a tenant user.
func GetInvoiceByTenant(ctx context.Context, pool *pgxpool.Pool, id, tenantUserID string) (*model.Invoice, error) {
	var inv model.Invoice
	err := pool.QueryRow(ctx, `
		SELECT id, invoice_number, merchant_id, tenant_user_id,
		       amount, total_amount, late_fee, status,
		       due_date, paid_at, description, created_at, updated_at
		FROM invoices
		WHERE id = $1 AND tenant_user_id = $2
	`, id, tenantUserID).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
		&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
		&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: get invoice by tenant: %w", err)
	}
	return &inv, nil
}

// GetInvoiceByID returns a single invoice by ID (no scope — used internally).
func GetInvoiceByID(ctx context.Context, pool *pgxpool.Pool, id string) (*model.Invoice, error) {
	var inv model.Invoice
	err := pool.QueryRow(ctx, `
		SELECT id, invoice_number, merchant_id, tenant_user_id,
		       amount, total_amount, late_fee, status,
		       due_date, paid_at, description, created_at, updated_at
		FROM invoices
		WHERE id = $1
	`, id).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
		&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
		&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: get invoice by id: %w", err)
	}
	return &inv, nil
}

// CreateInvoice inserts a new invoice and returns it.
func CreateInvoice(ctx context.Context, pool *pgxpool.Pool, merchantID, tenantUserID, description string, amount float64, dueDate time.Time) (*model.Invoice, error) {
	var inv model.Invoice
	err := pool.QueryRow(ctx, `
		INSERT INTO invoices (
			merchant_id, tenant_user_id, amount, total_amount, late_fee,
			status, due_date, description
		) VALUES ($1, $2, $3, $3, 0, 'pending', $4, $5)
		RETURNING id, invoice_number, merchant_id, tenant_user_id,
		          amount, total_amount, late_fee, status,
		          due_date, paid_at, description, created_at, updated_at
	`, merchantID, tenantUserID, amount, dueDate, description).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
		&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
		&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: create invoice: %w", err)
	}
	return &inv, nil
}

// UpdateInvoiceStatus updates the status of an invoice scoped to merchantID.
func UpdateInvoiceStatus(ctx context.Context, pool *pgxpool.Pool, id, merchantID, status string) (*model.Invoice, error) {
	var paidAt *time.Time
	if status == "paid" {
		now := time.Now()
		paidAt = &now
	}

	var inv model.Invoice
	err := pool.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1,
		    paid_at = CASE WHEN $1 = 'paid' THEN $2 ELSE paid_at END,
		    updated_at = NOW()
		WHERE id = $3 AND merchant_id = $4
		RETURNING id, invoice_number, merchant_id, tenant_user_id,
		          amount, total_amount, late_fee, status,
		          due_date, paid_at, description, created_at, updated_at
	`, status, paidAt, id, merchantID).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.MerchantID, &inv.TenantUserID,
		&inv.Amount, &inv.TotalAmount, &inv.LateFee, &inv.Status,
		&inv.DueDate, &inv.PaidAt, &inv.Description, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("billing_repo: update invoice status: %w", err)
	}
	return &inv, nil
}

// MarkInvoicePaid marks an invoice as paid (used by webhook handler).
func MarkInvoicePaid(ctx context.Context, pool *pgxpool.Pool, invoiceID string) error {
	_, err := pool.Exec(ctx, `
		UPDATE invoices
		SET status = 'paid', paid_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status != 'paid'
	`, invoiceID)
	if err != nil {
		return fmt.Errorf("billing_repo: mark invoice paid: %w", err)
	}
	return nil
}

// GenerateMonthlyInvoices creates invoices for all active tenancy agreements
// that don't already have an invoice for the current month.
// Returns the count of created invoices.
func GenerateMonthlyInvoices(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	result, err := pool.Exec(ctx, `
		INSERT INTO invoices (merchant_id, tenant_user_id, amount, total_amount, late_fee, status, due_date, description)
		SELECT
			p.merchant_id,
			ta.tenant_user_id,
			u.rent_amount,
			u.rent_amount,
			0,
			'pending',
			DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
			'Monthly rent for ' || TO_CHAR(NOW(), 'Month YYYY')
		FROM tenancy_agreements ta
		JOIN units u ON u.id = ta.unit_id
		JOIN properties p ON p.id = u.property_id
		WHERE ta.status = 'active'
		  AND NOT EXISTS (
			SELECT 1 FROM invoices i
			WHERE i.tenant_user_id = ta.tenant_user_id
			  AND i.merchant_id = p.merchant_id
			  AND DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', NOW())
		  )
	`)
	if err != nil {
		return 0, fmt.Errorf("billing_repo: generate monthly invoices: %w", err)
	}
	return int(result.RowsAffected()), nil
}

// MarkOverdueInvoices marks pending/sent invoices past their due date as overdue
// and applies a late fee. Returns the count of updated invoices.
func MarkOverdueInvoices(ctx context.Context, pool *pgxpool.Pool, lateFeePercent float64) (int, error) {
	result, err := pool.Exec(ctx, `
		UPDATE invoices
		SET
			status = 'overdue',
			late_fee = amount * $1,
			total_amount = amount + (amount * $1),
			updated_at = NOW()
		WHERE status IN ('pending', 'sent')
		  AND due_date < NOW()
	`, lateFeePercent)
	if err != nil {
		return 0, fmt.Errorf("billing_repo: mark overdue: %w", err)
	}
	return int(result.RowsAffected()), nil
}

// CheckPaymentPlanInstallments creates invoices for due payment plan installments.
// Returns the count of processed installments.
func CheckPaymentPlanInstallments(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	result, err := pool.Exec(ctx, `
		INSERT INTO invoices (merchant_id, tenant_user_id, amount, total_amount, late_fee, status, due_date, description)
		SELECT
			pp.merchant_id,
			pp.tenant_user_id,
			ppi.amount,
			ppi.amount,
			0,
			'pending',
			ppi.due_date,
			'Payment plan installment #' || ppi.installment_number
		FROM payment_plan_installments ppi
		JOIN payment_plans pp ON pp.id = ppi.payment_plan_id
		WHERE ppi.status = 'pending'
		  AND ppi.due_date <= NOW()
		  AND NOT EXISTS (
			SELECT 1 FROM invoices i
			WHERE i.description = 'Payment plan installment #' || ppi.installment_number
			  AND i.tenant_user_id = pp.tenant_user_id
		  )
	`)
	if err != nil {
		return 0, fmt.Errorf("billing_repo: check payment plan installments: %w", err)
	}
	return int(result.RowsAffected()), nil
}

// GetMerchantIDByUserID looks up the merchant_id for a given user_id.
func GetMerchantIDByUserID(ctx context.Context, pool *pgxpool.Pool, userID string) (string, error) {
	var merchantID string
	err := pool.QueryRow(ctx, `
		SELECT id FROM merchants WHERE user_id = $1
	`, userID).Scan(&merchantID)
	if err != nil {
		return "", fmt.Errorf("billing_repo: get merchant id: %w", err)
	}
	return merchantID, nil
}
