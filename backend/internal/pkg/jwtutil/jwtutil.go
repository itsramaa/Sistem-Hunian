package jwtutil

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateAccessToken creates a signed HS256 access token.
// Claims: sub=userID, email, role, app_metadata.merchant_id (if non-empty).
func GenerateAccessToken(userID, email, role, merchantID, secret string, ttl time.Duration) (string, error) {
	now := time.Now()
	appMeta := map[string]interface{}{
		"role": role,
	}
	if merchantID != "" {
		appMeta["merchant_id"] = merchantID
	}

	claims := jwt.MapClaims{
		"sub":          userID,
		"email":        email,
		"role":         role,
		"app_metadata": appMeta,
		"iat":          now.Unix(),
		"exp":          now.Add(ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("GenerateAccessToken: %w", err)
	}
	return signed, nil
}

// GenerateRefreshToken creates a minimal signed HS256 refresh token.
// Claims: sub=userID, type=refresh.
func GenerateRefreshToken(userID, secret string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  userID,
		"type": "refresh",
		"iat":  now.Unix(),
		"exp":  now.Add(ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("GenerateRefreshToken: %w", err)
	}
	return signed, nil
}

// ParseToken validates and parses a JWT string, returning its MapClaims.
func ParseToken(tokenStr, secret string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("ParseToken: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("ParseToken: token is invalid")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("ParseToken: unexpected claims type")
	}
	return claims, nil
}
