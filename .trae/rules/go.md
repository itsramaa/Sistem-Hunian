---
alwaysApply: false
description: Go backend implementation guidance covering Fiber, GORM, concurrency, error handling, and security. Use when writing, reviewing, or debugging Go code, building API handlers, working with PostgreSQL/Redis, or designing concurrent systems.
---

# Go Implementer

## Use This When

- writing or reviewing Go backend code
- building Fiber HTTP handlers, middleware, or services
- working with GORM, PostgreSQL, or Redis in Go
- debugging goroutine leaks, panics, or concurrency issues

## Default Stack

| Layer | Preferred tools |
| ----- | --------------- |
| Language | Go 1.22+ |
| HTTP framework | Fiber v2 |
| ORM | GORM |
| Database | PostgreSQL |
| Cache | Redis (go-redis) |
| Auth | JWT + HTTP-only cookies |
| Validation | go-playground/validator |
| Config | godotenv + os.Getenv (or viper) |
| Migrations | golang-migrate or GORM AutoMigrate (dev only) |
| Testing | testing + testify |
| Mocking | mockery or gomock |
| API docs | swaggo/swag |

## Project Structure

```
cmd/
  server/
    main.go
internal/
  config/
  handler/
  middleware/
  model/
  repository/
  service/
  router/
pkg/           # shared utilities
migrations/
docs/          # swagger output
```

## Operating Rules

- keep `main.go` minimal — wire dependencies, start server, handle graceful shutdown
- use constructor injection for dependencies — never global state or `init()` side effects
- validate all external input at the handler boundary using struct tags + validator
- use parameterized queries or GORM methods only — no raw string interpolation in SQL
- never store Fiber ctx in structs or goroutines — extract values before passing async
- keep secrets in env vars only; never hardcode tokens, passwords, or keys
- return explicit errors — never swallow with `_`
- use `context.Context` for cancellation in all DB, HTTP, and long-running calls

## Error Handling

- define domain errors as typed sentinel values or custom error types
- wrap errors with `fmt.Errorf("context: %w", err)` for stack traceability
- map domain errors to HTTP status codes in the handler layer, not in service/repo
- log errors at the point of origin with enough context to reproduce

## Concurrency Rules

- never start a goroutine without a clear exit condition
- use `sync.WaitGroup` for fan-out; use channels for pipeline stages
- protect shared mutable state with `sync.Mutex` or `sync.RWMutex`
- use `errgroup.Group` for concurrent work that must all succeed or fail together
- always pass `ctx` to goroutines that do I/O; respect `ctx.Done()`

## GORM Rules

- use explicit `Select` to avoid over-fetching columns
- use `Preload` carefully — verify no N+1 queries with query logging
- always set `gorm:"not null"` and appropriate constraints in model tags
- run AutoMigrate only in dev/test; use versioned migrations for prod
- use transactions for multi-step mutations: `db.Transaction(func(tx *gorm.DB) error { ... })`

## Testing Rules

- unit-test service logic with mocked repositories (mockery)
- integration-test repositories against a real test database
- use `testify/assert` and `testify/require` — `require` for fatal assertions
- table-driven tests for input/output variations
- test HTTP handlers with `net/http/httptest` or Fiber's `app.Test()`

## Relevant Skills

**Core Go:**

| Skill | When to use |
| ----- | ----------- |
| `go` | collections, interfaces, concurrency, error patterns |
| `go-security-vulnerability` | CVE patterns, secure coding in Go |
| `systematic-debugging` | root-cause debugging loop |
| `security-auditor` | auth, injection, IDOR review |

**Backend Architecture:**

| Skill | When to use |
| ----- | ----------- |
| `api-design-principles` | REST contract design, endpoint naming, versioning |
| `api-dev` | Fiber route and handler patterns |
| `api-rate-limiting` | rate limiting middleware patterns |
| `api-tester` | automated API testing |
| `database-designer` | schema design, index optimization |
| `database-operations` | query patterns, transactions |
| `architecture-patterns` | Clean Arch, Hexagonal, DDD |
| `microservices-patterns` | service boundaries, event-driven communication |
| `workflow-orchestration-patterns` | Temporal for durable workflows |
| `cqrs-implementation` | CQRS + event sourcing |
| `event-store-design` | event store design |

## Scope Guard

- do: Go handlers, services, repositories, middleware, migrations, background jobs
- do not: frontend UI, CI/CD pipelines, final QA sign-off
