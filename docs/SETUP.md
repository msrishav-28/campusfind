# CampusFind Setup & Deployment Guide

This document provides complete instructions for local development, environment configuration, and production hosting for CampusFind.

---

## System Requirements

- **Runtime:** Node.js 20.0.0 or higher
- **Package Manager:** npm 10.0.0 or higher
- **Operating System:** Linux, macOS, or Windows

---

## Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/msrishav-28/campusfind.git
cd campusfind
npm install
```

### 2. Configure Environment Variables

Copy the provided environment template:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Port for the Next.js server |
| `NEXT_PUBLIC_BASE_URL` | Yes (Production) | `http://localhost:3000` | Public domain used for WhatsApp OpenGraph preview cards |
| `DESK_PIN` | No | `1234` | Master passcode for security desk staff intake portal |
| `ADMIN_SECRET` | No | `admin_dev_secret` | Secret key used to authorize institutional campus approval |
| `CRON_SECRET` | Yes (Production) | `cron_dev_secret` | Secret bearer token guarding `/api/cron/expire` |

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/kengeri](http://localhost:3000/kengeri) in your browser to access the pilot campus.

---

## Testing & Quality Commands

```bash
# Run unit and integration tests
npm test

# Run strict TypeScript compiler verification
npx tsc --noEmit

# Run ESLint code quality checks
npm run lint

# Compile production build
npm run build
```

---

## Production Deployment

### Option A: Vercel (Recommended)

1. Connect the GitHub repository `msrishav-28/campusfind` to your Vercel project.
2. Under **Project Settings > Environment Variables**, add:
   - `NEXT_PUBLIC_BASE_URL`: `https://your-domain.com`
   - `DESK_PIN`: Choose a 4-to-8 digit PIN for the campus security team.
   - `ADMIN_SECRET`: A secure random key for campus administrative approvals.
   - `CRON_SECRET`: A secure random key for the daily expiration task.
3. Deploy. Vercel automatically runs `npm run build` with Turbopack.

### Option B: Docker Container

Build and run using standard Node.js Alpine container:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/data ./data
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t campusfind:latest .
docker run -p 3000:3000 -e NEXT_PUBLIC_BASE_URL="https://your-domain.com" campusfind:latest
```

---

## Nightly Expiration Cron Job

CampusFind enforces a 14-day rule: items older than 14 days leave the public map and transition to `expired` status for physical collection at the security desk.

Schedule an automated daily HTTP request (e.g., via Vercel Cron, GitHub Actions, or crontab):

```bash
curl -X GET https://your-domain.com/api/cron/expire \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "ok": true,
  "expired": 3,
  "timestamp": "2026-09-16T00:00:00.000Z"
}
```

---

## Onboarding New Campuses

To onboard any new college or school:
1. Navigate to [http://localhost:3000/onboard](http://localhost:3000/onboard).
2. Enter the institution name, slug, centroid coordinates, and administrative contact.
3. Submit the registration.
4. An administrator approves the tenant by issuing a POST request to `/api/admin/campuses/<slug>/approve`.
5. Once approved, the campus is immediately available at `/<slug>`.
