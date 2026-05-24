package config

import (
	"os"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// Auth
	JWTSecret         string
	SupabaseJWTSecret string

	// External services
	ResendAPIKey string
	ResendFrom   string

	// Secrets for internal endpoints
	CronSecret    string
	WebhookSecret string

	// Supabase
	SupabaseURL            string
	SupabaseServiceRoleKey string
}

// Load reads configuration from environment variables.
// Required variables will cause a panic if missing in production.
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: mustGetEnv("DATABASE_URL"),

		JWTSecret:         getEnv("JWT_SECRET", ""),
		SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", ""),

		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		ResendFrom:   getEnv("RESEND_FROM", "SiHuni <noreply@sihuni.id>"),

		CronSecret:    getEnv("CRON_SECRET", ""),
		WebhookSecret: getEnv("WEBHOOK_SECRET", ""),

		SupabaseURL:            getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required environment variable not set: " + key)
	}
	return v
}
