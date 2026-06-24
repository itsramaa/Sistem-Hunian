---
alwaysApply: false
description: Vite build tool guidance covering vite.config.ts, plugins, env vars, SPA/SSR/library mode, and production caching. Use when configuring Vite projects, debugging HMR or build issues, or migrating to Vite 8 (Rolldown + Oxc).
---

# Vite

## Use This When

- configuring `vite.config.ts` (plugins, aliases, env, build options)
- building SPA, SSR, or library mode with Vite
- debugging HMR, build output, or production caching issues
- migrating to Vite 8 (Rolldown + Oxc)

## Default Stack

| Layer           | Preferred tools                      |
| --------------- | ------------------------------------ |
| Build tool      | Vite 8 (Rolldown-powered)            |
| Config          | `vite.config.ts` with `defineConfig` |
| Transformer     | Oxc (Vite 8+)                        |
| Testing         | Vitest                               |
| Package manager | pnpm                                 |

## Operating Rules

- always use `vite.config.ts` not `.js` — TypeScript config only
- always use ESM — never CommonJS in Vite projects
- prefix public env vars with `VITE_` — access via `import.meta.env.VITE_*`
- never use `process.env` in Vite client code
- never import from `dist/` or `build/` output folders
- run `tsc --noEmit && vite build && vite preview` before pushing — dev server hides build errors

## SPA Deployment (Critical)

- configure static host to serve `index.html` for all unknown paths (SPA routing)
- `index.html` must have `Cache-Control: no-cache` — never cache the entry point
- hashed assets (`/assets/*.js`, `/assets/*.css`) use `Cache-Control: public, max-age=31536000, immutable`

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Env Var Rules

- public vars: `VITE_API_URL=...` → `import.meta.env.VITE_API_URL`
- private vars (no `VITE_` prefix) are `undefined` in the client bundle — by design
- use `loadEnv` in `vite.config.ts` for server-side config access

## Common Gotchas

- HMR not working → check for circular dependencies, use named exports not default
- `Cannot find module` → add to `optimizeDeps.include` in `vite.config.ts`
- case-sensitive imports that pass on macOS but fail in Linux CI → fix import casing
- route refresh 404 → missing SPA rewrite rule on static host

## React + Vite

- use `React.lazy` + `Suspense` for route-level code splitting — never import all pages at the top
- use `vite-react-best-practices` skill for full React/Vite SPA patterns

## Relevant Skills

**Core Vite:**

| Skill                       | When to use                                             |
| --------------------------- | ------------------------------------------------------- |
| `vite`                      | vite.config.ts, plugin API, SSR, Rolldown/Oxc migration |
| `vite-react-best-practices` | React SPA patterns, caching, code splitting, deployment |
| `vitest`                    | test runner config, coverage, mocking, watch mode       |

**Frontend:**

| Skill                         | When to use                                  |
| ----------------------------- | -------------------------------------------- |
| `typescript-advanced-types`   | TypeScript config, type-safe Vite projects   |
| `shadcn`                      | shadcn/ui component library integration      |
| `modern-javascript-patterns`  | ESM patterns, dynamic imports, module system |
| `javascript-testing-patterns` | Jest/Vitest patterns, component testing      |
| `responsive-design`           | CSS, breakpoints for Vite SPA                |
| `accessibility-compliance`    | WCAG audit for Vite apps                     |
| `turborepo`                   | monorepo setup with Vite packages            |

**Deployment:**

| Skill              | When to use                        |
| ------------------ | ---------------------------------- |
| `security-auditor` | env var exposure, CSP headers, XSS |
| `pnpm`             | dependency management              |

## Scope Guard

- do: Vite config, build pipeline, env vars, SPA/SSR/library mode, HMR debugging
- do not: React component logic (see `vue.md` for Vue), backend APIs, CI/CD ownership
