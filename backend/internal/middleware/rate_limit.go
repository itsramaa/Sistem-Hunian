package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// rateLimiter is a simple in-memory token bucket rate limiter keyed by IP address.
type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	rate     int           // requests allowed per window
	window   time.Duration // time window
	cleanupInterval time.Duration
}

type bucket struct {
	count    int
	resetAt  time.Time
}

// RateLimit returns a per-IP rate limiting middleware.
// rate is the maximum number of requests allowed per window duration.
// Example: RateLimit(100, time.Minute) allows 100 req/min per IP.
func RateLimit(rate int, window time.Duration) func(http.Handler) http.Handler {
	rl := &rateLimiter{
		buckets:         make(map[string]*bucket),
		rate:            rate,
		window:          window,
		cleanupInterval: 5 * time.Minute,
	}

	// Background goroutine to clean up expired buckets
	go func() {
		ticker := time.NewTicker(rl.cleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			rl.cleanup()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			if !rl.allow(ip) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", window.Seconds()))
				w.WriteHeader(http.StatusTooManyRequests)
				fmt.Fprint(w, `{"data":null,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"too many requests","status":429}}`)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	b, exists := rl.buckets[ip]
	if !exists || now.After(b.resetAt) {
		rl.buckets[ip] = &bucket{count: 1, resetAt: now.Add(rl.window)}
		return true
	}
	if b.count >= rl.rate {
		return false
	}
	b.count++
	return true
}

func (rl *rateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	for ip, b := range rl.buckets {
		if now.After(b.resetAt) {
			delete(rl.buckets, ip)
		}
	}
}

// extractIP returns the client IP from X-Forwarded-For or RemoteAddr.
func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the chain (original client)
		for i, c := range xff {
			if c == ',' {
				return xff[:i]
			}
		}
		return xff
	}
	// Strip port from RemoteAddr
	addr := r.RemoteAddr
	for i := len(addr) - 1; i >= 0; i-- {
		if addr[i] == ':' {
			return addr[:i]
		}
	}
	return addr
}
