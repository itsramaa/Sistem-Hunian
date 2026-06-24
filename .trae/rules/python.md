---
alwaysApply: false
description: Python implementation guidance covering uv, async patterns, type safety, testing, and project structure. Use when writing, reviewing, or debugging Python code, setting up FastAPI/Litestar services, configuring async workflows, or working with Pydantic and SQLAlchemy.
---

# Python Implementer

## Use This When

- writing or reviewing Python code
- setting up a new Python project or service
- working with async/await, background jobs, or data pipelines
- debugging Python errors or performance issues

## Default Stack

| Layer           | Preferred tools               |
| --------------- | ----------------------------- |
| Package manager | uv                            |
| Runtime         | Python 3.12+                  |
| Type checking   | mypy or pyright (strict mode) |
| Linting         | ruff                          |
| Formatting      | ruff format                   |
| Testing         | pytest + pytest-asyncio       |
| Async framework | asyncio, FastAPI, or Litestar |
| HTTP client     | httpx                         |
| Data validation | Pydantic v2                   |
| Config          | pydantic-settings (env-based) |
| Background jobs | Celery or ARQ                 |
| ORM             | SQLAlchemy 2.x async          |

## Project Structure

```
src/
  <package>/
    __init__.py
    main.py
    config.py        # pydantic-settings
    models/
    services/
    routers/         # or handlers/
    repositories/
    utils/
tests/
  unit/
  integration/
pyproject.toml
.python-version
```

## Operating Rules

- always use `uv` for dependency and venv management, never `pip` directly
- pin Python version in `.python-version`
- use `pyproject.toml` as single source of truth — no `setup.py` or `requirements.txt`
- type-annotate all function signatures; run mypy/pyright before marking work complete
- never use bare `except:`; always catch specific exception types
- use `pydantic-settings` for config; never read `os.environ` directly in business logic
- prefer `async def` + `httpx.AsyncClient` for I/O-bound operations
- use context managers (`async with`) for resources — DB sessions, HTTP clients, file handles

## Async Rules

- never call blocking I/O inside an async function — use `asyncio.to_thread` or a thread pool executor
- avoid `asyncio.sleep(0)` as a yielding hack; restructure the code instead
- use `asyncio.gather` for concurrent independent tasks, not sequential `await`
- propagate cancellation — do not swallow `asyncio.CancelledError`

## Type Safety

- use `from __future__ import annotations` for forward references
- prefer `TypeAlias` and `TypeVar` over `Any`
- use `Protocol` for structural typing instead of ABCs where duck typing is the intent
- use `Final` for constants

## Testing Rules

- follow `tests/unit/` and `tests/integration/` split
- use `pytest.fixture` with appropriate scope — avoid `scope="session"` for stateful fixtures
- mock external I/O with `unittest.mock.AsyncMock` or `respx` for httpx
- assert on specific fields — avoid `assert response.status_code == 200` as the only check
- use `pytest-cov` for coverage; aim for 80%+ on business logic

## Relevant Skills

**Core Python (`skills/pyhon/`):**

| Skill                             | When to use                                     |
| --------------------------------- | ----------------------------------------------- |
| `uv-package-manager`              | adding dependencies, venv management            |
| `async-python-patterns`           | async/await, event loop, concurrency            |
| `python-type-safety`              | generics, protocols, mypy/pyright config        |
| `python-testing-patterns`         | pytest fixtures, mocking, parametrize           |
| `python-error-handling`           | structured error propagation, custom exceptions |
| `python-project-structure`        | new project scaffolding                         |
| `python-observability`            | logging, tracing, metrics                       |
| `python-background-jobs`          | Celery, ARQ, task queues                        |
| `python-resilience`               | retries, circuit breakers, timeouts             |
| `python-design-patterns`          | GoF patterns adapted for Python                 |
| `python-anti-patterns`            | common mistakes to avoid                        |
| `python-code-style`               | PEP 8, ruff, naming conventions                 |
| `python-configuration`            | pydantic-settings, env-based config             |
| `python-packaging`                | pyproject.toml, uv, publishing                  |
| `python-performance-optimization` | profiling, caching, optimization                |
| `python-resource-management`      | context managers, file handles, connections     |

**Backend Architecture:**

| Skill                             | When to use                                       |
| --------------------------------- | ------------------------------------------------- |
| `api-design-principles`           | REST contract design, endpoint naming, versioning |
| `api-dev`                         | API handler patterns                              |
| `api-rate-limiting`               | rate limiting middleware                          |
| `api-tester`                      | automated API testing                             |
| `database-designer`               | schema design, index optimization                 |
| `database-operations`             | query patterns, transactions                      |
| `architecture-patterns`           | Clean Arch, Hexagonal, DDD for Python services    |
| `microservices-patterns`          | service boundaries, event-driven communication    |
| `workflow-orchestration-patterns` | Temporal for long-running workflows               |
| `temporal-python-testing`         | testing Temporal workflows with pytest            |
| `cqrs-implementation`             | CQRS + event sourcing patterns                    |
| `event-store-design`              | event store design                                |

**General:**

| Skill                  | When to use                       |
| ---------------------- | --------------------------------- |
| `systematic-debugging` | root-cause debugging loop         |
| `security-auditor`     | OWASP review for Python endpoints |

## Scope Guard

- do: Python code, async patterns, type safety, project config, testing
- do not: frontend UI, infrastructure provisioning
