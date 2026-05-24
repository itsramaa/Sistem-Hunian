package middleware

import (
	"net/http"
	"sync"
	"time"
)

// ipBucket tracks request counts per IP.
type ipBucket struct {
	count    int
	resetAt  time.Time
	mu       sync.Mutex
}

var (
	buckets   = make(map[string]*ipBucket)
	bucketsMu sync.Mutex
)

// RateLimit returns middleware that limits requests per IP.
// limit: max requests per window. window: time window duration.
func RateLimit(limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			bucketsMu.Lock()
			b, ok := buckets[ip]
			if !ok {
				b = &ipBucket{resetAt: time.Now().Add(window)}
				buckets[ip] = b
			}
			bucketsMu.Unlock()

			b.mu.Lock()
			if time.Now().After(b.resetAt) {
				b.count = 0
				b.resetAt = time.Now().Add(window)
			}
			b.count++
			count := b.count
			b.mu.Unlock()

			if count > limit {
				http.Error(w, `{"data":null,"error":{"code":"RATE_LIMITED","message":"too many requests","status":429}}`, http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
