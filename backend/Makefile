.PHONY: dev build test lint migrate-up migrate-down migrate-status tidy

# Run dev server with hot reload (requires air: go install github.com/air-verse/air@latest)
dev:
	air -c .air.toml

# Build binary
build:
	go build -o bin/api ./cmd/api

# Run tests
test:
	go test ./... -v -race

# Lint (requires golangci-lint)
lint:
	golangci-lint run ./...

# Tidy dependencies
tidy:
	go mod tidy

# Run migrations up
migrate-up:
	go run ./cmd/migrate up

# Roll back last migration
migrate-down:
	go run ./cmd/migrate down

# Show migration status
migrate-status:
	go run ./cmd/migrate status

# Create a new migration file
migrate-create:
	@read -p "Migration name: " name; \
	go run ./cmd/migrate create $${name} sql
