package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTAccessTTL       time.Duration
	JWTRefreshTTL      time.Duration
	SupabaseURL        string
	ServiceRoleKey     string
	XenditSecretKey    string
	XenditWebhookToken string
	ResendAPIKey       string
	CronSecret         string
	AdminSecret        string
	WebhookSecret      string
	AllowedOrigins     []string
	AppEnv             string

	// Redis
	RedisURL string

	// MinIO
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioUseTLS    bool
	MinioBucket    string

	// RabbitMQ
	RabbitMQURL string
}

// Load reads configuration from environment variables.
// A .env file is loaded if present; missing .env is not an error (production uses real env vars).
func Load() (*Config, error) {
	_ = godotenv.Load() // ignore error — .env is optional in prod

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		JWTSecret:          getEnv("JWT_SECRET", getEnv("SUPABASE_JWT_SECRET", "")), // empty = dev bypass
		JWTAccessTTL:       parseDuration(getEnv("JWT_ACCESS_TTL", "15m")),
		JWTRefreshTTL:      parseDuration(getEnv("JWT_REFRESH_TTL", "168h")),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		ServiceRoleKey:     getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		XenditSecretKey:    getEnv("XENDIT_SECRET_KEY", ""),
		XenditWebhookToken: getEnv("XENDIT_WEBHOOK_TOKEN", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		CronSecret:         getEnv("CRON_SECRET", ""),
		AdminSecret:        getEnv("ADMIN_SECRET", ""),
		WebhookSecret:      getEnv("WEBHOOK_SECRET", ""),
		AllowedOrigins:     splitComma(getEnv("ALLOWED_ORIGINS", "http://localhost:5173")),
		AppEnv:             getEnv("APP_ENV", "development"),

		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		// MinIO
		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin123"),
		MinioUseTLS:    getEnv("MINIO_USE_TLS", "false") == "true",
		MinioBucket:    getEnv("MINIO_BUCKET", "sihuni"),

		// RabbitMQ
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://sihuni:sihuni123@localhost:5672/"),
	}
	return cfg, nil
}

// IsDevelopment returns true when running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required env var %s is not set", key))
	}
	return v
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute // safe default
	}
	return d
}

func splitComma(s string) []string {
	var result []string
	for _, part := range strings.Split(s, ",") {
		if t := strings.TrimSpace(part); t != "" {
			result = append(result, t)
		}
	}
	return result
}
