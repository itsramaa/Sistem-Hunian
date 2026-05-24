# SiHuni Go API — Makefile
# Usage: make <target>

BINARY_NAME=sihuni-api
BUILD_DIR=./bin
CMD_PATH=./cmd/api

.PHONY: all dev build test lint clean migrate-up migrate-down migrate-status migrate-create

all: build

## dev: Run the server with live reload (requires air: go install github.com/air-verse/air@latest)
dev:
	@which air > /dev/null 2>&1 || (echo "air not found. Install: go install github.com/air-verse/air@latest" && exit 1)
	air

## build: Compile the binary to ./bin/sihuni-api
build:
	@mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY_NAME) $(CMD_PATH)
	@echo "Built $(BUILD_DIR)/$(BINARY_NAME)"

## run: Build and run the binary directly
run: build
	$(BUILD_DIR)/$(BINARY_NAME)

## test: Run all unit tests with race detector
test:
	go test -race -v ./...

## test-short: Run tests without verbose output
test-short:
	go test ./...

## lint: Run golangci-lint (requires: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
lint:
	@which golangci-lint > /dev/null 2>&1 || (echo "golangci-lint not found. Install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest" && exit 1)
	golangci-lint run ./...

## tidy: Tidy go modules
tidy:
	go mod tidy

## clean: Remove build artifacts
clean:
	rm -rf $(BUILD_DIR)

## docker-up: Start local PostgreSQL via Docker Compose
docker-up:
	docker compose -f ../docker-compose.yml up -d db

## docker-down: Stop local PostgreSQL
docker-down:
	docker compose -f ../docker-compose.yml down

## migrate-up: Apply all pending migrations
migrate-up:
	@which goose > /dev/null 2>&1 || go install github.com/pressly/goose/v3/cmd/goose@latest
	goose -dir ./migrations postgres "$(DATABASE_URL)" up

## migrate-down: Roll back the last migration
migrate-down:
	@which goose > /dev/null 2>&1 || go install github.com/pressly/goose/v3/cmd/goose@latest
	goose -dir ./migrations postgres "$(DATABASE_URL)" down

## migrate-status: Show migration status
migrate-status:
	@which goose > /dev/null 2>&1 || go install github.com/pressly/goose/v3/cmd/goose@latest
	goose -dir ./migrations postgres "$(DATABASE_URL)" status

## migrate-create: Create a new migration file (usage: make migrate-create NAME=create_users)
migrate-create:
	@[ "$(NAME)" ] || (echo "Usage: make migrate-create NAME=<migration_name>" && exit 1)
	@which goose > /dev/null 2>&1 || go install github.com/pressly/goose/v3/cmd/goose@latest
	goose -dir ./migrations create $(NAME) sql

## help: Show this help
help:
	@grep -E '^## ' Makefile | sed 's/## //'
