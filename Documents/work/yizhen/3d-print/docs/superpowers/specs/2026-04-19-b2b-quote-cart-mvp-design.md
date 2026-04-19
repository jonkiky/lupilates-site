# B2B Quote Cart MVP Design

Date: 2026-04-19
Project: B2B Quote Cart Web Application
Source requirements: PRD.md

## 1. Scope and Decisions

This design covers a full MVP release in one phase, including:
- Public product catalog and product details
- Quote cart and quote request submission
- Admin login and admin dashboard
- Admin product management and quote management

Confirmed product decisions:
- Platform architecture: single Next.js app (monolith with internal module boundaries)
- Infrastructure: Vercel deployment
- Record storage: Vercel Postgres
- Product image storage: Vercel Blob
- Admin auth: predefined single username/password pair, configured via server environment variables
- Product onboarding: manual entry in admin dashboard only
- Notifications: no submission notifications in MVP
- Product discovery: basic search by name or SKU and single category filter
- Initial scale target: low volume

## 2. Architecture

## 2.1 System Topology

Single Next.js application hosts:
- Public customer-facing pages
- Admin pages
- Route handlers and server actions for backend logic

Persistence and storage:
- Vercel Postgres: relational domain data
- Vercel Blob: image object storage with public or signed delivery URLs

## 2.2 Internal Module Boundaries

To keep the monolith maintainable, separate by feature modules:
- Catalog module: read-only public product queries and product detail retrieval
- Quote cart module: client cart state and quote submission orchestration
- Admin products module: product CRUD, visibility changes, duplicate action, image uploads
- Admin quotes module: quote list/detail, status updates, internal note updates
- Auth/session module: login validation, session cookie issuance, route protection
- Media module: Blob upload handling, URL persistence, upload constraints

Each module exposes clear interfaces through server actions or route handlers, reducing coupling.

## 3. Data Model

Primary entities (from PRD, with MVP-specific notes):
- Product
  - id, sku, name, slug, description, category_id
  - specs_json (JSONB)
  - availability_text
  - visibility_status (Draft, Published, Archived)
  - is_featured
  - created_at, updated_at
- Category
  - id, name, slug, parent_id
- QuoteRequest
  - id, quote_number
  - customer_name, company_name, email, phone, region, project_notes
  - status (New, Reviewing, Contacted, Quoted, Closed)
  - created_at
- QuoteItem
  - id, quote_request_id, product_id
  - product_name_snapshot, sku_snapshot
  - quantity, item_notes
- AdminUser (optional for later)
  - not required for MVP login because credentials are env-defined

Image persistence strategy:
- Option selected for MVP simplicity: store image metadata directly on Product in JSON field (image_urls JSON array)
- Future-friendly fallback: migrate to separate ProductImage table when ordering, variants, or image metadata becomes complex

## 4. Component and Data Flow

## 4.1 Public Flow

1. User opens catalog page.
2. Server queries Published products from Postgres.
3. Search query filters by name and SKU; category filter applies a single category.
4. User opens product detail page for richer information and images.
5. User adds products to quote cart, adjusts quantity, and adds optional item notes.
6. User submits quote request form.
7. Server validates request and writes QuoteRequest + QuoteItems in one transaction.
8. User sees confirmation with quote number and item summary.

## 4.2 Admin Flow

1. Admin opens login page and submits predefined credentials.
2. Server validates credentials against environment variables.
3. On success, server issues signed httpOnly session cookie.
4. Admin accesses dashboard with recent quote requests, status summary, product count.
5. Admin manages products (create, edit, archive, duplicate, image upload to Blob).
6. Admin manages quotes (view details, update status, add internal notes).

## 4.3 Image Upload Flow

1. Admin selects image in product editor.
2. Server validates file type and size.
3. Server uploads to Vercel Blob using generated safe key.
4. Blob URL is stored in Product image_urls JSON.
5. UI updates with preview and supports image removal/reordering (basic ordering in array).

## 5. Authentication and Security

Given MVP requirement for hardcoded login behavior:
- ADMIN_USERNAME and ADMIN_PASSWORD are stored in server environment variables.
- Credentials are never exposed to client code.
- Login route uses constant-time comparison.
- Failed login attempts are rate-limited.
- Session cookie is signed, httpOnly, secure, sameSite=lax, with short TTL.
- Admin routes and admin write operations are protected server-side.
- CSRF protections applied to admin mutations.
- Input validation on all mutation endpoints.

Security boundaries for uploads:
- Allowed mime types restricted to image types only.
- Max upload size enforced.
- File names normalized and random key prefix used.

## 6. Error Handling

Principles:
- Validate early and return actionable messages.
- Preserve user-entered state on failures.
- Avoid partial writes with transactions.

Behavior examples:
- Quote submission validation failure: return field-level errors, keep cart/form data.
- Blob upload failure: keep form draft, surface retry action.
- Database failure: return retry-safe error, log structured server event.

## 7. Testing Strategy

MVP test pyramid:
- Unit tests
  - Validators for product payload, quote form payload, login input
  - Auth/session helper behavior
  - Quote status transition rules
- Integration tests
  - Quote submission persists request/items transactionally
  - Product create/edit/archive/duplicate actions
  - Admin login and route guard behavior
- End-to-end smoke tests
  - Public browse -> add to cart -> submit quote -> confirmation
  - Admin login -> update quote status -> edit product

Manual release checks:
- Verify all required Vercel environment variables are present
- Verify Blob uploads and URL rendering in public pages
- Verify Postgres migrations and query performance for basic catalog listing

## 8. Deployment and Operations

Deployment target:
- Vercel project with production and preview environments

Required environment variables (initial):
- POSTGRES_URL and related Vercel Postgres variables
- BLOB_READ_WRITE_TOKEN (or project-linked Blob config)
- ADMIN_USERNAME
- ADMIN_PASSWORD
- SESSION_SECRET

Operational scope for MVP:
- No CRM integration
- No email notifications
- No multi-region setup
- Low-traffic tuning with room to scale later

## 9. Trade-offs and Future Evolution

Chosen approach optimizes for speed and simplicity:
- Pros
  - Fastest path to usable full MVP
  - Single deployable and lower maintenance burden
  - Direct alignment with Vercel-native stack
- Cons
  - Tight coupling in one app if growth accelerates
  - Predefined single-credential auth is intentionally temporary

Planned post-MVP evolution path:
1. Replace predefined single-credential auth with proper admin identity model.
2. Add internal/customer email notifications.
3. Add richer catalog filtering and sorting.
4. Add CSV import or external system sync.
5. Split services only when scale and team structure justify it.

## 10. Out of Scope for MVP

- Online checkout or payment processing
- Customer self-service accounts and quote history
- CRM integration
- Automated quote PDF generation
- Multi-language support
- Advanced faceted search
