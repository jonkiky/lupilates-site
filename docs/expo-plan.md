# Expo Plan

## Objective
Build the Pilates training app in `expo/my-app` using Expo Router + Firebase + Expo Notifications, with full USER and ADMIN workflows.

## References
- UI mock: `docs/UI/pilates-app-ui.html`
- Architecture: `docs/system-design-expo-firebase-notifications.md`
- Implementation spec: `docs/expo-implemnation doc.md`

## Environment Setup

### Prerequisites
- Install Node.js 20 LTS (recommended).
- Use one package manager consistently (`npm` is used below).
- Install Expo CLI tools through `npx` (no global install required).
- Install Xcode (iOS simulator) and/or Android Studio (Android emulator) if running native simulators.
- Install and login to Firebase CLI:
  - `npm install -g firebase-tools`
  - `firebase login`

### Local Project Bootstrap
1. Open project root: `expo/my-app`.
2. Install dependencies:
  - `npm install`
3. Start app:
  - `npm run start`
4. Optional platform runners:
  - `npm run ios`
  - `npm run android`
  - `npm run web`
5. Validate baseline quality gate:
  - `npm run lint`

### Environment Variables
Create `.env.local` in `expo/my-app` and define Expo public Firebase keys:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Notes:
- Only non-secret client config should use `EXPO_PUBLIC_*`.
- Restart Expo after env updates.
- Firebase app initialization should fail fast when any required key is missing.

## Firebase Setup (Step by Step)

### 1. Create Firebase Project
1. Go to Firebase Console and create project (for example: `pilates-training-app`).
2. Disable Google Analytics for dev project if not needed.
3. Add Web app in project settings and copy Firebase config values.
4. Paste values into `.env.local` using `EXPO_PUBLIC_FIREBASE_*` keys.

### 2. Configure Authentication
1. In Firebase Console, go to `Authentication -> Sign-in method`.
2. Enable `Google` provider.
3. Set project support email.
4. In Expo app, configure Google sign-in flow using Firebase credential exchange (`signInWithGoogle`).
5. Verify first login creates Firebase Auth user.

### 3. Configure Cloud Firestore
1. Create Firestore database in `Production mode`.
2. Select region close to target users.
3. Create required collections:
  - `users`
  - `training_sessions`
  - `notification_preferences`
  - `device_tokens`
4. Seed at least one `ADMIN` user document in `users/{uid}` after first login.

### 4. Add Initial Firestore Security Rules
1. Open `Firestore Database -> Rules`.
2. Add RBAC-safe starter rules for USER and ADMIN behavior.
3. Publish and verify:
  - USER can read/write only allowed self-scope data.
  - ADMIN can manage sessions and users.
4. Iterate rules as features land in each milestone.

### 5. Register App Runtime Firebase Modules
1. Implement `lib/firebase/app.ts` to initialize Firebase app from env vars.
2. Implement `lib/firebase/auth.ts` for auth instance exports.
3. Implement `lib/firebase/firestore.ts` for Firestore instance exports.
4. Implement `lib/firebase/collections.ts` typed collection helpers.
5. Add converters in `lib/firebase/converters.ts` once domain types are finalized.

### 6. Verify End-to-End Firebase Connectivity
1. Launch app and sign in with Google.
2. Confirm `users/{uid}` profile bootstrap read works.
3. Create a test session as ADMIN and verify real-time listener updates.
4. Update notification preference and verify write to `notification_preferences/{uid}`.
5. Capture and fix any `permission-denied` errors before feature expansion.

### 7. Optional: Local Emulator Setup (Recommended for Safer Iteration)
1. Initialize Firebase in repo:
  - `firebase init firestore`
2. Start emulator:
  - `firebase emulators:start`
3. Add development switch in Firebase modules to connect app to emulator when enabled.
4. Run rule validation against emulator before publishing production rules.

## Delivery Strategy
- Phase-based delivery to keep the app runnable at all times.
- Build vertical slices (auth -> user -> admin -> notifications).
- Finish each phase with verification before moving to next phase.

## Milestones

### M1. Foundation and Project Setup
Goal: Prepare architecture, shared types, and app skeleton.

Tasks:
- Create route groups in Expo Router:
  - `app/auth/*`
  - `app/user/*`
  - `app/admin/*`
  - `app/modal/*`
- Add shared constants and enums:
  - `constants/routes.ts`
  - `constants/enums.ts`
  - `constants/statusColors.ts`
- Add domain types:
  - `types/domain.ts`
  - `types/dto.ts`
- Setup redux store scaffolding:
  - `store/index.ts`
  - `store/rootReducer.ts`
  - `store/hooks.ts`
- Add Firebase initialization modules:
  - `lib/firebase/app.ts`
  - `lib/firebase/auth.ts`
  - `lib/firebase/firestore.ts`
  - `lib/firebase/collections.ts`

Definition of done:
- App starts successfully on iOS/Android/Web.
- Route groups compile with no navigation errors.
- Firebase app can initialize from env vars.

### M2. Authentication and Role Routing
Goal: Implement Google sign-in and role-based landing.

Tasks:
- Build `app/auth/login.tsx` UI from mock.
- Implement auth services:
  - `signInWithGoogle`
  - `bootstrapUserProfile`
  - `routeAfterAuth`
  - `signOutAndCleanup`
- Add auth state management:
  - `features/auth/auth.slice.ts`
  - `features/auth/auth.selectors.ts`
  - `features/auth/auth.service.ts`
- Add route guards/hooks:
  - `hooks/useAuthGate.ts`
  - `hooks/useRoleRoute.ts`

Definition of done:
- Google sign-in works.
- Role in `users/{uid}` routes user to correct app area.
- Unauthenticated users are redirected to login.

### M3. User Experience (Dashboard, Calendar, Settings)
Goal: Deliver all USER pages from the UI design.

Tasks:
- Build user tab layout:
  - `app/user/(tabs)/_layout.tsx`
  - `app/user/(tabs)/dashboard.tsx`
  - `app/user/(tabs)/calendar.tsx`
- Build settings page:
  - `app/user/settings.tsx`
- Build session detail modal:
  - `app/modal/session/[sessionId].tsx`
- Implement session listener logic for USER:
  - `listenUserSessions`
  - `selectCompletedClassCount`
  - `selectNextUpcomingSession`
  - `selectSessionsGroupedByLocalDate`
- Implement reusable UI components:
  - `components/session/SessionCard.tsx`
  - `components/calendar/CalendarMonthGrid.tsx`
  - `components/settings/NotificationToggle.tsx`

Definition of done:
- Dashboard shows completed count and next session.
- Calendar renders by month with date markers.
- Session detail modal opens from calendar.
- Settings screen displays and updates reminder preferences.

### M4. Admin Experience (Calendar, Sessions, Users)
Goal: Deliver all ADMIN pages from the UI design.

Tasks:
- Build admin tab layout:
  - `app/admin/(tabs)/_layout.tsx`
  - `app/admin/(tabs)/calendar.tsx`
  - `app/admin/(tabs)/users.tsx`
  - `app/admin/(tabs)/settings.tsx` (account info and sign out)
- Build session management routes:
  - `app/admin/session/create.tsx`
    - Accepts optional `date` query param to prefill the date field (used when re-tapping a selected date on the calendar)
  - `app/admin/session/[sessionId]/edit.tsx`
- Add calendar re-tap shortcut: tapping an already-selected date navigates to Create Session with the date prefilled
- Build user management route:
  - `app/admin/user/[uid]/edit.tsx`
- Implement admin data operations:
  - `listenAdminSessions`
  - `createSession`
  - `updateSession`
  - `cancelSession`
  - `listenUsers`
  - `updateUser`

Definition of done:
- Admin can create/edit/cancel sessions.
- Admin calendar updates in real time.
- Admin can search/filter users and update profile/status.
- Admin can sign out from the Settings tab.

### M5. Notifications and Reminder Scheduler
Goal: Complete local reminders and device token registration.

Tasks:
- Implement permissions and token registration:
  - `ensureNotificationPermission`
  - `upsertDeviceToken`
- Implement scheduler:
  - `buildReminderPlan`
  - `syncSessionReminders`
  - deterministic ids in `notificationIds.ts`
- Wire scheduler trigger points:
  - app startup
  - session snapshot change
  - preference update
  - timezone/date boundary change

Definition of done:
- Notification preferences persist in Firestore.
- Local reminders are scheduled for `24H`, `1H`, and `BOTH`.
- Stale reminders are canceled after session updates.

### M6. Hardening, QA, and Release Readiness
Goal: Stabilize behavior, validate rules, and prepare for release.

Tasks:
- Add validation schemas (`zod`) for session/user/preference payloads.
- Add loading/empty/error states for all screens.
- Add Firestore error handling for permission-denied writes.
- Verify offline behavior (read cache + write replay).
- Add integration smoke tests for critical flows:
  - User sign-in -> dashboard -> calendar -> settings
  - Admin sign-in -> create/edit session -> user update
- Final lint + type-check + manual test pass on iOS/Android.

Definition of done:
- No blocker defects in critical flows.
- Rules-based authorization behaves as expected.
- Build is stable across target platforms.

## Task Backlog (Execution Order)

### Sprint 1: Core Setup
- [ ] Setup route groups and root layouts
- [ ] Setup Firebase modules
- [ ] Setup Redux store and base slices
- [ ] Add domain types and enums

### Sprint 2: Auth and Guards
- [ ] Implement login screen
- [ ] Implement Google auth service
- [ ] Implement profile bootstrap
- [ ] Implement role routing and guards

### Sprint 3: User App
- [ ] Implement user tab navigation
- [ ] Implement dashboard screen
- [ ] Implement calendar screen
- [ ] Implement session detail modal
- [ ] Implement settings and preference writes

### Sprint 4: Admin App
- [ ] Implement admin tab navigation
- [ ] Implement admin calendar page
- [ ] Implement create session page
- [ ] Implement edit session page
- [ ] Implement users list and edit user page

### Sprint 5: Notifications
- [ ] Implement permission flow
- [ ] Implement device token upsert
- [ ] Implement reminder scheduler
- [ ] Implement stale reminder cancellation

### Sprint 6: Stabilization
- [ ] Add validation and error surfaces
- [ ] Add offline and retry handling
- [ ] Run lint/typecheck/fix issues
- [ ] Execute test checklist and regression pass

## Functional Test Checklist

Auth:
- [ ] New user can sign in with Google.
- [ ] Existing user lands in correct role-based area.
- [ ] Sign-out returns to login and clears session state.

User Flow:
- [ ] Dashboard stats are correct.
- [ ] Next session card updates after admin edits.
- [ ] Calendar month navigation loads correct sessions.
- [ ] Session modal shows accurate details.
- [ ] Settings changes update preferences and reminders.

Admin Flow:
- [ ] Admin can create session for selected user.
- [ ] Admin can edit status/time/notes.
- [ ] Cancelled sessions stop appearing as scheduled.
- [ ] User list search and status filter work.
- [ ] User edit saves username/email/status changes.

Notifications:
- [ ] Permission denied flow is handled.
- [ ] 24H reminder schedules correctly.
- [ ] 1H reminder schedules correctly.
- [ ] BOTH schedules exactly two reminders.
- [ ] Session update/cancel removes stale reminders.

## Risks and Mitigations

Risk: Firestore rules reject valid writes during development.
- Mitigation: Add rule test cases and log explicit error codes in UI.

Risk: Timezone causes wrong reminder trigger times.
- Mitigation: Store UTC timestamps and use timezone utilities consistently.

Risk: Duplicate reminders after repeated snapshot updates.
- Mitigation: Use deterministic notification IDs and idempotent sync logic.

Risk: Large listener scopes affect performance.
- Mitigation: Query bounded month windows only; paginate user list when needed.

## Immediate Next 10 Tasks
- [ ] Create `lib/firebase/*` modules
- [ ] Create `types/domain.ts` and `constants/enums.ts`
- [ ] Create `store/index.ts`, `rootReducer.ts`, `hooks.ts`
- [ ] Implement `app/auth/login.tsx`
- [ ] Implement `features/auth/auth.service.ts`
- [ ] Implement `hooks/useAuthGate.ts`
- [ ] Implement `app/user/(tabs)/_layout.tsx`
- [ ] Implement `app/user/(tabs)/dashboard.tsx`
- [ ] Implement `app/user/(tabs)/calendar.tsx`
- [ ] Implement `app/user/settings.tsx`
