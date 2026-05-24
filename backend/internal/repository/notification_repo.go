package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ListNotifications returns all notifications for a given user, ordered by created_at DESC.
func ListNotifications(ctx context.Context, pool *pgxpool.Pool, userID string) ([]model.Notification, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, user_id, COALESCE(merchant_id, ''), type, title, message, is_read, created_at, read_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("notification_repo: list notifications: %w", err)
	}
	defer rows.Close()

	var notifications []model.Notification
	for rows.Next() {
		var n model.Notification
		if err := rows.Scan(
			&n.ID, &n.UserID, &n.MerchantID, &n.Type,
			&n.Title, &n.Message, &n.IsRead, &n.CreatedAt, &n.ReadAt,
		); err != nil {
			return nil, fmt.Errorf("notification_repo: scan notification: %w", err)
		}
		notifications = append(notifications, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("notification_repo: notification rows: %w", err)
	}
	return notifications, nil
}

// MarkRead marks a notification as read for the given user.
func MarkRead(ctx context.Context, pool *pgxpool.Pool, id, userID string) error {
	tag, err := pool.Exec(ctx, `
		UPDATE notifications
		SET is_read = true, read_at = NOW()
		WHERE id = $1 AND user_id = $2
	`, id, userID)
	if err != nil {
		return fmt.Errorf("notification_repo: mark read: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("notification_repo: mark read: no rows updated")
	}
	return nil
}

// CreateNotification inserts a new notification record into the database.
func CreateNotification(ctx context.Context, pool *pgxpool.Pool, n *model.Notification) error {
	var merchantID *string
	if n.MerchantID != "" {
		merchantID = &n.MerchantID
	}

	err := pool.QueryRow(ctx, `
		INSERT INTO notifications (user_id, merchant_id, type, title, message, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, false, NOW())
		RETURNING id, created_at
	`, n.UserID, merchantID, n.Type, n.Title, n.Message).Scan(&n.ID, &n.CreatedAt)
	if err != nil {
		return fmt.Errorf("notification_repo: create notification: %w", err)
	}
	return nil
}

// ListOverdueInvoiceUsers returns user IDs and invoice info for overdue invoices
// that have not yet received a payment_reminder notification today.
type OverdueInvoiceInfo struct {
	UserID        string
	InvoiceID     string
	InvoiceNumber string
	Amount        float64
	DueDate       time.Time
}

// ListOverdueInvoicesForReminder returns overdue invoices for payment reminder cron.
func ListOverdueInvoicesForReminder(ctx context.Context, pool *pgxpool.Pool) ([]OverdueInvoiceInfo, error) {
	rows, err := pool.Query(ctx, `
		SELECT i.tenant_user_id, i.id, i.invoice_number, i.total_amount, i.due_date
		FROM invoices i
		WHERE i.status = 'overdue'
		  AND NOT EXISTS (
		    SELECT 1 FROM notifications n
		    WHERE n.user_id = i.tenant_user_id
		      AND n.type = 'payment_reminder'
		      AND n.created_at::date = CURRENT_DATE
		  )
		ORDER BY i.due_date ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("notification_repo: list overdue invoices: %w", err)
	}
	defer rows.Close()

	var results []OverdueInvoiceInfo
	for rows.Next() {
		var info OverdueInvoiceInfo
		if err := rows.Scan(&info.UserID, &info.InvoiceID, &info.InvoiceNumber, &info.Amount, &info.DueDate); err != nil {
			return nil, fmt.Errorf("notification_repo: scan overdue invoice: %w", err)
		}
		results = append(results, info)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("notification_repo: overdue invoice rows: %w", err)
	}
	return results, nil
}
