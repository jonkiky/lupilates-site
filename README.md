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
- **Prisma** + **Vercel Postgres**
- **Vercel Blob** for product image storage
- **Tailwind CSS** for mobile-first responsive design
- **Vitest** for unit and integration tests
- **Playwright** for E2E tests

## Environment Variables

| Variable | Description |
|---|---|
| `POSTGRES_URL` | Pooled Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres connection string (for migrations) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for image uploads |
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
