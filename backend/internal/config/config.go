package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	SupabaseURL        string
	ServiceRoleKey     string
	XenditSecretKey    string
	XenditWebhookToken string
	ResendAPIKey       string
	CronSecret         string
	AdminSecret        string
	AllowedOrigins     []string
	AppEnv             string
}

// Load reads configuration from environment variables.
// A .env file is loaded if present; missing .env is not an error (production uses real env vars).
func Load() (*Config, error) {
	_ = godotenv.Load() // ignore error — .env is optional in prod

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		JWTSecret:          requireEnv("SUPABASE_JWT_SECRET"),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		ServiceRoleKey:     getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		XenditSecretKey:    getEnv("XENDIT_SECRET_KEY", ""),
		XenditWebhookToken: getEnv("XENDIT_WEBHOOK_TOKEN", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		CronSecret:         getEnv("CRON_SECRET", ""),
		AdminSecret:        getEnv("ADMIN_SECRET", ""),
		AllowedOrigins:     splitComma(getEnv("ALLOWED_ORIGINS", "http://localhost:5173")),
		AppEnv:             getEnv("APP_ENV", "development"),
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

func splitComma(s string) []string {
	var result []string
	for _, part := range strings.Split(s, ",") {
		if t := strings.TrimSpace(part); t != "" {
			result = append(result, t)
		}
	}
	return result
}
