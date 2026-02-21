# Development Standards & Best Practices
**System:** SiHuni (Sistem Hunian)  
**Version:** 1.0.0  
**Last Updated:** 2026-02-22  
**Status:** Enforced

---

## 1. Guiding Principles

### 1.1 Core Philosophies
*   **Single Responsibility Principle (SRP):** Every module, class, or function should have one, and only one, reason to change.
*   **Clean Architecture:** Domain logic is independent of frameworks, UI, and external agencies. Dependencies point inwards.
*   **DRY (Don't Repeat Yourself):** Abstractions over copy-pasting.
*   **Type Safety:** Strict TypeScript everywhere. `any` is forbidden unless explicitly justified in comments.
*   **Accessibility First:** All UI components must meet WCAG 2.1 AA standards by default.

### 1.2 Repository Structure (Monorepo)
```
/
├── apps/
│   ├── web/                 # Next.js/React Frontend (SiHuni Dashboard)
│   ├── api/                 # NestJS Core Backend
│   └── ai-service/          # Python FastAPI (ML/OCR/GenAI)
├── packages/
│   ├── ui/                  # Shared UI Component Library (Shadcn/Tailwind)
│   ├── db/                  # Prisma Schema & Client
│   └── ts-config/           # Shared TypeScript Configurations
├── docs/                    # Architecture & API Documentation
└── infrastructure/          # Terraform/K8s manifests
```

---

## 2. Technology Stack

| Layer | Technology | Version | Usage |
|-------|------------|---------|-------|
| **Frontend** | React | 19.x | Server Components, Actions, Hooks |
| **Build Tool** | Vite | 5.x | HMR, Bundling |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first styling |
| **Backend Core** | NestJS | 10.x | REST API, Business Logic |
| **AI/ML Service** | Python | 3.11+ | FastAPI, PyTorch, Scikit-learn |
| **Database** | PostgreSQL | 16.x | Primary Data Store (JSONB supported) |
| **ORM** | Prisma | 5.x | TypeScript ORM |
| **Queue** | BullMQ | 5.x | Async Job Processing (OCR/Email) |
| **Testing** | Vitest / Jest | Latest | Unit & Integration Testing |

---

## 3. Frontend Standards (React + Vite)

### 3.1 Directory Structure (Feature-Based)
Organize code by **feature**, not technical type.

```
src/
├── features/
│   ├── property-management/
│   │   ├── components/      # Feature-specific components
│   │   ├── hooks/           # Feature-specific hooks
│   │   ├── api/             # API integration (React Query)
│   │   └── types/           # Feature types
│   └── tenant-scoring/
├── components/              # Shared UI components (Buttons, Inputs)
├── lib/                     # Utility functions (axios, cn, formatters)
└── styles/                  # Global CSS & Tailwind config
```

### 3.2 React 19 Patterns
*   **Hooks:** Use `use()` for promise unwrapping in components.
*   **Optimistic UI:** Implement `useOptimistic` for instant feedback on mutations (e.g., updating rent price).
*   **Server Actions:** Use server actions for form submissions where applicable (Next.js context) or standard API calls (Vite SPA).

**Example: Optimistic Update**
```typescript
import { useOptimistic } from 'react';

function PropertyPrice({ price, onUpdate }: { price: number, onUpdate: (p: number) => Promise<void> }) {
  const [optimisticPrice, setOptimisticPrice] = useOptimistic(
    price,
    (state, newPrice: number) => newPrice
  );

  async function updatePrice(formData: FormData) {
    const newPrice = Number(formData.get('price'));
    setOptimisticPrice(newPrice); // Instant UI update
    await onUpdate(newPrice);     // Async server sync
  }

  return (
    <form action={updatePrice}>
      <span className="text-xl font-bold">{formatCurrency(optimisticPrice)}</span>
      <input type="number" name="price" hidden defaultValue={price} />
      <button type="submit">Update</button>
    </form>
  );
}
```

### 3.3 Styling & Design Tokens
*   **Framework:** Tailwind CSS with CSS Variables.
*   **Naming:** Follow `UIUX_Design_Documentation_SiHuni.md`.
*   **Helper:** Use `clsx` or `cn` utility for conditional classes.

**Design Tokens Mapping:**
```css
/* global.css */
:root {
  --primary: 35 32% 41%;       /* #8B6F47 */
  --accent: 48 89% 60%;        /* #F4D03F */
  --background: 42 100% 96%;   /* #FFF8E7 */
  --radius: 0.5rem;            /* 8px */
}
```

**Usage:**
```tsx
<div className="bg-background text-primary p-4 rounded-radius border border-border">
  <h1 className="font-heading text-2xl font-bold">SiHuni Dashboard</h1>
</div>
```

### 3.4 Accessibility (WCAG 2.1 AA)
*   **Semantic HTML:** Use `<button>`, `<nav>`, `<main>`, `<article>` correctly.
*   **Forms:** All inputs MUST have associated labels (`htmlFor` + `id`).
*   **Focus Management:** Ensure visible focus rings (customized in Tailwind theme).
*   **ARIA:** Use only when semantic HTML is insufficient.

---

## 4. Backend Standards (NestJS)

### 4.1 Architecture: Modular Monolith
Follow Clean Architecture principles within NestJS modules.

```
src/
├── modules/
│   ├── properties/
│   │   ├── domain/          # Entities & Value Objects (Pure TS)
│   │   ├── application/     # Use Cases / Services
│   │   ├── infrastructure/  # Repositories (Prisma), Adapters
│   │   └── presentation/    # Controllers (REST), Resolvers (GraphQL)
│   └── auth/
├── shared/                  # Shared Kernel (Guards, Interceptors)
└── main.ts
```

### 4.2 Error Handling
Use standard HTTP exceptions with specific error codes.

```typescript
// domain/errors/property-not-found.error.ts
export class PropertyNotFoundError extends Error {
  constructor(id: string) {
    super(`Property with ID ${id} not found`);
  }
}

// infrastructure/filters/http-exception.filter.ts
@Catch(PropertyNotFoundError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: PropertyNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
      error: 'Not Found',
    });
  }
}
```

### 4.3 Database Interactions
*   **Prisma:** Use for all OLTP operations.
*   **Raw SQL:** Permitted only for complex analytics queries (documented).
*   **Soft Deletes:** Implement logic to handle `deletedAt` fields globally.

---

## 5. AI/ML Service Standards (Python)

### 5.1 Project Structure
```
ai_service/
├── app/
│   ├── api/                 # FastAPI Routes
│   ├── core/                # Config & Security
│   ├── services/
│   │   ├── ocr/             # Tesseract/EasyOCR logic
│   │   ├── pricing/         # Random Forest Models
│   │   └── scoring/         # Risk Scoring Logic
│   └── models/              # Pydantic Schemas
├── ml_models/               # Serialized Models (.pkl, .onnx)
└── tests/
```

### 5.2 Quality Gates
*   **Type Hinting:** 100% coverage with `mypy`.
*   **OCR Validation:** Confidence score < 0.8 must trigger `manual_review` flag.
*   **Model Versioning:** All models must be versioned in S3/MLflow.

---

## 6. Testing Strategy

### 6.1 Pyramid of Testing
1.  **Unit Tests (70%):** Business logic, utility functions, individual components.
    *   *Tool:* Vitest (Frontend), Jest (Backend).
2.  **Integration Tests (20%):** API endpoints, Database queries, Component interactions.
    *   *Tool:* Supertest (NestJS), React Testing Library.
3.  **E2E Tests (10%):** Critical user flows (Signup, Payment, Report Generation).
    *   *Tool:* Playwright.

### 6.2 Test Naming Convention
*   `describe('MethodName', ...)`
*   `it('should return X when Y condition is met', ...)`

---

## 7. Version Control & Workflow

### 7.1 Conventional Commits
Format: `<type>(<scope>): <description>`

*   `feat(auth): implement jwt refresh token strategy`
*   `fix(ocr): correct date parsing for ktp format`
*   `docs(api): update swagger for pricing endpoint`
*   `refactor(ui): migrate button component to shadcn`

### 7.2 Branching Strategy
*   `main`: Production-ready code.
*   `develop`: Integration branch.
*   `feature/feature-name`: New features.
*   `fix/bug-name`: Bug fixes.

### 7.3 Code Review Checklist
- [ ] Logic follows SRP?
- [ ] Types are strict (no `any`)?
- [ ] Tests added/updated?
- [ ] Accessibility verified (frontend)?
- [ ] Security implications considered?

---

## 8. Documentation

*   **API:** OpenAPI (Swagger) auto-generated from NestJS decorators.
*   **Components:** Storybook for UI library.
*   **Architecture:** ADRs (Architecture Decision Records) in `docs/adr/`.
