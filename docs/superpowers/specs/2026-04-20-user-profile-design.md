# User Profile & Account Management Design

> **For agentic workers:** This design has been approved by the user. Proceed to invoke writing-plans skill after user confirms this spec.

**Goal:** Add user profile page with editable account settings (password, phone, WeChat), clickable username in header, and optional WeChat field in signup.

**Architecture:** Server-side profile page reading session, unified update form with client-side validation, server action handling profile updates with password verification.

**Tech Stack:** Next.js 15, React server/client components, Prisma ORM, Zod validation, Tailwind CSS, existing auth patterns (bcryptjs, HMAC sessions).

---

## Overview

Create a user profile experience where:
1. **Header:** Username becomes a clickable link to `/user/profile` instead of plain email text
2. **Signup:** Add optional WeChat field to registration
3. **Profile Page:** Display and edit email (read-only), phone, WeChat, and password with existing password verification

---

## Database Schema Changes

**User Model Addition:**
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String
  phone         String?
  wechat        String?        // NEW: optional
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  quoteRequests QuoteRequest[]

  @@index([email])
}
```

**Changes:** Add `wechat String?` field to User model (optional).

---

## Signup Form Updates

**Fields:** Add WeChat (optional) field to signup form
- Email (required, unique)
- Username (required)
- Phone (optional)
- WeChat (optional) — NEW
- Password (required)
- Confirm Password (required)

**Validation Schema:** Extend `signupSchema` in `lib/validations/user.ts`
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

**Server Action Update:** `signupAction` in `app/actions/user-auth.ts` now accepts and stores wechat.

---

## Profile Page

**Route:** `/user/profile`

**Access:** Protected — requires valid user session; redirects to `/auth/login` if not authenticated.

**Page Structure:**

1. **Header Navigation:** AuthNav component (displays username as clickable link to profile)

2. **Profile Display Section:**
   - Email: Read-only display (shown at top, not editable since it's the auth identifier)
   - Username: Display only (not editable)

3. **Update Form Section:**
   - Current Password (required for any update, for security verification)
   - New Password (optional — leave blank to keep current password)
   - Phone (optional, can be empty)
   - WeChat (optional, can be empty)
   - Submit button: "Update Profile"
   - Success/error messages displayed

**Behavior:**
- Form shows current values pre-filled (except password fields)
- Current password is always required to update any field
- If user provides new password, it's validated and hashed before storage
- If new password is blank, existing password unchanged
- Phone and WeChat can be updated independently (either or both can be blank)
- Success redirects to profile page with confirmation message
- Errors show field-level messages (e.g., "Password too short", "Current password incorrect")

---

## Server Actions

**New Action:** `updateUserProfileAction` in `app/actions/user-auth.ts`

**Input:**
```typescript
{
  currentPassword: string (required, for verification)
  newPassword?: string (optional, for password change)
  phone?: string (optional)
  wechat?: string (optional)
}
```

**Behavior:**
1. Verify user session exists (get userId from session)
2. Fetch user from database
3. Verify current password matches user's passwordHash
4. If new password provided:
   - Validate new password (min 8 chars)
   - Hash new password
5. Update user record with: phone, wechat, (optional: passwordHash)
6. Return success or error with field-level messages

**Error Handling:**
- Invalid current password: `{ fieldErrors: { currentPassword: ['Incorrect password'] } }`
- New password too short: `{ fieldErrors: { newPassword: ['Password must be at least 8 characters'] } }`
- Database errors: Generic "Failed to update profile" message

---

## UI Components

**AuthNav Component Update:**
- Current: Shows email as plain text `<span>{user.email}</span>`
- New: Make email a link to `/user/profile`
  ```tsx
  <Link href="/user/profile" className="text-sm font-medium text-stone-700 hover:text-stone-900">
    {user.email}
  </Link>
  ```
- Update test to verify Link renders with correct href

**New: ProfileForm Component** (`components/auth/profile-form.tsx`)
- Client component (uses `'use client'` for form submission and state)
- Manages: loading, error, fieldErrors states
- Calls `updateUserProfileAction` server action
- Renders form with current values pre-filled
- Shows error/success messages
- Disables submit button while loading

**Profile Page** (`app/user/profile/page.tsx`)
- Server component
- Reads session, redirects if not authenticated
- Fetches full user data from database
- Displays read-only email/username
- Renders ProfileForm component

---

## Validation & Errors

**Field-Level Errors:**
- `currentPassword`: "Password is required", "Incorrect password"
- `newPassword`: "Password must be at least 8 characters"
- `phone`: "Phone must be at least 10 digits" (if provided)
- `wechat`: "WeChat must be at least 2 characters" (if provided)

**Generic Errors:**
- Session expired: Redirect to `/auth/login`
- Database error: "Failed to update profile. Please try again."

---

## Testing Strategy

**Unit Tests:**
- `updateUserProfileAction` with correct current password succeeds
- `updateUserProfileAction` with wrong current password fails
- `updateUserProfileAction` updates each field independently
- Password hashing is called when new password provided
- ValidationSchema catches invalid inputs

**Component Tests (ProfileForm):**
- Renders form with pre-filled values
- Displays field errors when action returns errors
- Disables submit button during loading
- Shows success message on successful update
- Form submission calls updateUserProfileAction with form data

**Component Tests (AuthNav):**
- Username/email is a Link to `/user/profile` when authenticated
- Link doesn't render when unauthenticated

**Integration Tests:**
- Full flow: signup with WeChat → log in → navigate to profile → update phone and WeChat → verify changes in database

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `prisma/schema.prisma` | Add `wechat String?` to User model | Modify |
| `lib/validations/user.ts` | Extend `signupSchema` with wechat field | Modify |
| `app/actions/user-auth.ts` | Update `signupAction`, add `updateUserProfileAction` | Modify |
| `components/auth/signup-form.tsx` | Add WeChat field to form | Modify |
| `components/auth/profile-form.tsx` | NEW: Profile update form component | Create |
| `components/header/auth-nav.tsx` | Make username/email a Link to `/user/profile` | Modify |
| `app/user/profile/page.tsx` | NEW: Profile page | Create |
| `lib/repositories/users.ts` | Add `updateUser` function | Modify |
| `tests/unit/profile-form.test.tsx` | NEW: Profile form tests | Create |
| `tests/unit/signup-form.test.tsx` | Update to test WeChat field | Modify |
| `tests/unit/auth-nav.test.tsx` | Update to test profile link | Modify |

---

## Success Criteria

1. ✅ User can click username in header → navigates to `/user/profile`
2. ✅ Profile page shows read-only email and username
3. ✅ Profile form allows updating: password (with current password verification), phone, WeChat
4. ✅ Signup form includes optional WeChat field
5. ✅ WeChat stored in database and persisted
6. ✅ All existing tests pass
7. ✅ New tests cover profile updates and validation
8. ✅ Build succeeds with no errors

---

## Notes

- Email cannot be changed (it's the login identifier) — remains read-only
- Current password required for any profile update (security best practice)
- Password field in profile is optional — user can update other fields without changing password
- WeChat optional everywhere (signup and profile) — users can leave blank
- All changes follow existing code patterns: server actions, Zod validation, field-level errors, TDD approach
