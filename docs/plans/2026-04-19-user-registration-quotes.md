# User Registration & Quote Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user registration (email, username, phone, password) and enable registered users to view their submitted quotes.

**Architecture:** 
- Add `User` model to Prisma, link `QuoteRequest` to users with `userId` field
- Reuse existing HMAC cookie session approach (separate `user_session` cookie from `admin_session`)
- Create auth pages (signup, login, logout) with bcrypt password hashing
- Protect `/user/*` routes with middleware, render user dashboard with quote list
- Update quote submission to link quotes to authenticated users

**Tech Stack:** 
- Prisma 6.7.0 (User model, migrations)
- bcryptjs (password hashing - Node.js compatible)
- Next.js 15 (Server Actions, middleware)
- Zod (validation)
- Vitest + Playwright (tests)

---

## File Structure

**New files:**
- `lib/auth/user-session.ts` - User session creation/verification (reuses HMAC approach, different cookie name)
- `lib/auth/password.ts` - Bcrypt hashing/comparison utilities
- `lib/validations/user.ts` - Zod schemas for signup/login
- `lib/repositories/users.ts` - User CRUD (create, findByEmail, etc.)
- `lib/repositories/user-quotes.ts` - Get quotes for a user
- `app/auth/signup/page.tsx` - Signup form page
- `app/auth/login/page.tsx` - Login form page
- `app/user/dashboard/page.tsx` - User's quote list
- `app/user/quotes/[id]/page.tsx` - User quote detail view
- `app/actions/user-auth.ts` - Signup, login, logout actions
- `components/auth/signup-form.tsx` - Signup form component
- `components/auth/login-form.tsx` - Login form component
- `tests/unit/password.test.ts` - Password hashing tests
- `tests/unit/user-session.test.ts` - User session tests
- `tests/integration/user-auth.test.ts` - Signup/login integration tests

**Modified files:**
- `prisma/schema.prisma` - Add User model, add userId to QuoteRequest
- `lib/auth/session.ts` - Export SESSION_COOKIE_NAME (already exported)
- `middleware.ts` - Add user session verification, protect `/user/*`
- `app/actions/quotes.ts` - Update submitQuoteRequest to link userId when user is authenticated
- `.env.example` - (No change needed, SESSION_SECRET reused)

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add User model and update QuoteRequest**

Replace the schema with additions for User model and userId on QuoteRequest:

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String
  phone         String?
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  quoteRequests QuoteRequest[]

  @@index([email])
}

model QuoteRequest {
  id            String      @id @default(cuid())
  contactEmail  String
  contactName   String
  phoneNumber   String
  companyName   String?
  projectNotes  String
  quoteNumber   String      @unique
  status        QuoteStatus @default(NEW)
  internalNotes String      @default("")
  userId        String?                    // New field for user link
  user          User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  items         QuoteItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([contactEmail])
  @@index([userId])                        // New index
  @@index([status])
}
```

Add this after the existing Product model and before QuoteRequest in the schema.

- [ ] **Step 2: Run migration**

```bash
cd .worktrees/b2b-quote-cart-mvp
npx prisma migrate dev --name add_user_model
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify schema is correct**

```bash
npx prisma db push --skip-generate
```

Expected: No errors, schema matches database.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "db: add User model and userId to QuoteRequest"
```

---

## Task 2: Create Password Hashing Utilities

**Files:**
- Create: `lib/auth/password.ts`
- Create: `tests/unit/password.test.ts`

- [ ] **Step 1: Write tests for password hashing**

```typescript
// tests/unit/password.test.ts
import { describe, expect, it } from 'vitest';
import { hashPassword, comparePassword } from '@/lib/auth/password';

describe('Password', () => {
  it('hashes a password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('compares a password with its hash', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    const matches = await comparePassword(password, hash);
    expect(matches).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    const matches = await comparePassword('wrong-password', hash);
    expect(matches).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/unit/password.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Create password utility module**

```typescript
// lib/auth/password.ts
import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}
```

- [ ] **Step 4: Install bcryptjs**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test -- tests/unit/password.test.ts
```

Expected: PASS (3 tests passing)

- [ ] **Step 6: Commit**

```bash
git add lib/auth/password.ts tests/unit/password.test.ts package.json package-lock.json
git commit -m "feat: add password hashing utilities with bcryptjs"
```

---

## Task 3: Create User Session Utilities

**Files:**
- Create: `lib/auth/user-session.ts`
- Create: `tests/unit/user-session.test.ts`

- [ ] **Step 1: Write tests for user session**

```typescript
// tests/unit/user-session.test.ts
import { describe, expect, it } from 'vitest';
import { createUserSessionValue, verifyUserSessionValue } from '@/lib/auth/user-session';

describe('User Session', () => {
  it('creates a valid user session', () => {
    const session = createUserSessionValue('user-123');
    expect(session).toContain('.');
    const [encoded, signature] = session.split('.');
    expect(encoded).toBeTruthy();
    expect(signature).toBeTruthy();
  });

  it('verifies a valid user session', () => {
    const userId = 'user-123';
    const session = createUserSessionValue(userId);
    const verified = verifyUserSessionValue(session);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userId);
    expect(verified?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects an invalid session signature', () => {
    const session = createUserSessionValue('user-123');
    const [encoded] = session.split('.');
    const tampered = `${encoded}.invalid-signature`;
    const verified = verifyUserSessionValue(tampered);
    expect(verified).toBeNull();
  });

  it('rejects an expired session', () => {
    // Create a session and manually expire it
    const encoded = Buffer.from(JSON.stringify({ userId: 'user-123', expiresAt: Date.now() - 1000 })).toString('base64url');
    const signature = 'dummy'; // Will fail verification due to tamper
    const expired = `${encoded}.${signature}`;
    const verified = verifyUserSessionValue(expired);
    expect(verified).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/unit/user-session.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Create user session module**

```typescript
// lib/auth/user-session.ts
import { createHmac, timingSafeEqual } from 'crypto';

const USER_SESSION_COOKIE_NAME = 'user_session';

function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET ?? 'dev-secret').update(value).digest('hex');
}

export function createUserSessionValue(userId: string) {
  const payload = JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 days
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyUserSessionValue(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { userId: string; expiresAt: number };
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export { USER_SESSION_COOKIE_NAME };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/unit/user-session.test.ts
```

Expected: PASS (4 tests passing)

- [ ] **Step 5: Commit**

```bash
git add lib/auth/user-session.ts tests/unit/user-session.test.ts
git commit -m "feat: add user session creation and verification"
```

---

## Task 4: Create Validation Schemas

**Files:**
- Create: `lib/validations/user.ts`

- [ ] **Step 1: Create user validation schemas**

```typescript
// lib/validations/user.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit lib/validations/user.ts
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/validations/user.ts
git commit -m "feat: add user signup and login validation schemas"
```

---

## Task 5: Create User Repository

**Files:**
- Create: `lib/repositories/users.ts`

- [ ] **Step 1: Create user repository**

```typescript
// lib/repositories/users.ts
import { db } from '@/lib/db';

export async function createUser(input: { email: string; username: string; phone: string | null; passwordHash: string }) {
  return db.user.create({
    data: input,
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function getUserQuotes(userId: string) {
  return db.quoteRequest.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserQuoteById(quoteId: string, userId: string) {
  return db.quoteRequest.findFirst({
    where: { id: quoteId, userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit lib/repositories/users.ts
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/repositories/users.ts
git commit -m "feat: add user repository for database operations"
```

---

## Task 6: Create Auth Server Actions

**Files:**
- Create: `app/actions/user-auth.ts`

- [ ] **Step 1: Create user auth actions**

```typescript
// app/actions/user-auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { signupSchema, loginSchema } from '@/lib/validations/user';
import { createUser, getUserByEmail } from '@/lib/repositories/users';

export async function signupAction(input: unknown) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.flatten() };
  }

  const { email, username, phone, password } = parsed.data;

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      username,
      phone: phone || null,
      passwordHash,
    });

    // Create session and redirect
    const sessionCookie = cookies();
    const sessionValue = createUserSessionValue(user.id);
    sessionCookie.set(USER_SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true };
  } catch (err) {
    console.error('Signup error:', err);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function loginAction(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed' };
  }

  const { email, password } = parsed.data;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create session
    const sessionCookie = cookies();
    const sessionValue = createUserSessionValue(user.id);
    sessionCookie.set(USER_SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Failed to log in' };
  }
}

export async function logoutAction() {
  const sessionCookie = cookies();
  sessionCookie.delete(USER_SESSION_COOKIE_NAME);
  redirect('/');
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/actions/user-auth.ts
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/actions/user-auth.ts
git commit -m "feat: add signup, login, logout server actions"
```

---

## Task 7: Create Signup Form Component

**Files:**
- Create: `components/auth/signup-form.tsx`

- [ ] **Step 1: Create signup form component**

```typescript
// components/auth/signup-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/app/actions/user-auth';

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const input = {
      email: formData.get('email'),
      username: formData.get('username'),
      phone: formData.get('phone'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const result = await signupAction(input);
    setLoading(false);

    if (result.success) {
      router.push('/user/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-stone-950">Create Account</h2>
      
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-stone-700">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Confirm password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-950 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign up'}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already have an account? <a href="/auth/login" className="font-medium text-stone-950 hover:underline">Log in</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit components/auth/signup-form.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/signup-form.tsx
git commit -m "feat: add signup form component"
```

---

## Task 8: Create Login Form Component

**Files:**
- Create: `components/auth/login-form.tsx`

- [ ] **Step 1: Create login form component**

```typescript
// components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/user-auth';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const input = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const result = await loginAction(input);
    setLoading(false);

    if (result.success) {
      router.push('/user/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-stone-950">Log In</h2>
      
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-950 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Log in'}
      </button>

      <p className="text-center text-sm text-stone-600">
        Don't have an account? <a href="/auth/signup" className="font-medium text-stone-950 hover:underline">Sign up</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit components/auth/login-form.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/login-form.tsx
git commit -m "feat: add login form component"
```

---

## Task 9: Create Signup Page

**Files:**
- Create: `app/auth/signup/page.tsx`

- [ ] **Step 1: Create signup page**

```typescript
// app/auth/signup/page.tsx
import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Back to home
        </Link>
      </div>
      <div className="flex justify-center">
        <SignupForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/auth/signup/page.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/auth/signup/page.tsx
git commit -m "feat: add signup page"
```

---

## Task 10: Create Login Page

**Files:**
- Create: `app/auth/login/page.tsx`

- [ ] **Step 1: Create login page**

```typescript
// app/auth/login/page.tsx
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Back to home
        </Link>
      </div>
      <div className="flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/auth/login/page.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/auth/login/page.tsx
git commit -m "feat: add login page"
```

---

## Task 11: Update Middleware for User Sessions

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Update middleware to verify user sessions**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';

const userSessionVerifier = async (sessionValue: string) => {
  const verified = verifyUserSessionValue(sessionValue);
  return verified ? { userId: verified.userId } : null;
};

export async function middleware(request: NextRequest) {
  // Protect /admin/* routes with admin session
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const adminSession = verifySessionValue(adminCookie);
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect /user/* routes with user session
  if (request.nextUrl.pathname.startsWith('/user')) {
    const userCookie = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
    const userSession = await userSessionVerifier(userCookie ?? '');
    if (!userSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit middleware.ts
```

Expected: No errors

- [ ] **Step 3: Test build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: add user session protection to middleware"
```

---

## Task 12: Create User Dashboard Page

**Files:**
- Create: `app/user/dashboard/page.tsx`

- [ ] **Step 1: Create user dashboard page**

```typescript
// app/user/dashboard/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserQuotes } from '@/lib/repositories/users';
import { logoutAction } from '@/app/actions/user-auth';

export default async function UserDashboardPage() {
  const cookieStore = cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const quotes = await getUserQuotes(session.userId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-950">My Quotes</h1>
          <p className="mt-2 text-sm text-stone-600">View and manage your submitted quotes</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Log out
          </button>
        </form>
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
              className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-950">Quote #{quote.quoteNumber}</p>
                  <p className="text-xs text-stone-500">
                    {quote.createdAt.toLocaleDateString()} • {quote.items.length} items
                  </p>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  quote.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                  quote.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-700' :
                  quote.status === 'QUOTED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {quote.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/user/dashboard/page.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/user/dashboard/page.tsx
git commit -m "feat: add user dashboard page"
```

---

## Task 13: Create User Quote Detail Page

**Files:**
- Create: `app/user/quotes/[id]/page.tsx`

- [ ] **Step 1: Create quote detail page**

```typescript
// app/user/quotes/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserQuoteById } from '@/lib/repositories/users';

export default async function UserQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const quote = await getUserQuoteById(id, session.userId);
  if (!quote) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/user/dashboard" className="mb-4 text-sm font-medium text-stone-600 hover:text-stone-900">
        ← Back to quotes
      </Link>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">Quote #{quote.quoteNumber}</h1>
            <p className="mt-1 text-sm text-stone-600">{quote.createdAt.toLocaleDateString()}</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            quote.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
            quote.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-700' :
            quote.status === 'QUOTED' ? 'bg-green-50 text-green-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {quote.status}
          </span>
        </div>

        <div className="mb-6 space-y-4 border-b border-stone-200 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Contact Name</p>
              <p className="mt-1 font-medium text-stone-900">{quote.contactName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Email</p>
              <p className="mt-1 font-medium text-stone-900">{quote.contactEmail}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Phone</p>
              <p className="mt-1 font-medium text-stone-900">{quote.phoneNumber}</p>
            </div>
            {quote.companyName && (
              <div>
                <p className="text-xs font-medium uppercase text-stone-500">Company</p>
                <p className="mt-1 font-medium text-stone-900">{quote.companyName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-4 border-b border-stone-200 pb-6">
          <h2 className="font-medium text-stone-950">Items</h2>
          <div className="space-y-3">
            {quote.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-stone-100 p-3">
                <p className="font-medium text-stone-950">{item.product?.name}</p>
                <p className="text-xs text-stone-500">SKU: {item.product?.sku}</p>
                <p className="text-sm text-stone-700">Quantity: {item.quantity}</p>
                {item.notes && <p className="mt-2 text-sm text-stone-700">Notes: {item.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        {quote.projectNotes && (
          <div className="space-y-2">
            <h2 className="font-medium text-stone-950">Project Notes</h2>
            <p className="text-sm text-stone-700">{quote.projectNotes}</p>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit "app/user/quotes/[id]/page.tsx"
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "app/user/quotes/[id]/page.tsx"
git commit -m "feat: add user quote detail page"
```

---

## Task 14: Update Quote Submission Action

**Files:**
- Modify: `app/actions/quotes.ts`

- [ ] **Step 1: Update submitQuoteRequest to link userId**

Read the current file first:

```bash
head -50 app/actions/quotes.ts
```

Then add userId parameter and link it when user is authenticated. Replace the submitQuoteRequest function with:

```typescript
export async function submitQuoteRequest(input: unknown) {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid quote data' };
  }

  const cookieStore = cookies();
  
  // Check if user is logged in
  let userId: string | undefined;
  const userCookie = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  if (userCookie) {
    const userSession = verifyUserSessionValue(userCookie);
    if (userSession) userId = userSession.userId;
  }

  try {
    const quoteNumber = `QT-${Date.now()}`;
    const quote = await db.quoteRequest.create({
      data: {
        quoteNumber,
        contactName: parsed.data.contactName,
        contactEmail: parsed.data.contactEmail,
        phoneNumber: parsed.data.phoneNumber,
        companyName: parsed.data.companyName,
        projectNotes: parsed.data.projectNotes,
        userId,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.itemNotes,
          })),
        },
      },
    });

    return { success: true, quoteNumber: quote.quoteNumber };
  } catch (err) {
    console.error('Quote submission error:', err);
    return { success: false, error: 'Failed to submit quote' };
  }
}
```

Add imports at the top:

```typescript
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/actions/quotes.ts
```

Expected: No errors

- [ ] **Step 3: Test build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/actions/quotes.ts
git commit -m "feat: link submitted quotes to authenticated user"
```

---

## Task 15: Add User Auth Links to Home Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add auth links to header**

Add these links to the top of the page (before the hero section):

```typescript
<div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
  <p className="text-sm font-medium text-stone-600">B2B Quote Cart</p>
  <div className="flex gap-3">
    <a href="/auth/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
      Log in
    </a>
    <a
      href="/auth/signup"
      className="rounded-full bg-stone-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
    >
      Sign up
    </a>
  </div>
</div>
```

Add this inside the `<main>` tag before the `<section>`. The full page should look like:

```typescript
<main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,95,59,0.18),_transparent_30%),linear-gradient(180deg,_#fbf7f2_0%,_#efe7db_100%)] text-ink">
  <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
    <p className="text-sm font-medium text-stone-600">B2B Quote Cart</p>
    <div className="flex gap-3">
      <a href="/auth/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
        Log in
      </a>
      <a
        href="/auth/signup"
        className="rounded-full bg-stone-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
      >
        Sign up
      </a>
    </div>
  </div>
  <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    {/* rest of page */}
  </section>
</main>
```

- [ ] **Step 2: Verify syntax**

```bash
npx tsc --noEmit app/page.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add user auth links to home page header"
```

---

## Task 16: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Verify SESSION_SECRET is documented**

Check if `.env.example` has SESSION_SECRET and USER-related docs. It should already have DATABASE_URL entries. No changes typically needed, but verify:

```bash
cat .env.example | grep SESSION_SECRET
```

Expected: Already present from admin session setup

- [ ] **Step 2: Commit (if changed)**

If you made any updates:

```bash
git add .env.example
git commit -m "docs: update env example with user session info"
```

---

## Task 17: Run Tests

**Files:**
- Test: All test files

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: All tests pass (should be 26+ tests)

- [ ] **Step 2: If tests fail, debug**

Review failure and fix in relevant files

- [ ] **Step 3: Run build**

```bash
rm -rf .next && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify all tests pass with user auth feature"
```

---

## Success Criteria

✅ User can sign up with email, username, phone, password
✅ Passwords hashed with bcryptjs
✅ User can log in with email + password
✅ Logged-in users see `/user/dashboard` with their quotes
✅ Logged-in users can view quote details at `/user/quotes/[id]`
✅ Quotes are linked to userId when submitted by authenticated user
✅ `/user/*` routes protected by middleware
✅ Session cookies separate from admin sessions
✅ All tests passing (26+)
✅ Build succeeds

---
