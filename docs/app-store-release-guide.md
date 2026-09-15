# App Store Release & Testing Guide

## Prerequisites

- [x] Apple Developer Account ($99/year) — https://developer.apple.com/programs/
- [ ] Expo account — https://expo.dev/signup
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in to EAS: `eas login`

---

## 1. App Configuration

### 1.1 Update `app.json`

Ensure the following fields are set correctly before building:

| Field | Current Value | Action Needed |
|---|---|---|
| `name` | `lu-training` | Change to your real app name (e.g., `Pilates Training`) |
| `slug` | `lu-training` | Change to match (e.g., `pilates-training`) |
| `version` | `1.0.0` | Set release version |
| `ios.bundleIdentifier` | `com.lucreation.cms` | Verify this matches App Store Connect |
| `icon` | `./assets/images/icon.png` | Provide a 1024×1024 app icon |

### 1.2 Add Missing App Store Metadata in `app.json`

Add under `expo.ios`:

```json
{
  "expo": {
    "ios": {
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "...",
        "NSPhotoLibraryUsageDescription": "..."
      }
    }
  }
}
```

> Only include usage descriptions for permissions your app actually uses. Remove any you don't need.

### 1.3 Add `expo-notifications` Plugin

Your app uses `expo-notifications` but it's not listed in `app.json` plugins. Add it:

```json
"plugins": [
  "expo-router",
  ["expo-splash-screen", { ... }],
  "expo-web-browser",
  [
    "expo-notifications",
    {
      "icon": "./assets/images/notification-icon.png",
      "color": "#4F46E5"
    }
  ]
]
```

---

## 2. EAS Build Setup

### 2.1 Initialize EAS

```bash
eas build:configure
```

This creates `eas.json` with build profiles.

### 2.2 Recommended `eas.json`

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 2.3 Set Environment Variables on EAS

Your app reads Firebase config from env vars. Set them on EAS so builds can access them:

```bash
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your_value" --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your_value" --scope project
```

> **Important:** `EXPO_PUBLIC_*` secrets are embedded into the JS bundle at build time. They are client-side config, not true secrets.

> **Important:** Read these vars only as static `process.env.EXPO_PUBLIC_X` member expressions.
> Expo/Babel inlines them at build time by literal text match, so a computed access like
> `process.env[name]` is *not* replaced and resolves to `undefined` in release builds even when
> the value is present in `.env` and on EAS.

---

## 3. Testing

### 3.1 Local Development (Simulator / Device)

```bash
# iOS Simulator
npx expo run:ios

# Physical device (required for notifications)
npx expo run:ios --device
```

### 3.2 Internal Testing with EAS (TestFlight Alternative)

Build an internal distribution IPA and install on registered devices:

```bash
# Build for internal distribution
eas build --platform ios --profile preview
```

After the build completes:
1. Register test devices via `eas device:create`
2. Download and install the build from the EAS dashboard link
3. Or use the QR code from the build page

### 3.3 TestFlight Testing

Build a production-signed app and submit to TestFlight:

```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store Connect (TestFlight)
eas submit --platform ios
```

Then in App Store Connect:
1. Go to **TestFlight** tab
2. Add internal testers (up to 25, no review needed)
3. Add external testers (up to 10,000, requires Apple review of first build)
4. Testers install via the **TestFlight app** on their devices

### 3.4 Key Things to Test Before Release

- [ ] Google sign-in works on physical device
- [ ] User and Admin role routing works correctly
- [ ] Session CRUD operations (Admin)
- [ ] Calendar displays sessions correctly
- [ ] Local notification reminders fire (physical device only)
- [ ] Notification tap navigates to session detail
- [ ] Notification permission prompt appears on first launch
- [ ] Notification toggle in settings works
- [ ] App handles no network gracefully
- [ ] Deep link scheme (`myapp://`) works
- [ ] Splash screen displays correctly
- [ ] App icon appears correctly on home screen

---

## 4. App Store Submission

### 4.1 Apple Developer Portal Setup

1. Go to https://developer.apple.com/account/
2. Register your **Bundle ID** (`com.lucreation.cms`) under Identifiers
3. Enable capabilities: **Push Notifications**, **Sign in with Apple** (if used)
4. Create an **App Store provisioning profile**

### 4.2 App Store Connect Setup

1. Go to https://appstoreconnect.apple.com/
2. Create a new app:
   - Platform: iOS
   - Name: Your app display name
   - Bundle ID: `com.lucreation.cms`
   - SKU: unique identifier (e.g., `pilates-training-ios`)
3. Fill in required metadata:
   - **Description** (up to 4000 chars)
   - **Keywords** (comma-separated, 100 chars max)
   - **Support URL**
   - **Privacy Policy URL** (required)
   - **Category**: Health & Fitness
4. Upload **screenshots** for required device sizes:
   - 6.7" (iPhone 15 Pro Max) — required
   - 6.5" (iPhone 14 Plus) — required
   - 5.5" (iPhone 8 Plus) — optional but recommended
   - iPad Pro 12.9" — if `supportsTablet: true`

### 4.3 Build and Submit

```bash
# Build production binary
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

Or do both in one command:

```bash
eas build --platform ios --profile production --auto-submit
```

### 4.4 App Review Checklist

Before submitting for review, ensure:

- [ ] Privacy Policy URL is live and accessible
- [ ] App does not crash on launch
- [ ] All permission prompts have clear usage descriptions
- [ ] Google sign-in works without errors
- [ ] No placeholder or debug content visible
- [ ] No `console.log` statements leaking sensitive data
- [ ] App functions correctly on latest iOS version
- [ ] `version` and `buildNumber` are incremented from any previous submission

### 4.5 Common Rejection Reasons

| Reason | Fix |
|---|---|
| Missing privacy policy | Add a hosted privacy policy URL |
| Crash on launch | Test production build on device before submitting |
| Incomplete metadata | Fill all required fields in App Store Connect |
| Login required but no test account | Provide demo credentials in review notes |
| Missing usage descriptions | Add `NSxxxUsageDescription` for every permission |
| Broken sign-in | Ensure Google OAuth is configured for production bundle ID |

> **Tip:** Since your app requires Google sign-in, provide a test account in the App Review notes so reviewers can log in.

---

## 5. Post-Release

- [ ] Monitor crashes via EAS Insights or Firebase Crashlytics
- [ ] Use `eas update` for OTA JavaScript updates (no new App Store review needed)
- [ ] Increment `version` in `app.json` for feature releases
- [ ] `buildNumber` auto-increments if `autoIncrement: true` is set in `eas.json`

---

## Quick Command Reference

| Action | Command |
|---|---|
| Configure EAS | `eas build:configure` |
| Dev build (simulator) | `eas build --platform ios --profile development` |
| Internal build (device) | `eas build --platform ios --profile preview` |
| Production build | `eas build --platform ios --profile production` |
| Submit to App Store | `eas submit --platform ios` |
| Build + Submit | `eas build --platform ios --profile production --auto-submit` |
| OTA update | `eas update --branch production` |
| Register test device | `eas device:create` |
| Set env secret | `eas secret:create --name KEY --value VAL --scope project` |
