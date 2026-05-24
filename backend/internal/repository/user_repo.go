package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// UserRepo handles database operations for the users table.
type UserRepo struct {
	pool *pgxpool.Pool
}

// NewUserRepo creates a new UserRepo.
func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

// CreateUser inserts a new user record and returns the created user.
func (r *UserRepo) CreateUser(ctx context.Context, email, passwordHash, role, fullName, phoneNumber string) (*model.User, error) {
	u := &model.User{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, role, full_name, phone_number, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, email, password_hash, role,
		          COALESCE(full_name, ''), COALESCE(phone_number, ''),
		          created_at, updated_at
	`, email, passwordHash, role, nullableStr(fullName), nullableStr(phoneNumber)).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &u.PhoneNumber, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("CreateUser: %w", err)
	}
	return u, nil
}

// GetUserByEmail retrieves a user by email address.
func (r *UserRepo) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	u := &model.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, role,
		       COALESCE(full_name, ''), COALESCE(phone_number, ''),
		       created_at, updated_at
		FROM users
		WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &u.PhoneNumber, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("GetUserByEmail: %w", err)
	}
	return u, nil
}

// GetUserByID retrieves a user by UUID.
func (r *UserRepo) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	u := &model.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, role,
		       COALESCE(full_name, ''), COALESCE(phone_number, ''),
		       created_at, updated_at
		FROM users
		WHERE id = $1
	`, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &u.PhoneNumber, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("GetUserByID: %w", err)
	}
	return u, nil
}

// nullableStr converts an empty string to nil so Postgres stores NULL instead of "".
func nullableStr(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
