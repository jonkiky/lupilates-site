# 3D Print B2B Quote Cart

A Next.js B2B web application for browsing 3D printing products and submitting quote requests.

## Features

- Public product catalog with search and category filtering
- Quote cart with per-item quantity and notes
- Quote submission form with customer details
- Admin dashboard for managing products and quote requests
- Secure admin login with HMAC-signed session cookies

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Prisma** + **Postgres** (Neon)
- **Cloudflare R2** for product image storage
- **AWS SDK S3 Client** for R2 S3-compatible API
- **Tailwind CSS** for mobile-first responsive design
- **Vitest** for unit and integration tests
- **Playwright** for E2E tests

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Primary Postgres connection string |
| `DATABASE_URL_UNPOOLED` | Direct Postgres connection string (for migrations) |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name for images |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret access key |
| `R2_ENDPOINT_URL` | Cloudflare R2 S3 API endpoint URL |
| `R2_PUBLIC_URL` | Cloudflare R2 public domain URL |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `SESSION_SECRET` | Secret key for HMAC-signed session cookies |

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate -- --name init_schema

# Seed sample data
npm run db:seed

# Start dev server
npm run dev
```

## Testing

```bash
# Unit and integration tests
npm test

# E2E tests (requires running dev server)
npm run test:e2e
```
