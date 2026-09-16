# CampusFind

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5.1.0-blueviolet?style=flat-square&logo=maplibre)](https://maplibre.org/)
[![Zod](https://img.shields.io/badge/Zod-3.24-3068b7?style=flat-square&logo=zod)](https://zod.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-6e9f18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0-green?style=flat-square&logo=node.js)](https://nodejs.org/)

Enterprise multi-tenant lost-and-found infrastructure designed for academic institutions, universities, colleges, and school campuses. 

CampusFind replaces chaotic messaging groups, fragmented social media posts, and physical notice boards with a map-first spatial index. Users drop pins with GPS-assisted location snapping, browse lost and found items on an interactive campus map, submit claims with verifiable proof of ownership, and track physical item transfers to security desks.

---

## Key Capabilities

- **Institutional Multi-Tenancy**: Complete logical separation between campuses. Each institution operates within an isolated partition with its own building gazetteer, map centroid, items, claims, and physical security desk inventory.
- **Map-First Spatial Index**: Powered by MapLibre GL and OpenStreetMap vector tiles. Lost and found pins are rendered directly over institution landmarks with automated spatial snapping.
- **Zero-Friction Reporting**: Students and faculty report lost or found items in under twenty seconds using photo capture and voice-to-text descriptions.
- **Deterministic Match Proposal**: Automatic spatial and categorical matching between lost and found pins within the same campus. Humans verify every claim before contact exchange.
- **Physical Desk Custody Workflow**: Items unclaimed after 14 days automatically transition to designated campus security custody with digital handover verification.
- **Self-Service Institutional Onboarding**: Any university, college, or school administrator can register their campus at `/onboard`.

---

## Documentation Index

The repository includes a comprehensive documentation suite covering architecture, APIs, local setup, operations, and contribution guidelines:

- **[Architecture & Isolation Guide](docs/ARCHITECTURE.md)**: Deep dive into tenant isolation, spatial snapping, matching pipeline, data security, and custody lifecycle.
- **[REST API Specification](docs/API.md)**: Complete HTTP API documentation including authentication, payloads, response formats, and status codes.
- **[Local Development & Deployment Setup](docs/SETUP.md)**: Environment variables, dependencies, local running instructions, and production deployment guide.
- **[User & Operations Guide](docs/USER_GUIDE.md)**: Comprehensive guide for students, faculty, and campus security staff.
- **[Contribution Guidelines](docs/CONTRIBUTING.md)**: Code standards, git workflow, branch strategy, testing requirements, and zero-emoji compliance.
- **[Developer Specifications & Design Archive](docs/)**: Contains historical specifications, model evaluation notes, and pilot planning documents.

---

## Multi-Tenant Institutional Onboarding

CampusFind is designed so that any educational institution can onboard without modifying core application code:

1. **Submit Application**: Campus authorities visit `/onboard` and provide their institution name, desired URL slug, institution type, administrative contact details, geographical centroid coordinates, and landmark gazetteer.
2. **Review & Approval**: System administrators review the onboarding submission. Upon executing approval via `POST /api/admin/campuses/:slug/approve`, the institution's partition is initialized and live routing is enabled.
3. **Live Campus Portal**: The institution immediately goes live at `https://<domain>/<campus-slug>`, equipped with its customized map, places gazetteer, and isolated datastore.

Cross-campus data leakage is blocked at the routing, query, and datastore levels. An item or search query originating from one campus cannot access or match records belonging to another campus.

---

## Quickstart

### Prerequisites

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher

### Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/msrishav-28/campusfind.git
cd campusfind
npm install
```

### Environment Configuration

Create a local environment file from the provided template:

```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_KEY="dev_admin_secret_key_change_in_production"
CRON_SECRET="dev_cron_secret_key_change_in_production"
SESSION_SECRET="dev_session_secret_at_least_32_chars_long"
```

### Run Locally

Start the development server with Next.js Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Pilot Campus Portal**: [http://localhost:3000/kengeri](http://localhost:3000/kengeri)
- **Institutional Onboarding**: [http://localhost:3000/onboard](http://localhost:3000/onboard)
- **Institutional Directory**: [http://localhost:3000](http://localhost:3000)

### Running Automated Tests

Run the test suite via Vitest:

```bash
npm test
```

Execute type checking and linting:

```bash
npx tsc --noEmit
npm run lint
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| Language | TypeScript 5 (Strict Mode) |
| Styling | TailwindCSS 4, Vanilla CSS Design System |
| Geospatial Mapping | MapLibre GL, CARTO Positron Vector Tiles |
| Data Validation | Zod Schema Validation |
| Unit & Integration Testing | Vitest |
| Runtime & Bundler | Node.js, Next.js Turbopack |

---

## License

This project is licensed under the MIT License.
