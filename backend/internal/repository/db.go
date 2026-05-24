package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgxpool.Pool for use across repositories.
type DB struct {
	Pool *pgxpool.Pool
}

// New creates a new DB wrapper.
func New(pool *pgxpool.Pool) *DB {
	return &DB{Pool: pool}
}

// Connect creates a new pgxpool.Pool from the given DSN.
func Connect(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("repository: connect: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("repository: ping: %w", err)
	}
	return pool, nil
}
