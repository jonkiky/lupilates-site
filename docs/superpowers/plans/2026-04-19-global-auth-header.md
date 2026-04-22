# Global Auth-Aware Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable server-side `AuthNav` component that displays username + logout for authenticated users or login/signup links for unauthenticated users, then integrate it into three pages (home, quote-cart, user/dashboard).

**Architecture:** Server-side component that accepts a user prop (or null) and renders conditional UI. Each page independently reads its session cookie and passes user data to the component. No layout wrapper or context needed.

**Tech Stack:** Next.js 15, React server components, Tailwind CSS, existing session verification (user-session.ts, getUserById from repositories)

---

## File Structure

**New files:**
- `components/header/auth-nav.tsx` - Reusable auth-aware header component
- `tests/unit/auth-nav.test.tsx` - Component tests

**Modified files:**
- `app/page.tsx` - Replace hardcoded links with AuthNav
- `app/quote-cart/page.tsx` - Add AuthNav at top
- `app/user/dashboard/page.tsx` - Use AuthNav instead of isolated logout button

---

## Task 1: Create AuthNav Component with Tests

**Files:**
- Create: `components/header/auth-nav.tsx`
- Create: `tests/unit/auth-nav.test.tsx`

### Step 1: Write the failing test

Create `tests/unit/auth-nav.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { AuthNav } from '@/components/header/auth-nav';

describe('AuthNav', () => {
  describe('when user is authenticated', () => {
    it('renders username and logout button', () => {
      render(
        <AuthNav
          user={{ userId: 'user-123', email: 'user@example.com' }}
        />
      );

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    it('does not render login/signup links when authenticated', () => {
      render(
        <AuthNav
          user={{ userId: 'user-123', email: 'user@example.com' }}
        />
      );

      expect(screen.queryByText('Log in')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
    });

    it('logout button is inside a form with logoutAction', () => {
      render(
        <AuthNav
          user={{ userId: 'user-123', email: 'user@example.com' }}
        />
      );

      const form = screen.getByRole('button', { name: /log out/i }).closest('form');
      expect(form).toHaveAttribute('action');
    });
  });

  describe('when user is not authenticated', () => {
    it('renders login and signup links', () => {
      render(<AuthNav user={null} />);

      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/auth/signup'
      );
    });

    it('does not render username or logout button when not authenticated', () => {
      render(<AuthNav user={null} />);

      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('renders branding text', () => {
      render(<AuthNav user={null} />);

      expect(screen.getByText('B2B Quote Cart')).toBeInTheDocument();
    });

    it('renders header with flex layout for branding and auth section', () => {
      const { container } = render(<AuthNav user={null} />);

      const headerDiv = container.querySelector('.flex.items-center.justify-between');
      expect(headerDiv).toBeInTheDocument();
    });
  });
});
```

Run: `npm run test -- tests/unit/auth-nav.test.tsx`
Expected: FAIL - Component does not exist yet

### Step 2: Create minimal AuthNav component

Create `components/header/auth-nav.tsx`:

```typescript
import { logoutAction } from '@/app/actions/user-auth';

interface AuthNavProps {
  user: {
    userId: string;
    email: string;
  } | null;
}

export function AuthNav({ user }: AuthNavProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-stone-600">B2B Quote Cart</p>
      <div className="flex gap-3">
        {user ? (
          <>
            <span className="text-sm font-medium text-stone-700">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <a
              href="/auth/login"
              className="text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              Log in
            </a>
            <a
              href="/auth/signup"
              className="rounded-full bg-stone-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Sign up
            </a>
          </>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Run tests to verify they pass

Run: `npm run test -- tests/unit/auth-nav.test.tsx`
Expected: PASS (4 tests passing)

### Step 4: Commit

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
git add components/header/auth-nav.tsx tests/unit/auth-nav.test.tsx
git commit -m "feat: add AuthNav component for global auth display"
```

---

## Task 2: Update Home Page to Use AuthNav

**Files:**
- Modify: `app/page.tsx`

### Step 1: Read the current home page structure

Current code has hardcoded auth links in the header div. We need to replace them with AuthNav and read the user session.

### Step 2: Update home page to read session and render AuthNav

Replace the entire header section (lines 1-23) in `app/page.tsx`:

```typescript
import Link from 'next/link';
import { cookies } from 'next/headers';
import { listPublishedProducts } from '@/lib/repositories/products';
import { ProductGrid } from '@/components/catalog/product-grid';
import { AuthNav } from '@/components/header/auth-nav';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserById } from '@/lib/repositories/users';

export default async function HomePage() {
  const products = await listPublishedProducts({ search: '', category: '' });

  // Read user session
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  let user = null;
  if (session) {
    const dbUser = await getUserById(session.userId);
    if (dbUser) {
      user = { userId: dbUser.id, email: dbUser.email };
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,95,59,0.18),_transparent_30%),linear-gradient(180deg,_#fbf7f2_0%,_#efe7db_100%)] text-ink">
      <AuthNav user={user} />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* rest of the page content remains unchanged */}
```

### Step 3: Verify the page renders correctly

Run: `npm run build`
Expected: Build succeeds with no errors

### Step 4: Run tests to ensure no regressions

Run: `npm run test`
Expected: All tests pass (should still have ~36 tests passing)

### Step 5: Commit

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
git add app/page.tsx
git commit -m "feat: use AuthNav component on home page"
```

---

## Task 3: Update Quote Cart Page to Use AuthNav

**Files:**
- Modify: `app/quote-cart/page.tsx`

### Step 1: Update quote cart page to read session and render AuthNav

Replace `app/quote-cart/page.tsx`:

```typescript
import { cookies } from 'next/headers';
import { QuoteCartClient } from '@/components/quote/quote-cart-client';
import { AuthNav } from '@/components/header/auth-nav';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserById } from '@/lib/repositories/users';

export default async function QuoteCartPage() {
  // Read user session
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  let user = null;
  if (session) {
    const dbUser = await getUserById(session.userId);
    if (dbUser) {
      user = { userId: dbUser.id, email: dbUser.email };
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <AuthNav user={user} />
      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Quote cart</h1>
        <p className="mt-2 text-sm text-stone-600">Adjust quantities, add item notes, and submit your request.</p>
        <QuoteCartClient />
      </div>
    </main>
  );
}
```

### Step 2: Verify the page renders correctly

Run: `npm run build`
Expected: Build succeeds with no errors

### Step 3: Run tests to ensure no regressions

Run: `npm run test`
Expected: All tests pass (~36 tests)

### Step 4: Commit

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
git add app/quote-cart/page.tsx
git commit -m "feat: add AuthNav component to quote cart page"
```

---

## Task 4: Update User Dashboard to Use AuthNav

**Files:**
- Modify: `app/user/dashboard/page.tsx`

### Step 1: Update user dashboard page to use AuthNav

The dashboard already reads the session, so we'll replace the isolated logout button with AuthNav.

Replace `app/user/dashboard/page.tsx`:

```typescript
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserQuotes, getUserById } from '@/lib/repositories/users';
import { AuthNav } from '@/components/header/auth-nav';

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return <div>Unauthorized</div>;
  }

  const quotes = await getUserQuotes(session.userId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <AuthNav user={{ userId: user.id, email: user.email }} />
      <div className="mb-8 mt-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-950">My Quotes</h1>
          <p className="mt-2 text-sm text-stone-600">View and manage your submitted quotes</p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
          <p className="mb-4 text-stone-600">No quotes yet</p>
          <Link
            href="/"
            className="inline-block rounded-full bg-stone-950 px-6 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Browse products and submit a quote
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/user/quotes/${quote.id}`}
              className="block rounded-lg border border-stone-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-stone-950">{quote.projectName}</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {quote.items.length} item{quote.items.length !== 1 ? 's' : ''} • Status:{' '}
                    <span className="font-medium">{quote.status}</span>
                  </p>
                </div>
                <time className="text-sm text-stone-500">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

### Step 2: Verify the page renders correctly

Run: `npm run build`
Expected: Build succeeds with no errors

### Step 3: Run tests to ensure no regressions

Run: `npm run test`
Expected: All tests pass (~36 tests)

### Step 4: Commit

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
git add app/user/dashboard/page.tsx
git commit -m "feat: replace isolated logout button with AuthNav on dashboard"
```

---

## Task 5: Full Test Suite and Build Verification

**Files:**
- Test and verify: All pages and components

### Step 1: Run full test suite

Run: `npm run test`
Expected: All tests pass (should have 40+ tests with the new AuthNav tests)

### Step 2: Run production build

Run: `npm run build`
Expected: Build succeeds, no errors (5 pre-existing ESLint warnings are acceptable)

### Step 3: Manual verification checklist

Verify these scenarios manually by running `npm run start` and testing:

- [ ] Navigate to `/` logged out → See "Log in" and "Sign up" links in header
- [ ] Navigate to `/quote-cart` logged out → See "Log in" and "Sign up" links in header
- [ ] Log in with valid credentials → Redirect to dashboard
- [ ] Navigate to `/` logged in → See email and "Log out" button
- [ ] Navigate to `/quote-cart` logged in → See email and "Log out" button
- [ ] Dashboard shows email and "Log out" button
- [ ] Click logout on any page → Session clears, redirect to home
- [ ] Verify responsive design on mobile viewport

### Step 4: Final commit with summary

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
git add -A
git commit -m "test: verify global auth header works across all pages"
```

---

## Summary of Changes

| File | Change | Type |
|------|--------|------|
| `components/header/auth-nav.tsx` | New component for global auth UI | Create |
| `tests/unit/auth-nav.test.tsx` | Component tests (4 test cases) | Create |
| `app/page.tsx` | Use AuthNav, read session | Modify |
| `app/quote-cart/page.tsx` | Add AuthNav, read session | Modify |
| `app/user/dashboard/page.tsx` | Use AuthNav, remove isolated logout | Modify |

**Test Impact:** +4 new tests (AuthNav component), all existing 36 tests should continue passing
**Build Status:** Should compile successfully with no new errors
