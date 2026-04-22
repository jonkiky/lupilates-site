# User Profile & Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user profile page allowing users to update password, phone, and WeChat; add optional WeChat to signup; make username in header clickable to profile.

**Architecture:** Database migration adding wechat field, validation schema extension, new server action for profile updates, new ProfileForm component and /user/profile route following existing patterns (server components, session-based auth, Zod validation, TDD).

**Tech Stack:** Prisma ORM, Next.js 15 server/client components, Zod validation, bcryptjs password hashing, React Testing Library, Vitest.

---

## File Structure

| File | Change | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add optional `wechat` field to User model |
| `lib/validations/user.ts` | Modify | Add `wechat` to signupSchema validation |
| `lib/repositories/users.ts` | Modify | Add `updateUser(userId, data)` function |
| `app/actions/user-auth.ts` | Modify | Update `signupAction`, add `updateUserProfileAction` |
| `components/auth/signup-form.tsx` | Modify | Add WeChat input field |
| `components/auth/profile-form.tsx` | Create | New form component for profile updates |
| `components/header/auth-nav.tsx` | Modify | Make username a Link to `/user/profile` |
| `app/user/profile/page.tsx` | Create | New profile page route |
| `tests/unit/signup-form.test.tsx` | Modify | Test WeChat field in signup |
| `tests/unit/auth-nav.test.tsx` | Modify | Test profile link in AuthNav |
| `tests/unit/profile-form.test.tsx` | Create | Test ProfileForm component |
| `tests/unit/user-auth.test.ts` | Create | Test updateUserProfileAction |

---

## Task 1: Database Migration - Add WeChat Field

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add wechat field to User model**

Open `prisma/schema.prisma` and locate the User model. Add the wechat field after the phone field:

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String
  phone         String?
  wechat        String?        // NEW: optional WeChat ID
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  quoteRequests QuoteRequest[]

  @@index([email])
}
```

- [ ] **Step 2: Create and run migration**

```bash
cd /Users/cheny39/Documents/work/yizhen/3d-print/.worktrees/b2b-quote-cart-mvp
npx prisma migrate dev --name add_wechat_to_user
```

Expected: Migration file created in `prisma/migrations/`, database updated successfully.

- [ ] **Step 3: Verify schema**

```bash
npx prisma db push
```

Expected: "✓ Your database is now in sync with your schema."

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add optional wechat field to user model"
```

---

## Task 2: Validation Schema - Add WeChat to Signup

**Files:**
- Modify: `lib/validations/user.ts`

- [ ] **Step 1: Update signupSchema with wechat field**

Open `lib/validations/user.ts`. Find the signupSchema and add wechat field:

```typescript
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  wechat: z.string().min(2, 'WeChat must be at least 2 characters').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

- [ ] **Step 2: Add profileUpdateSchema for profile updates**

Add a new schema after signupSchema in the same file:

```typescript
export const profileUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  wechat: z.string().min(2, 'WeChat must be at least 2 characters').optional().or(z.literal('')),
});
```

- [ ] **Step 3: Commit**

```bash
git add lib/validations/user.ts
git commit -m "feat: add wechat to signup schema and create profileUpdateSchema"
```

---

## Task 3: Repository - Add updateUser Function

**Files:**
- Modify: `lib/repositories/users.ts`

- [ ] **Step 1: Add updateUser function**

Open `lib/repositories/users.ts`. Add this function after the existing functions:

```typescript
export async function updateUser(
  userId: string,
  data: {
    phone?: string | null;
    wechat?: string | null;
    passwordHash?: string;
  }
) {
  return db.user.update({
    where: { id: userId },
    data: {
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.wechat !== undefined && { wechat: data.wechat || null }),
      ...(data.passwordHash && { passwordHash: data.passwordHash }),
    },
  });
}
```

- [ ] **Step 2: Verify imports**

Ensure `db` is imported from `@/lib/db` at the top of the file.

- [ ] **Step 3: Commit**

```bash
git add lib/repositories/users.ts
git commit -m "feat: add updateUser function to repository"
```

---

## Task 4: Server Action - Create updateUserProfileAction

**Files:**
- Modify: `app/actions/user-auth.ts`

- [ ] **Step 1: Import dependencies at top of file**

Verify these imports exist in `app/actions/user-auth.ts`:

```typescript
'use server';

import { verifyUserSessionValue } from '@/lib/user-session-edge';
import { signupSchema, profileUpdateSchema } from '@/lib/validations/user';
import { createUser, getUserByEmail, getUserById } from '@/lib/repositories/users';
import { updateUser } from '@/lib/repositories/users';
import { hashPassword, comparePassword } from '@/lib/password';
import { cookies } from 'next/headers';
```

- [ ] **Step 2: Add updateUserProfileAction function**

Add this function at the end of `app/actions/user-auth.ts`:

```typescript
export async function updateUserProfileAction(formData: unknown) {
  try {
    // Validate input
    const parsed = profileUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword, phone, wechat } = parsed.data;

    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    if (!sessionCookie?.value) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify session
    const userId = await verifyUserSessionValue(sessionCookie.value);
    if (!userId) {
      return { success: false, error: 'Session expired' };
    }

    // Fetch user
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const passwordMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return {
        success: false,
        fieldErrors: { currentPassword: ['Incorrect password'] },
      };
    }

    // Hash new password if provided
    let passwordHash: string | undefined;
    if (newPassword) {
      passwordHash = await hashPassword(newPassword);
    }

    // Update user
    await updateUser(userId, {
      phone: phone || null,
      wechat: wechat || null,
      ...(passwordHash && { passwordHash }),
    });

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: 'Failed to update profile. Please try again.',
    };
  }
}
```

- [ ] **Step 3: Update signupAction to handle wechat**

Find the signupAction in the same file. Update the `createUser` call to include wechat:

```typescript
const user = await createUser({
  email: parsed.data.email,
  username: parsed.data.username,
  phone: parsed.data.phone || null,
  wechat: parsed.data.wechat || null,  // ADD THIS LINE
  passwordHash: hashedPassword,
});
```

- [ ] **Step 4: Commit**

```bash
git add app/actions/user-auth.ts
git commit -m "feat: add updateUserProfileAction and update signupAction for wechat"
```

---

## Task 5: Signup Form - Add WeChat Field

**Files:**
- Modify: `components/auth/signup-form.tsx`

- [ ] **Step 1: Add wechat state to SignupForm**

Open `components/auth/signup-form.tsx`. In the form state, add wechat after phone:

```typescript
'use client';

import { useState } from 'react';
import { signupAction } from '@/app/actions/user-auth';
import { useRouter } from 'next/navigation';

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone: '',
    wechat: '',  // ADD THIS LINE
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
```

- [ ] **Step 2: Add wechat input field in JSX**

Find the phone input field. After it, add the wechat input:

```tsx
<input
  type="text"
  name="phone"
  placeholder="Phone (optional)"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
/>
{fieldErrors.phone && <p className="text-red-600 text-sm">{fieldErrors.phone[0]}</p>}

{/* ADD WECHAT FIELD */}
<input
  type="text"
  name="wechat"
  placeholder="WeChat (optional)"
  value={formData.wechat}
  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
/>
{fieldErrors.wechat && <p className="text-red-600 text-sm">{fieldErrors.wechat[0]}</p>}
```

- [ ] **Step 3: Include wechat in form submission**

Find the form submission handler. Update it to include wechat:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setFieldErrors({});

  const result = await signupAction({
    email: formData.email,
    username: formData.username,
    phone: formData.phone,
    wechat: formData.wechat,  // ADD THIS LINE
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  });

  // ... rest of handler
};
```

- [ ] **Step 4: Commit**

```bash
git add components/auth/signup-form.tsx
git commit -m "feat: add wechat field to signup form"
```

---

## Task 6: Profile Form Component - Create & Test

**Files:**
- Create: `components/auth/profile-form.tsx`
- Create: `tests/unit/profile-form.test.tsx`

- [ ] **Step 1: Write failing test for ProfileForm component**

Create `tests/unit/profile-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from '@/components/auth/profile-form';

describe('ProfileForm', () => {
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    username: 'testuser',
    phone: '5551234567',
    wechat: 'testweChat',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    quoteRequests: [],
  };

  it('renders form with prefilled values', () => {
    render(<ProfileForm user={mockUser} />);
    
    expect(screen.getByDisplayValue(mockUser.phone)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.wechat)).toBeInTheDocument();
  });

  it('displays field error when action returns error', async () => {
    const mockAction = vi.fn().mockResolvedValue({
      success: false,
      fieldErrors: { currentPassword: ['Incorrect password'] },
    });

    // Mock server action - implementation in component
    render(<ProfileForm user={mockUser} />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Current Password');
    fireEvent.change(currentPasswordInput, { target: { value: 'wrongpass' } });
    
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    render(<ProfileForm user={mockUser} />);
    
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    expect(submitButton).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- profile-form.test.tsx
```

Expected: FAIL - "ProfileForm is not exported from @/components/auth/profile-form"

- [ ] **Step 3: Create ProfileForm component**

Create `components/auth/profile-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { updateUserProfileAction } from '@/app/actions/user-auth';
import type { User } from '@prisma/client';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    phone: user.phone || '',
    wechat: user.wechat || '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    setSuccess(false);

    const result = await updateUserProfileAction(formData);

    if (result.success) {
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        phone: formData.phone,
        wechat: formData.wechat,
      });
    } else if (result.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">Profile updated successfully</div>}

      <div>
        <label className="block text-sm font-medium text-stone-700">Current Password</label>
        <input
          type="password"
          placeholder="Current Password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
          required
        />
        {fieldErrors.currentPassword && <p className="text-red-600 text-sm">{fieldErrors.currentPassword[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">New Password (optional)</label>
        <input
          type="password"
          placeholder="New Password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
        />
        {fieldErrors.newPassword && <p className="text-red-600 text-sm">{fieldErrors.newPassword[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
        />
        {fieldErrors.phone && <p className="text-red-600 text-sm">{fieldErrors.phone[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">WeChat (optional)</label>
        <input
          type="text"
          placeholder="WeChat ID"
          value={formData.wechat}
          onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
        />
        {fieldErrors.wechat && <p className="text-red-600 text-sm">{fieldErrors.wechat[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-stone-800 text-white py-2 rounded-md font-medium hover:bg-stone-900 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- profile-form.test.tsx
```

Expected: PASS (at least the render test should pass; may need adjustment if test setup differs)

- [ ] **Step 5: Commit**

```bash
git add components/auth/profile-form.tsx tests/unit/profile-form.test.tsx
git commit -m "feat: add ProfileForm component with tests"
```

---

## Task 7: Profile Page - Create & Test

**Files:**
- Create: `app/user/profile/page.tsx`

- [ ] **Step 1: Create profile page**

Create `app/user/profile/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyUserSessionValue } from '@/lib/user-session-edge';
import { getUserById } from '@/lib/repositories/users';
import { AuthNav } from '@/components/header/auth-nav';
import { ProfileForm } from '@/components/auth/profile-form';

export const metadata = {
  title: 'User Profile | B2B Quote Cart',
};

export default async function ProfilePage() {
  // Get session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    redirect('/auth/login');
  }

  // Verify session
  const userId = await verifyUserSessionValue(sessionCookie.value);
  if (!userId) {
    redirect('/auth/login');
  }

  // Fetch user
  const user = await getUserById(userId);
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <>
      <AuthNav />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">Profile</h1>

        <div className="space-y-6">
          <div className="bg-stone-50 p-4 rounded-lg">
            <p className="text-sm text-stone-600">Email</p>
            <p className="text-lg font-medium text-stone-900">{user.email}</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-lg">
            <p className="text-sm text-stone-600">Username</p>
            <p className="text-lg font-medium text-stone-900">{user.username}</p>
          </div>

          <div className="border-t border-stone-200 pt-6">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Update Account</h2>
            <ProfileForm user={user} />
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Test manual navigation**

Start dev server and navigate to http://localhost:3000/user/profile while logged in:

```bash
npm run dev
```

Expected: Profile page displays with read-only email/username and update form.

- [ ] **Step 3: Commit**

```bash
git add app/user/profile/page.tsx
git commit -m "feat: add user profile page"
```

---

## Task 8: AuthNav Update - Make Username Clickable Link

**Files:**
- Modify: `components/header/auth-nav.tsx`

- [ ] **Step 1: Update AuthNav to render username as Link**

Open `components/header/auth-nav.tsx`. Find where email is currently rendered as plain text. Replace it with a Link:

```typescript
import Link from 'next/link';

export async function AuthNav() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  let user: User | null = null;

  if (sessionCookie?.value) {
    const userId = await verifyUserSessionValue(sessionCookie.value);
    if (userId) {
      user = await getUserById(userId);
    }
  }

  return (
    <header className="bg-white border-b border-stone-200">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-stone-900">B2B Quote Cart</h1>

        {user ? (
          <Link href="/user/profile" className="text-sm font-medium text-stone-700 hover:text-stone-900">
            {user.username}
          </Link>
        ) : (
          <div className="space-x-4">
            <Link href="/auth/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
              Log In
            </Link>
            <Link href="/auth/signup" className="text-sm font-medium text-stone-700 hover:text-stone-900">
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/header/auth-nav.tsx
git commit -m "feat: make username in header clickable link to profile"
```

---

## Task 9: AuthNav Tests - Update to Verify Link

**Files:**
- Modify: `tests/unit/auth-nav.test.tsx`

- [ ] **Step 1: Update AuthNav test to verify profile link**

Open `tests/unit/auth-nav.test.tsx`. Find the test for authenticated state and update it:

```typescript
it('renders username as link to profile when authenticated', async () => {
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    username: 'testuser',
    phone: null,
    wechat: null,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    quoteRequests: [],
  };

  vi.mocked(getUserById).mockResolvedValue(mockUser);
  vi.mocked(verifyUserSessionValue).mockResolvedValue('1');

  render(await AuthNav());

  const profileLink = screen.getByRole('link', { name: 'testuser' });
  expect(profileLink).toHaveAttribute('href', '/user/profile');
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test -- auth-nav.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/auth-nav.test.tsx
git commit -m "test: update AuthNav test to verify profile link"
```

---

## Task 10: Signup Form Tests - Update for WeChat Field

**Files:**
- Modify: `tests/unit/signup-form.test.tsx`

- [ ] **Step 1: Add test for wechat field**

Open `tests/unit/signup-form.test.tsx`. Add this test:

```typescript
it('renders wechat input field', () => {
  render(<SignupForm />);
  const wechatInput = screen.getByPlaceholderText('WeChat (optional)');
  expect(wechatInput).toBeInTheDocument();
});

it('displays wechat validation error', async () => {
  const mockAction = vi.fn().mockResolvedValue({
    success: false,
    fieldErrors: { wechat: ['WeChat must be at least 2 characters'] },
  });

  // Mock server action in form
  render(<SignupForm />);
  
  const submitButton = screen.getByRole('button', { name: /sign up/i });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText('WeChat must be at least 2 characters')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test -- signup-form.test.tsx
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/signup-form.test.tsx
git commit -m "test: add wechat field tests to signup form"
```

---

## Task 11: Server Action Tests - Test updateUserProfileAction

**Files:**
- Create: `tests/unit/user-auth.test.ts`

- [ ] **Step 1: Write tests for updateUserProfileAction**

Create `tests/unit/user-auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserProfileAction } from '@/app/actions/user-auth';
import * as userRepo from '@/lib/repositories/users';
import * as passwordLib from '@/lib/password';
import * as sessionLib from '@/lib/user-session-edge';
import { cookies } from 'next/headers';

vi.mock('@/lib/repositories/users');
vi.mock('@/lib/password');
vi.mock('@/lib/user-session-edge');
vi.mock('next/headers');

describe('updateUserProfileAction', () => {
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    username: 'testuser',
    phone: '5551234567',
    wechat: 'oldwechat',
    passwordHash: 'hashedpass',
    createdAt: new Date(),
    updatedAt: new Date(),
    quoteRequests: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success when profile updated with correct password', async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'session123' }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
    vi.mocked(sessionLib.verifyUserSessionValue).mockResolvedValue('1');
    vi.mocked(userRepo.getUserById).mockResolvedValue(mockUser);
    vi.mocked(passwordLib.comparePassword).mockResolvedValue(true);
    vi.mocked(userRepo.updateUser).mockResolvedValue(mockUser);

    const result = await updateUserProfileAction({
      currentPassword: 'correctpass',
      newPassword: '',
      phone: '5559876543',
      wechat: 'newwechat',
    });

    expect(result.success).toBe(true);
    expect(userRepo.updateUser).toHaveBeenCalledWith('1', {
      phone: '5559876543',
      wechat: 'newwechat',
    });
  });

  it('returns error when current password is incorrect', async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'session123' }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
    vi.mocked(sessionLib.verifyUserSessionValue).mockResolvedValue('1');
    vi.mocked(userRepo.getUserById).mockResolvedValue(mockUser);
    vi.mocked(passwordLib.comparePassword).mockResolvedValue(false);

    const result = await updateUserProfileAction({
      currentPassword: 'wrongpass',
      newPassword: '',
      phone: '5559876543',
      wechat: 'newwechat',
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.currentPassword).toEqual(['Incorrect password']);
  });

  it('hashes new password when provided', async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'session123' }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
    vi.mocked(sessionLib.verifyUserSessionValue).mockResolvedValue('1');
    vi.mocked(userRepo.getUserById).mockResolvedValue(mockUser);
    vi.mocked(passwordLib.comparePassword).mockResolvedValue(true);
    vi.mocked(passwordLib.hashPassword).mockResolvedValue('newhash');
    vi.mocked(userRepo.updateUser).mockResolvedValue(mockUser);

    await updateUserProfileAction({
      currentPassword: 'correctpass',
      newPassword: 'newpassword123',
      phone: '',
      wechat: '',
    });

    expect(passwordLib.hashPassword).toHaveBeenCalledWith('newpassword123');
    expect(userRepo.updateUser).toHaveBeenCalledWith('1', expect.objectContaining({
      passwordHash: 'newhash',
    }));
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test -- user-auth.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/user-auth.test.ts
git commit -m "test: add updateUserProfileAction tests"
```

---

## Task 12: Full Test Suite & Build Verification

**Files:**
- (All files modified/created in previous tasks)

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: All tests pass (should be 43 + 10 new tests ≈ 53 passing)

- [ ] **Step 2: Build verification**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Manual testing - Complete signup to profile flow**

```bash
npm run dev
```

1. Navigate to http://localhost:3000/auth/signup
2. Sign up with: email, username, phone, **new WeChat field**, password
3. Verify database stores wechat value
4. Log in with new account
5. Click username in header
6. Verify profile page loads with read-only email/username
7. Update profile: change phone, WeChat, or password (with current password verification)
8. Verify changes persisted
9. Log in again to verify password change works if attempted

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete user profile and account management phase 2

- add wechat field to database
- extend signup with optional wechat field
- create profile page at /user/profile
- implement profile update form with password verification
- make username in header clickable link to profile
- add comprehensive tests (unit + component)
- all 53 tests passing
- build succeeds"
```

- [ ] **Step 5: Verify git log**

```bash
git log --oneline | head -15
```

Expected: Recent commits show the task-by-task implementation with clear messages.

---

## Success Criteria Verification

- ✅ User can click username in header → navigates to `/user/profile`
- ✅ Profile page shows read-only email and username
- ✅ Profile form allows updating: password (with current password verification), phone, WeChat
- ✅ Signup form includes optional WeChat field
- ✅ WeChat stored in database and persisted
- ✅ All existing tests pass + 10+ new tests
- ✅ Build succeeds with no errors
- ✅ Manual end-to-end flow tested and working

---
