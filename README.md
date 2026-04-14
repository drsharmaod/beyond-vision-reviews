# Beyond Vision — Patient Review Management System

> Production-ready patient feedback & Google review routing system for Beyond Vision Optometry. Automatically collects post-visit ratings, routes happy patients to Google, and privately alerts clinic managers to unhappy patients before they leave a public review.

---

## Overview

| Rating | Action |
|--------|--------|
| ⭐⭐⭐⭐⭐ (4–5 stars) | Thank patient · Present Google Review CTA · Track click |
| ⭐⭐⭐ (1–3 stars) | Private feedback captured · **No** Google review shown · Manager alert emailed |

---

## Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS |
| Backend     | Next.js API Routes                  |
| Database    | PostgreSQL + Prisma ORM             |
| Auth        | NextAuth.js (credentials)           |
| Email       | Resend                              |
| Job Queue   | BullMQ + Redis (ioredis)            |
| Testing     | Jest + ts-jest                      |
| Hosting     | Vercel (frontend) + managed Postgres + Redis |

---

## Project Structure

```
beyond-vision-reviews/
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Sample data + email templates
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected admin UI
│   │   │   ├── dashboard/     # KPI overview + charts
│   │   │   ├── imports/       # CSV upload + history
│   │   │   ├── alerts/        # Negative feedback management
│   │   │   ├── locations/     # Clinic config + review links
│   │   │   ├── templates/     # Email template editor
│   │   │   ├── settings/      # System settings
│   │   │   └── audit/         # Audit log viewer
│   │   ├── feedback/          # Patient-facing rating page
│   │   │   ├── thank-you/     # Positive post-rating page
│   │   │   └── received/      # Negative post-rating page
│   │   └── api/
│   │       ├── imports/       # CSV import endpoint
│   │       ├── feedback/      # Feedback submission
│   │       ├── r/             # Rating link capture
│   │       ├── review/        # Google review redirect + tracking
│   │       ├── dashboard/     # Analytics endpoints
│   │       ├── alerts/        # Alert CRUD
│   │       ├── locations/     # Location CRUD
│   │       ├── templates/     # Template CRUD
│   │       ├── settings/      # Settings endpoint
│   │       └── audit/         # Audit log endpoint
│   ├── components/
│   │   └── dashboard/         # Sidebar + Header
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config + RBAC helpers
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── tokens.ts          # JWT signing for feedback links
│   │   ├── utils.ts           # Shared utilities
│   │   ├── csv/validator.ts   # CSV parsing + validation
│   │   ├── email/sender.ts    # Resend email helpers
│   │   └── queue/index.ts     # BullMQ queue definitions
│   ├── worker/index.ts        # Background email worker
│   └── types/index.ts         # Shared TypeScript types
├── tests/
│   └── unit/
│       ├── csv-validator.test.ts   # 20 CSV validation tests
│       ├── rating-flow.test.ts     # Token, routing, template tests
│       └── permissions.test.ts     # RBAC tests
├── public/sample_patients.csv
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- [Resend](https://resend.com) account with verified sending domain

### 2. Install dependencies

```bash
git clone <repo>
cd beyond-vision-reviews
npm install
```

### 3. Environment setup

```bash
cp .env.example .env
```

Edit `.env` — minimum required variables:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/beyond_vision_reviews"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
JWT_SECRET="<run: openssl rand -base64 32>"
RESEND_API_KEY="re_your_key_here"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database setup

```bash
# Create and apply migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed with locations, admin user, and email templates
npm run db:seed
```

### 5. Run development

Open **three** terminals:

**Terminal 1 — Next.js app:**
```bash
npm run dev
```

**Terminal 2 — Email worker:**
```bash
npm run worker
```

**Terminal 3 — Redis (if local):**
```bash
redis-server
```

Open [http://localhost:3000](http://localhost:3000)

**Default login:**
- Email: `admin@beyondvision.ca`
- Password: `BeyondVision2024!`

---

## Core Workflow

```
Admin uploads CSV
    │
    ▼
System validates rows → imports valid records
    │
    ▼
Feedback emails queued (with delay, if configured)
    │
    ▼
Patient receives email → clicks star rating
    │
    ▼
Rating captured via signed JWT link /r/:token/:star
    │
    ├── 4–5 ★ ──► Thank-you page + Google Review CTA
    │              Post-thank-you email sent
    │              Review click tracked → /api/review/:id
    │
    └── 1–3 ★ ──► "Feedback received" page (no Google CTA)
                   Internal alert emailed to location manager(s)
                   Alert available in dashboard for follow-up
```

---

## CSV Import Format

**Required columns:**

| Column       | Format              | Notes                                     |
|-------------|---------------------|-------------------------------------------|
| `first_name` | Text                | At least one name field required          |
| `last_name`  | Text                |                                           |
| `email`      | Valid email         | Required; used for suppression            |
| `location`   | Location code       | Must match configured code (e.g. `millwoods`) |
| `exam_date`  | YYYY-MM-DD          | Also accepts MM/DD/YYYY                   |

**Optional columns:**

| Column             | Notes                    |
|--------------------|--------------------------|
| `patient_id`       | External patient ID      |
| `doctor_name`      | Included in alert emails |
| `phone`            | Shown in alert details   |
| `appointment_type` | For internal context     |

Download `public/sample_patients.csv` for a working example.

---

## Configured Locations (seeded)

| Location Name                    | Code           |
|----------------------------------|----------------|
| Beyond Vision Millwoods          | `millwoods`    |
| Beyond Vision Crystallina        | `crystallina`  |
| Beyond Vision Grange             | `grange`       |
| Beyond Vision Terwillegar        | `terwillegar`  |

---

## User Roles

| Role               | Permissions                                                         |
|--------------------|---------------------------------------------------------------------|
| `ADMIN`            | Full access: all locations, settings, templates, users, audit log  |
| `LOCATION_MANAGER` | View/resolve alerts for assigned location; upload CSVs             |
| `STAFF`            | Read-only dashboard access                                          |

---

## Business Logic (Exact)

```
rating >= 4  →  POSITIVE
  ✓ Show/send Google review request
  ✓ Log review_prompt event
  ✗ No internal alert

rating <= 3  →  NEGATIVE / NEUTRAL
  ✗ Do NOT show Google review request
  ✓ Send internal alert to location manager(s)
  ✓ Log alert event
  ✓ Alert visible in dashboard for follow-up
```

---

## Email Templates

Three editable templates (editable in Settings → Templates):

| Template              | Trigger              | Variables Available                                    |
|-----------------------|----------------------|--------------------------------------------------------|
| Feedback Request      | After exam (delayed) | `{{first_name}}`, `{{location_name}}`, `{{exam_date}}`, `{{rating_N_url}}` |
| Positive Follow-up    | 4–5 star response    | `{{first_name}}`, `{{rating}}`, `{{review_link}}`, `{{comment}}` |
| Internal Alert        | 1–3 star response    | `{{first_name}}`, `{{last_name}}`, `{{rating}}`, `{{comment}}`, `{{exam_date}}`, `{{location_name}}` |

---

## API Reference

| Method | Endpoint                       | Auth Required | Description                          |
|--------|-------------------------------|---------------|--------------------------------------|
| POST   | `/api/imports`                | Admin/Manager | Upload and process CSV               |
| GET    | `/api/imports`                | All           | List import history                  |
| GET    | `/r/:token/:rating`           | Public        | Capture rating from email link       |
| POST   | `/api/feedback/respond`       | Public        | Submit rating + optional comment     |
| GET    | `/api/review/:responseId`     | Public        | Track click + redirect to Google     |
| GET    | `/api/dashboard/summary`      | All           | KPI summary                          |
| GET    | `/api/dashboard/ratings`      | All           | Rating distribution + trend          |
| GET    | `/api/dashboard/locations`    | All           | Per-location performance             |
| GET    | `/api/alerts`                 | Manager+      | List alerts (scoped by role)         |
| PUT    | `/api/alerts/:id`             | Manager+      | Update resolution status/notes       |
| GET    | `/api/locations`              | All           | List locations                       |
| POST   | `/api/locations`              | Admin         | Create location                      |
| PUT    | `/api/locations/:id`          | Admin         | Update location                      |
| GET    | `/api/templates`              | All           | List email templates                 |
| PUT    | `/api/templates/:id`          | Admin         | Update template                      |
| GET    | `/api/settings`               | All           | Get system settings                  |
| PUT    | `/api/settings`               | Admin         | Update system settings               |
| GET    | `/api/audit`                  | Admin         | Audit log                            |

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test coverage includes:**
- CSV validation: 14 scenarios (email, location, date, names, duplicates, headers)
- Rating routing: full 1–5 star boundary testing
- Token signing/verification: tamper detection
- Template interpolation: variables, `{{#if}}` blocks, null handling
- RBAC: all role/permission combinations
- Suppression window: boundary calculations

---

## Deployment

### Vercel + Managed Postgres + Upstash Redis

**1. Push to GitHub and import into Vercel.**

**2. Add environment variables in Vercel dashboard** (all from `.env.example`).

**3. Database migration on deploy:**
```bash
# Add to package.json scripts or Vercel build command:
prisma migrate deploy
```

**4. Worker — deploy as a separate service:**

The email worker (`src/worker/index.ts`) is a long-running Node.js process. Options:
- **Railway** or **Render** — deploy as a background worker service
- **Fly.io** — lightweight worker VM
- **EC2/VPS** — run with `pm2` for process management

```bash
# Production worker start with pm2
pm2 start npm --name "bv-worker" -- run worker
pm2 save
```

### Docker (optional)

A `Dockerfile` can be added for the worker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "worker"]
```

---

## Security Notes

- All feedback links use signed JWT tokens with 30-day expiry
- Patient data is never exposed in public URLs
- Location managers can only see their own location's alerts
- All sensitive actions are logged to the audit table
- Rate limiting hooks ready via `rate-limiter-flexible` (add to API routes as needed)
- Admin-only endpoints enforce role checks at the API level

---

## Configuration Without Code Changes

All of the following are configurable from the Settings UI (no deploy required):

| Setting                     | Default                              |
|-----------------------------|--------------------------------------|
| Sender email                | `feedback@beyondvision.ca` |
| Sender name                 | `Beyond Vision Optometry`           |
| Duplicate suppression window| 90 days                              |
| Send delay after exam       | 1 day                                |
| Immediate send mode         | Off                                  |
| Brand primary color         | `#C9A84C` (gold)                    |
| Feedback page title         | `How was your experience?`           |
| Google review links         | Per-location in Locations settings   |
| Alert email recipients      | Per-location in Locations settings   |
| Email templates             | Fully editable with variable helper  |

---

## Future Enhancements

- [ ] SMS feedback via Twilio (schema and queue ready; add SMS sender)
- [ ] Webhook ingestion from EMR (endpoint scaffold in place)
- [ ] Comment sentiment analysis (connect OpenAI/Anthropic API)
- [ ] Scheduled campaign UI (cron-based batch sends)
- [ ] Downloadable reports by location (CSV/PDF export)
- [ ] Multi-tenant architecture (schema has tenant isolation hooks)
- [ ] Manager follow-up timeline view

---

## Support

Built for Beyond Vision Optometry · Edmonton, Alberta  
Internal system — not for public distribution.
