---
alwaysApply: false
description: Vue 3 implementation guidance covering Composition API, script setup, Pinia, Vue Router, VueUse, and testing. Use when building or reviewing Vue 3 components, composables, stores, or pages.
---

# Vue Implementer

## Use This When

- building or reviewing Vue 3 components, composables, or pages
- setting up Pinia stores or Vue Router routes
- working with VueUse utilities
- debugging Vue reactivity or rendering issues

## Default Stack

| Layer      | Preferred tools                               |
| ---------- | --------------------------------------------- |
| Framework  | Vue 3 with Composition API + `<script setup>` |
| Build tool | Vite                                          |
| State      | Pinia                                         |
| Router     | Vue Router 4                                  |
| Utilities  | VueUse                                        |
| Styling    | Tailwind CSS or UnoCSS                        |
| UI library | Nuxt UI, shadcn-vue, or plain Tailwind        |
| HTTP       | ofetch or axios                               |
| Validation | Zod + vee-validate                            |
| Testing    | Vitest + Vue Test Utils                       |
| E2E        | Playwright                                    |
| Tooling    | pnpm, ESLint, Prettier                        |

## Component Rules

- always use `<script setup lang="ts">` — never Options API for new code
- extract reusable logic into composables under `composables/`; prefix with `use`
- keep components under 200 lines — split into child components or composables when larger
- use `defineProps` with TypeScript interface, never runtime-only prop types
- use `defineEmits` with typed emit signatures
- prefer `v-bind` shorthand (`:`) and `v-on` shorthand (`@`)
- avoid inline `style` — use Tailwind or scoped CSS

## Reactivity Rules

- use `ref` for primitives, `reactive` for objects only when the whole object is always used together
- never destructure `reactive()` objects — use `toRefs` or access via the reactive ref
- use `computed` for derived state — never compute in the template directly
- use `watch` with `{ immediate: true }` only when side-effects must run on mount too
- prefer `watchEffect` for auto-tracked effects; `watch` when explicit source control matters

## Pinia Rules

- one store per domain/feature — keep stores focused
- define stores with `defineStore('id', () => { ... })` (Setup Stores pattern)
- never mutate store state outside the store — expose actions for all mutations
- use `storeToRefs` when destructuring reactive state from a store

## Vue Router Rules

- define routes in a dedicated `router/index.ts`
- use named routes (`{ name: 'profile' }`) not hardcoded paths in `<router-link>`
- guard authenticated routes with navigation guards — never inline auth checks in components
- use `definePageMeta` for Nuxt or route meta for access control metadata

## Testing Rules

- test composables in isolation with `@vueuse/core` testing utilities
- use `mount` from Vue Test Utils with a real Pinia instance for component tests
- assert on DOM output and emitted events — not internal state
- use `vi.mock` for module-level mocks; `vi.fn()` for function spies
- E2E with Playwright covers critical user journeys only

## Relevant Skills

**Core Vue:**

| Skill                        | When to use                                        |
| ---------------------------- | -------------------------------------------------- |
| `vue`                        | Composition API, script setup macros, new APIs     |
| `vue-best-practices`         | composables, reactivity, SFC patterns, performance |
| `vue-router-best-practices`  | routing, navigation guards, lazy loading           |
| `vue-testing-best-practices` | Vue Test Utils, Vitest, Pinia test setup           |
| `vueuse-functions`           | 200+ utility composables reference                 |

**Build & Testing:**

| Skill                         | When to use                                      |
| ----------------------------- | ------------------------------------------------ |
| `vite`                        | vite.config.ts, plugins, SSR, Rolldown migration |
| `vitest`                      | test runner config, coverage, mocking            |
| `javascript-testing-patterns` | Jest/Vitest patterns, TDD, mocking strategies    |
| `typescript-advanced-types`   | generics, conditional types, mapped types        |
| `modern-javascript-patterns`  | ESM, async patterns, advanced JS                 |

**UI & Design:**

| Skill                      | When to use                                    |
| -------------------------- | ---------------------------------------------- |
| `ui-ux-pro-max`            | design decisions, UI patterns, component UX    |
| `shadcn`                   | shadcn-vue component library integration       |
| `design-system-patterns`   | design tokens, theming, component architecture |
| `interaction-design`       | microinteractions, motion, transitions         |
| `auto-animate`             | zero-config animations for Vue components      |
| `responsive-design`        | breakpoints, container queries, fluid layouts  |
| `accessibility-compliance` | WCAG, ARIA patterns, screen reader support     |
| `web-component-design`     | reusable component APIs, composition patterns  |

**Other:**

| Skill                  | When to use               |
| ---------------------- | ------------------------- |
| `systematic-debugging` | root-cause debugging loop |
| `security-auditor`     | XSS, CSRF, auth review    |
| `pnpm`                 | dependency management     |

## Scope Guard

- do: Vue 3 components, composables, Pinia, Vue Router, Vite config, frontend testing
- do not: backend API logic, database access, CI/CD ownership
