# Contributing to CampusFind

This document defines the development workflow, code style, and quality standards for contributing to CampusFind.

---

## Code of Conduct & Hostile Review Standard

All contributions to CampusFind are evaluated under an enterprise production standard:

1. **Type Safety:** Zero `any` types without explicit, documented rationale. All API route inputs and outputs must be validated with Zod schemas.
2. **Completeness:** No stubs, placeholders, TODO comments, or partial mock implementations in production paths.
3. **Security:** Fail-closed defaults. Plaintext secret details must never be logged, stored, or returned over the wire.
4. **Visual Aesthetics:** No cheap Unicode emojis anywhere in user-facing components or system documentation. Use clean SVG vector icons and semantic CSS badges.
5. **Multi-Tenant Isolation:** Every database query, state mutation, and location calculation must strictly enforce campus-level scoping. Cross-tenant leakage is treated as a critical security vulnerability.

---

## Development Workflow

### 1. Prerequisites

- Node.js version 20.x or later (tested on Node v24)
- npm version 10.x or later
- Modern browser with Geolocation and Web Speech API support

### 2. Branching Strategy

- `main`: Production-ready branch. All commits on main must pass linting, type-checking, automated tests, and production build compilation.
- Feature branches: `feat/<feature-name>`, `fix/<bug-name>`, `chore/<task-name>`, `test/<suite-name>`.

### 3. Commit Convention

CampusFind enforces Conventional Commits with atomic, focused changes:

- `feat(scope): ...` for new features
- `fix(scope): ...` for bug fixes
- `test(scope): ...` for automated test additions or test harness updates
- `chore(scope): ...` for build scripts, configs, dependencies, or documentation
- `refactor(scope): ...` for structural changes without modifying external behavior

Example:
```bash
git commit -m "feat(tenant): implement institutional onboarding and approval workflow"
```

---

## Quality & Verification Gates

Before submitting a Pull Request, every contributor must verify:

```powershell
# 1. Run the automated test suite
npm test

# 2. Run the strict TypeScript typechecker
npx tsc --noEmit

# 3. Run the linter
npm run lint

# 4. Verify production bundle compilation
npm run build
```

A Pull Request is only mergeable when all four checks exit with code 0.

---

## Writing Automated Tests

Tests live in the `tests/` directory and use the Node.js native test runner via `npx tsx --test`:

- `tests/location.test.ts`: Spatial math, distance calculations, perimeter boundary tests.
- `tests/security.test.ts`: String normalization and SHA-256 cryptographic hashing tests.
- `tests/schemas.test.ts`: Zod schema boundary validation.
- `tests/store.test.ts`: Data storage, session handling, state machine, abuse hiding, and multi-tenant isolation.

When introducing a new feature, author matching automated test cases covering both expected success cases and edge/failure conditions.
