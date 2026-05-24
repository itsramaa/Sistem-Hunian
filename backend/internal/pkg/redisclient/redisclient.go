package redisclient

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// New parses redisURL, creates a Redis client, pings to verify connectivity, and returns it.
func New(redisURL string) (*redis.Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("redisclient: parse URL: %w", err)
	}
	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redisclient: ping: %w", err)
	}
	return client, nil
}
