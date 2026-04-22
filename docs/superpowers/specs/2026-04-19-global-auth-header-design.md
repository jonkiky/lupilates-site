# Global Auth-Aware Header Design

## Overview

Add a shared header component that displays authentication state across public and authenticated pages. Authenticated users see their username and a logout button; unauthenticated users see login/signup links.

## Scope

**Pages affected:**
- `/` (home page) - Replace hardcoded auth links
- `/quote-cart` (quote cart) - Add header (currently missing)
- `/user/dashboard` (user dashboard) - Replace isolated logout button

**Not included:** Auth pages (`/auth/login`, `/auth/signup`) - these remain as-is without auth navigation

## Requirements

### Functional Requirements

1. **Header Component** - Display on designated pages with responsive layout
2. **Authentication Detection** - Read user session from cookies using existing session verification
3. **Conditional Rendering** - Show different UI based on auth state:
   - **Authenticated:** Username (or email) + Logout button
   - **Not authenticated:** Login link + Sign up button
4. **Logout Functionality** - Clicking logout triggers existing `logoutAction` server action
5. **Navigation Links** - Login and signup links use standard anchor tags or Next.js `Link` components

### Non-Functional Requirements

1. **Consistency** - Match existing design system (Tailwind classes, spacing, colors)
2. **Accessibility** - Semantic HTML, proper button types, form wrapper for logout
3. **Performance** - Server-rendered component reading session synchronously (no extra fetches)
4. **Maintainability** - Simple, focused component with clear responsibilities

## Architecture

### Component Design

**File:** `components/header/auth-nav.tsx`

A server-only component that accepts:
- `user` prop (object with `userId` and optional `email`/`username`, or `null`)

Returns JSX with:
- Logo/branding on the left (B2B Quote Cart)
- Auth section on the right:
  - If authenticated: username display + logout form button
  - If not: login link + signup button

**Why server-side component:**
- Reads session directly on each page (no extra context/providers needed)
- Simplest integration path for existing code
- Session verification happens once per page load

### Data Flow

1. Each page (`page.tsx`) reads the user session:
   ```
   cookies() → USER_SESSION_COOKIE_NAME → verifyUserSessionValue()
   ```
2. If session exists and is valid, extracts userId (and optionally email/username from database)
3. Passes user object (or null) to `<AuthNav user={user} />`
4. Component renders appropriate UI

### Error Handling

- If session verification fails or user not found: treat as unauthenticated (show login/signup links)
- No error alerts/toasts - graceful fallback to unauthenticated state
- Each page's existing error handling remains unchanged

## File Changes Summary

### New Files
- `components/header/auth-nav.tsx` - Auth-aware header component

### Modified Files
- `app/page.tsx` - Import and use `AuthNav` instead of hardcoded links
- `app/quote-cart/page.tsx` - Add `AuthNav` at top of main section
- `app/user/dashboard/page.tsx` - Replace isolated logout button with `AuthNav`

### Styling
- Reuse existing Tailwind classes from current header (stones, spacing, hover states)
- Keep responsive design (sm: breakpoints where applicable)
- Match font sizes and weights from existing components

## Testing

### Component Tests
- AuthNav with authenticated user prop renders username and logout button
- AuthNav with null user prop renders login/signup links
- Logout button form submits to correct action
- Links have correct href values

### Integration Tests
- Home page renders AuthNav correctly when authenticated and unauthenticated
- Quote cart page renders AuthNav correctly
- User dashboard page renders AuthNav instead of isolated logout button

### Manual Testing
- Navigate to `/` logged out → see login/signup links
- Log in → navigate to `/` → see username and logout
- Navigate to `/quote-cart` → see correct auth state
- Navigate to `/user/dashboard` → see username and logout (replaces old button)
- Click logout → session clears, redirect to home, see login/signup links again

## Success Criteria

1. ✅ AuthNav component created and displays correctly on three pages
2. ✅ Authenticated users see username and logout button
3. ✅ Unauthenticated users see login/signup links  
4. ✅ Logout functionality works (existing logoutAction)
5. ✅ No style breaks or layout issues
6. ✅ All existing tests pass
7. ✅ Responsive design works on mobile/desktop

## Open Questions Resolved

- **Auth pages:** Not included - user explicitly requested only home, quote-cart, and user/dashboard pages
- **Username vs email:** Component flexible - can display either, implementation will use available data from session

## Design Review Notes

This design keeps each page independent for session reading (no layout wrapper needed), reuses existing session infrastructure, and provides a simple focused component for the header UI. The approach mirrors the user dashboard's current logout pattern but makes it global and consistent.
