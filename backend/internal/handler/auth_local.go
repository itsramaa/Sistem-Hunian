package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/jwtutil"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// authRequest is the shared request body for register and login.
type authRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	Role        string `json:"role"`      // required for register
	FullName    string `json:"full_name"` // optional for register
	PhoneNumber string `json:"phone_number"`
}

// authResponse is the shared response body for register and login.
type authResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         *model.User `json:"user"`
}

// refreshRequest is the request body for POST /auth/refresh.
type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// authConfig bundles the dependencies needed by local auth handlers.
type authConfig struct {
	repo          *repository.UserRepo
	pool          *pgxpool.Pool
	jwtSecret     string
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

// Register handles POST /v1/auth/register.
// Creates a new user and returns access + refresh tokens.
func Register(pool *pgxpool.Pool, jwtSecret string, accessTTL, refreshTTL time.Duration) http.HandlerFunc {
	repo := repository.NewUserRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req authRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))
		if req.Email == "" || req.Password == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "email and password are required")
			return
		}
		if req.Role == "" {
			req.Role = "tenant"
		}
		validRoles := map[string]bool{"admin": true, "merchant": true, "tenant": true, "vendor": true}
		if !validRoles[req.Role] {
			response.Error(w, http.StatusBadRequest, "INVALID_ROLE", "role must be one of: admin, merchant, tenant, vendor")
			return
		}
		if len(req.Password) < 8 {
			response.Error(w, http.StatusBadRequest, "WEAK_PASSWORD", "password must be at least 8 characters")
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to hash password")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		user, err := repo.CreateUser(ctx, req.Email, string(hash), req.Role, req.FullName, req.PhoneNumber)
		if err != nil {
			if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
				response.Error(w, http.StatusConflict, "EMAIL_TAKEN", "email is already registered")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to create user")
			return
		}

		ac := authConfig{repo: repo, pool: pool, jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL}
		tokens, err := issueTokens(ac, user)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "TOKEN_ERROR", "failed to issue tokens")
			return
		}

		response.JSON(w, http.StatusCreated, tokens)
	}
}

// Login handles POST /v1/auth/login.
// Verifies credentials and returns access + refresh tokens.
func Login(pool *pgxpool.Pool, jwtSecret string, accessTTL, refreshTTL time.Duration) http.HandlerFunc {
	repo := repository.NewUserRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req authRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))
		if req.Email == "" || req.Password == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "email and password are required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		user, err := repo.GetUserByEmail(ctx, req.Email)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) || strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to fetch user")
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
			return
		}

		ac := authConfig{repo: repo, pool: pool, jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL}
		tokens, err := issueTokens(ac, user)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "TOKEN_ERROR", "failed to issue tokens")
			return
		}

		response.JSON(w, http.StatusOK, tokens)
	}
}

// Refresh handles POST /v1/auth/refresh.
// Validates a refresh token and returns a new access token.
func Refresh(pool *pgxpool.Pool, jwtSecret string, accessTTL, refreshTTL time.Duration) http.HandlerFunc {
	repo := repository.NewUserRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req refreshRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}
		if req.RefreshToken == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "refresh_token is required")
			return
		}

		claims, err := jwtutil.ParseToken(req.RefreshToken, jwtSecret)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "INVALID_TOKEN", "invalid or expired refresh token")
			return
		}

		tokenType, _ := claims["type"].(string)
		if tokenType != "refresh" {
			response.Error(w, http.StatusUnauthorized, "INVALID_TOKEN", "not a refresh token")
			return
		}

		userID, _ := claims["sub"].(string)
		if userID == "" {
			response.Error(w, http.StatusUnauthorized, "INVALID_TOKEN", "missing subject claim")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		user, err := repo.GetUserByID(ctx, userID)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "USER_NOT_FOUND", "user no longer exists")
			return
		}

		ac := authConfig{repo: repo, pool: pool, jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL}
		tokens, err := issueTokens(ac, user)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "TOKEN_ERROR", "failed to issue tokens")
			return
		}

		response.JSON(w, http.StatusOK, tokens)
	}
}

// MeLocal handles GET /v1/auth/me for self-signed JWT users.
// Returns the current user's profile from the users table.
func MeLocal(pool *pgxpool.Pool) http.HandlerFunc {
	repo := repository.NewUserRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		user, err := repo.GetUserByID(ctx, claims.UserID)
		if err != nil {
			response.Error(w, http.StatusNotFound, "USER_NOT_FOUND", "user not found")
			return
		}

		response.JSON(w, http.StatusOK, user)
	}
}

// issueTokens generates access and refresh tokens for the given user.
func issueTokens(ac authConfig, user *model.User) (*authResponse, error) {
	// Look up merchant_id from merchants table if user is a merchant
	merchantID := ""
	if user.Role == "merchant" {
		var mid string
		err := ac.pool.QueryRow(context.Background(),
			"SELECT id FROM merchants WHERE user_id = $1 LIMIT 1", user.ID).Scan(&mid)
		if err == nil {
			merchantID = mid
		}
	}

	accessToken, err := jwtutil.GenerateAccessToken(user.ID, user.Email, user.Role, merchantID, ac.jwtSecret, ac.accessTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwtutil.GenerateRefreshToken(user.ID, ac.jwtSecret, ac.refreshTTL)
	if err != nil {
		return nil, err
	}

	return &authResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}
