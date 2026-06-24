---
alwaysApply: false
description: Next.js 15 App Router guidance covering server/client components, data fetching, caching, auth, and Vercel deployment. Use when building or reviewing Next.js applications with App Router, server actions, or React Server Components.
---

# Next.js

## Use This When

- building or reviewing Next.js 15 App Router applications
- working with server components, client components, or server actions
- configuring caching, revalidation, or streaming
- setting up auth, middleware, or deployment

## Default Stack

| Layer           | Preferred tools                |
| --------------- | ------------------------------ |
| Framework       | Next.js 15 App Router          |
| Language        | TypeScript                     |
| Styling         | Tailwind CSS                   |
| State           | Zustand or React Query         |
| Auth            | Auth.js (NextAuth v5) or Clerk |
| ORM             | Drizzle or Prisma              |
| Database        | PostgreSQL                     |
| Deployment      | Vercel                         |
| Testing         | Vitest + React Testing Library |
| E2E             | Playwright                     |
| Package manager | pnpm                           |

## App Router Rules

- default to server components — only use `"use client"` when necessary (event handlers, hooks, browser APIs)
- never fetch data in client components when a server component can do it
- use `loading.tsx` and `error.tsx` co-located with routes for streaming + error boundaries
- use `layout.tsx` for shared UI — never duplicate layout in page components
- use route groups `(group)` to organize routes without affecting URL structure
- use parallel routes `@slot` for independent UI sections that load concurrently

## Data Fetching Rules

- fetch in server components using `async/await` directly — no `useEffect` for initial data
- use `fetch` with Next.js cache options: `{ cache: 'force-cache' }` or `{ next: { revalidate: N } }`
- use `unstable_cache` for caching non-fetch data sources (DB queries, third-party SDKs)
- use server actions for mutations — never expose API routes just for client → server calls
- use `revalidatePath` or `revalidateTag` after mutations — never stale-on-write

## Caching Rules

- understand the 4 layers: Request Memoization → Data Cache → Full Route Cache → Router Cache
- opt out of full route cache with `export const dynamic = 'force-dynamic'` only when needed
- tag cached data with `{ next: { tags: ['resource'] } }` for targeted invalidation
- never cache sensitive user-specific data at the route level

## Server/Client Boundary

- never import server-only modules in client components — use `server-only` package
- never expose secrets in client components — always read from server side
- use `"use server"` for server actions, never for server components (they are server by default)
- pass serializable props only across the server/client boundary

## Auth Rules

- enforce auth in middleware for route-level protection
- validate session in server components for data-level protection — defense in depth
- never trust client-supplied user IDs for data scoping
- use HTTP-only cookies for session tokens

## Performance Rules

- use `next/image` for all images — never raw `<img>` tags
- use `next/font` for fonts — eliminates CLS from font loading
- use `next/dynamic` with `{ ssr: false }` for heavy client-only components
- analyze bundle with `@next/bundle-analyzer` before shipping large features

## Relevant Skills

**Core Next.js:**

| Skill                         | When to use                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `nextjs`                      | App Router, routing, data fetching, caching, auth, deployment |
| `react-expert`                | React 18/19 hooks, server components, performance, Suspense   |
| `vitest`                      | unit + component testing with React Testing Library           |
| `javascript-testing-patterns` | Jest/Vitest patterns, mocking, TDD                            |

**UI & Design:**

| Skill                        | When to use                                       |
| ---------------------------- | ------------------------------------------------- |
| `ui-ux-pro-max`              | design decisions, UI patterns, component UX       |
| `shadcn`                     | shadcn/ui component library integration           |
| `design-system-patterns`     | design tokens, theming, component architecture    |
| `interaction-design`         | microinteractions, motion, loading states         |
| `auto-animate`               | zero-config animations for React/Next.js          |
| `responsive-design`          | breakpoints, container queries, fluid layouts     |
| `accessibility-compliance`   | WCAG, ARIA, screen reader support                 |
| `web-component-design`       | reusable component APIs, composition patterns     |
| `web-design-guidelines`      | UI review against Vercel Web Interface Guidelines |
| `typescript-advanced-types`  | generics, conditional types, type-safe APIs       |
| `modern-javascript-patterns` | ESM, async patterns                               |
| `turborepo`                  | monorepo with Next.js apps                        |

**SEO (Next.js has built-in SEO support):**

| Skill           | When to use                                 |
| --------------- | ------------------------------------------- |
| `seo`           | full site SEO audit                         |
| `seo-technical` | Core Web Vitals, crawlability, indexability |
| `seo-schema`    | structured data / JSON-LD for Next.js pages |

**Security & Deployment:**

| Skill              | When to use                               |
| ------------------ | ----------------------------------------- |
| `security-auditor` | auth flows, server/client boundary, OWASP |
| `pnpm`             | dependency management                     |

## Scope Guard

- do: App Router, server/client components, data fetching, caching, auth, middleware, deployment
- do not: backend-only APIs without UI, database schema design, infrastructure provisioning
