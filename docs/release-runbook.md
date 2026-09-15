# iOS Release Runbook — luPilates

Ordered, state-aware checklist for getting `com.lucreation.cms` from this working tree
to TestFlight and then the App Store. Reflects repo state as of 2026-08-28.

For background and rationale see `app-store-release-guide.md`. This file is the
do-it-in-this-order version.

- Expo SDK 54 / React Native 0.81.5
- Bundle ID: `com.lucreation.cms`  ·  Slug: `lu-pilates`  ·  Version: 1.0.0
- Nine `EXPO_PUBLIC_*` vars required at build time (see `.env`)

---

## Phase 0 — Commit what's in the tree

Nothing below is reproducible until the working tree is committed. There are 13
modified files and 2 untracked ones right now, including the auth fix.

```bash
git add -A
git commit -m "fix(auth): read EXPO_PUBLIC_* statically so Expo inlines them in release builds"
```

**Why first:** EAS builds from a git archive of your project. Uncommitted changes
are not uploaded by default, so an uncommitted auth fix produces a cloud build with
the bug still in it.

---

## Phase 1 — Link the EAS project

`app.json` has no `extra.eas.projectId`, and `eas.json` is untracked. This tree has
never been built by EAS under the `lu-pilates` slug.

```bash
npx eas-cli login                 # if not already authenticated
npx eas-cli project:info          # shows a linked project, or errors if none
npx eas-cli init                  # creates/links, writes extra.eas.projectId
git add app.json eas.json && git commit -m "chore(eas): link EAS project"
```

If `project:info` shows an existing project you want to reuse, skip `init` and paste
its ID into `app.json` under `expo.extra.eas.projectId` instead.

**Gate:** `app.json` contains a `projectId`. `eas.json` is committed.

---

## Phase 2 — Push env vars as EAS secrets

`.env` is gitignored (`.gitignore:33-36`), so the cloud builder never sees it. Without
this step the Release bundle gets `undefined` for every var and the app dies on the
login screen — the exact failure diagnosed on 2026-08-28.

```bash
while IFS='=' read -r k v; do
  case "$k" in ''|\#*) continue ;; esac
  npx eas-cli secret:create --name "$k" --value "$v" --scope project --force
done < .env

npx eas-cli secret:list
```

**Gate:** `secret:list` shows all nine:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

Secrets are scoped per EAS project. Ones set against an older project do not carry over.

---

## Phase 3 — `app.json` metadata

Verified against the source on 2026-08-28: **the two items in
`app-store-release-guide.md` §1.2/§1.3 do not apply to this app.**

**Usage descriptions — not needed.** No camera, photo library, location, contacts, or
`expo-calendar` usage anywhere in `app/`, `components/`, `features/`, `hooks/`, `lib/`
or `store/`. The only permission-adjacent dependency is `expo-auth-session`, which
needs none. The grep hits for "Calendar" are the app's own calendar UI components, not
the iOS Calendar API. iOS notification permission requires no Info.plist string.
Adding unused usage descriptions invites App Review questions about permissions the
app never requests — leave them out.

**`expo-notifications` icon/color — Android-only.** The config plugin's `icon` and
`color` props configure the Android status-bar notification icon and accent color; they
do nothing on iOS. `assets/images/notification-icon.png` doesn't exist either. Leave
the plugin as the bare string `"expo-notifications"` for an iOS-only release. Revisit
when shipping Android.

**What was actually worth adding — done.** `ios.infoPlist.ITSAppUsesNonExemptEncryption:
false`, which declares the app uses only exempt encryption (HTTPS). Without it, App
Store Connect asks the export-compliance question on **every** TestFlight upload and
holds the build until answered. This is accurate here: the app talks to Firebase and
Google over HTTPS and implements no custom crypto.

`ios.buildNumber` is **not** needed — `eas.json` sets `"appVersionSource": "remote"`,
so EAS owns the build number and `production.autoIncrement` bumps it each build.

**Gate:** `npx expo-doctor` passes.

---

## Phase 4 — Apple credentials

```bash
npx eas-cli credentials --platform ios
```

Let EAS manage them unless you have a reason not to. You need:

- **Distribution certificate** — EAS generates it.
- **Provisioning profile** — EAS generates it.
- **APNs key** — required because the app uses `expo-notifications`. Without it the
  build succeeds but push silently never arrives in TestFlight or production.

The app record must exist in App Store Connect first (Phase 5) for submission, though
credentials can be set up before that.

**Gate:** `credentials` lists a distribution cert, a profile, and a push key.

---

## Phase 5 — App Store Connect record

At https://appstoreconnect.apple.com → My Apps → **+** → New App:

- Platform: iOS · Bundle ID: `com.lucreation.cms` · SKU: any unique string
- Fill: name, subtitle, category, privacy policy URL, support URL
- **App Privacy** questionnaire — required before any build can be reviewed. The app
  collects email and name via Google Sign-In and stores profiles in Firestore;
  declare that accurately.
- Screenshots: 6.7" and 6.5" iPhone sizes at minimum.

**Gate:** App record exists and shows "Prepare for Submission".

---

## Phase 6 — Preview build (validate the cloud build first)

Before spending a production build slot, confirm the cloud builder resolves the env
vars correctly. This is the step that catches a Phase 2 mistake cheaply.

```bash
npx eas-cli build --platform ios --profile preview
```

Install the resulting build on a registered device (`eas device:create` first if the
device isn't registered) and confirm the **login screen renders** — that alone proves
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` made it into the bundle.

**Gate:** Login screen renders, Google Sign-In completes, no ErrorBoundary screen.

---

## Phase 7 — Production build

```bash
npx eas-cli build --platform ios --profile production
```

Takes 15-30 min in the queue. `autoIncrement` bumps the build number automatically.

**Gate:** Build status "finished", `.ipa` artifact available.

---

## Phase 8 — Submit to TestFlight

```bash
npx eas-cli submit --platform ios --latest
```

Then in App Store Connect → TestFlight:

1. Wait for processing (10-30 min; you get an email).
2. Export compliance — no prompt, since Phase 3 set
   `ITSAppUsesNonExemptEncryption: false`. If you are ever asked, the app uses HTTPS
   only, which is exempt.
3. Add internal testers (up to 100, no review needed) and install.

**Gate:** Build installable via TestFlight on a device that has never run a dev build.

### Test on that clean install

- Google Sign-In end to end, including a brand-new account
- Push notification received while backgrounded **and** while killed
- Sign out and back in
- Cold launch with no network

---

## Phase 9 — App Store submission

1. App Store Connect → your app → attach the TestFlight build to the version.
2. Fill "What's New", review notes, and **demo account credentials** — reviewers
   cannot get past a Google-only login without them. This is the single most common
   rejection cause for auth-gated apps.
3. Submit for Review.

Review typically takes 24-48 hours.

---

## After release

- Watch Firebase Crashlytics / App Store Connect crash reports for the first 48 hours.
- Version bumps: change `expo.version` in `app.json` for user-facing versions;
  build numbers auto-increment.
- Keep `.env` and EAS secrets in sync — drift between them reproduces the original bug
  in the opposite direction (works locally, fails in the cloud).

---

## Failure modes worth recognizing

| Symptom | Cause |
|---|---|
| ErrorBoundary on login screen in a release build | An `EXPO_PUBLIC_*` var missing from EAS secrets, or read via computed `process.env[name]` |
| Build fails at "Resolving credentials" | No distribution cert, or bundle ID mismatch with App Store Connect |
| Push works in dev, silent in TestFlight | No APNs key in EAS credentials |
| Submission rejected, "could not sign in" | No demo account in review notes |
| Cloud build has old code | Changes not committed before `eas build` |
