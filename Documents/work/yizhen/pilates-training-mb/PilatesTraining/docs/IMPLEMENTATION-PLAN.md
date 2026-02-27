# Implementation Plan: Pilates Training Mobile Application

**Document Version:** 1.0  
**Date:** January 29, 2026  
**Project:** Pilates Training Mobile App (React Native + Firebase)  
**Reference:** [Software Design Document (SDD.md)](./SDD.md)

---

## Overview

This is an AI-executable implementation checklist for building the Pilates Training Mobile Application. Tasks are organized sequentially with clear dependencies. Each task specifies exactly what files to create/modify and what configurations to apply.

**Technology Stack:**
- React Native 0.73+ with TypeScript
- Firebase Spark Plan (Auth, Firestore, Cloud Messaging)
- Client-side local notifications (@notifee/react-native)
- Redux Toolkit for state management
- React Navigation for routing

**Implementation Approach:**
- Sequential task execution (dependencies managed)
- File-by-file creation with complete code
- Configuration before implementation
- Testing after each major component

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Project Initialization](#project-initialization)
3. [Firebase Configuration](#firebase-configuration)
4. [Core Infrastructure](#core-infrastructure)
5. [Authentication Implementation](#authentication-implementation)
6. [Database Layer](#database-layer)
7. [User Interface Components](#user-interface-components)
8. [Real-Time Synchronization](#real-time-synchronization)
9. [Notification System](#notification-system)
10. [Admin Features](#admin-features)
11. [Testing Implementation](#testing-implementation)
12. [Deployment Preparation](#deployment-preparation)

---

## Prerequisites & Setup

### Required Before Starting

**System Requirements:**
- [ ] MacOS (for iOS development) or Linux/Windows (Android only)
- [ ] Xcode 14+ installed with command-line tools (macOS only)
- [ ] Android Studio installed with SDK
- [ ] Node.js 18+ and npm installed
- [ ] Git installed
- [ ] Firebase CLI: `npm install -g firebase-tools`
- [ ] React Native CLI: `npm install -g react-native-cli`

**Firebase Project Setup:**
- [ ] Firebase account created
- [ ] Firebase project created in console
- [ ] Billing account linked (Spark plan is free)
- [ ] Google Cloud Console access (for OAuth setup)

**Optional for Deployment:**
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25 one-time)

---

## Project Initialization

### Task 1: Create React Native Project

### Firebase Project Setup

**Week 0 (Before Phase 1):**

```bash
# 1. Create Firebase project
# - Go to https://console.firebase.google.com
# - Click "Add project"
# - Name: pilates-training-app-dev
# - Disable Google Analytics (or enable for production)

# 2. Enable Firebase Authentication
# - Navigate to Authentication > Sign-in method
# - Enable Google provider
# - Add authorized domains

# 3. Create Firestore Database
# - Navigate to Firestore Database
# - Click "Create database"
# - Choose production mode
# - Select region (us-central1 recommended)

**Commands:**
```bash
npx react-native init myAPP --template react-native-template-typescript
cd myAPP
```

**Verify:**
```bash
npm run ios    # macOS only
npm run android
```

**Expected Result:** App builds and shows "Welcome to React Native" screen

---

### Task 2: Install Dependencies

**Commands:**
```bash
# Firebase SDKs
npm install @react-native-firebase/app@latest
npm install @react-native-firebase/auth@latest
npm install @react-native-firebase/firestore@latest
npm install @react-native-firebase/messaging@latest

# Notifications
npm install @notifee/react-native@latest

# State Management
npm install @reduxjs/toolkit react-redux
npm install redux-persist @react-native-async-storage/async-storage

# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# UI Libraries
**Add imports:**
```objective-c
#import <Firebase.h>
#import <GoogleSignIn/GoogleSignIn.h>
```

**Add to `didFinishLaunchingWithOptions`:**
```objective-c
[FIRApp configure];
```

**Add method:**
```objective-c
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [GIDSignIn.sharedInstance handleURL:url];
}
```

**File:** `ios/myAPP/Info.plist`

Add URL schemes:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```
(Replace `YOUR_REVERSED_CLIENT_ID` with value from GoogleService-Info.plist)

---

### Task 5: Configure Firebase for Android

**File:** `android/app/google-services.json`
- Copy downloaded file to `android/app/` directory

**File:** `android/build.gradle`

Add to `buildscript.dependencies`:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

**File:** `android/app/build.gradle`

Add at bottom of file:
```gradle
apply plugin: 'com.google.gms.google-services'
```

Add to `android` block:
```gradle
defaultConfig {
    applicationId "com.pilatestraining.myapp"
    // ... existing config
}
```

---

### Task 6: Get Google OAuth Client ID

**Manual Steps:**

1. Open `GoogleService-Info.plist` (iOS) or `google-services.json` (Android)
2. Find `CLIENT_ID` value
3. Go to Google Cloud Console > Credentials
4. Note the Web Client ID (needed for Google Sign-In config)

**Alternative:** Get from Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration

**Save this value:** You'll need it for `GoogleSignin.configure()`

---

## Core Infrastructure

### Task 7: Create Project Directory Structure

**Commands:**
```bash
mkdir -p src/components/common
mkdir -p src/components/calendar
mkdir -p src/components/session
mkdir -p src/screens/auth
mkdir -p src/screens/user
mkdir -p src/screens/admin
mkdir -p src/navigation
mkdir -p src/store/slices
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/hooks
```

**Verification:** Directory structure created

---

### Task 8: Configure TypeScript

**File:** `tsconfig.json`
   - Project settings > Add app > Android
   - Package name: `com.pilatestraining.myapp`
   - Download **google-services.json**

**Verification:** Both config files downloaded

---

### Task 4: Configure Firebase for iOS

**File:** `ios/myAPP/GoogleService-Info.plist`
- Copy downloaded file to `ios/myAPP/` directory

**File:** `ios/myAPP/AppDelegate.mmInstall dependencies
npm install -g firebase-tools
npm install -g react-native-cli
npm install -g detox-cli

# Setup Firebase emulators
firebase init emulators
# Select: Authentication, Firestore

# Configure emulator ports in firebase.json:
# {
#   "emulators": {
#     "auth": { "port": 9099 },
#     "firestore": { "port": 8080 },
#     "ui": { "enabled": true }
#   }
# }

# Start emulators for local development
firebase emulators:start
```

---

## Phase-by-Phase Implementation

### Phase 1: Foundation (Week 1-2)

**Duration:** 1-2 weeks  
**Team:** Lead Engineer  
**Goal:** Set up project infrastructure and Firebase integration

#### Tasks

**1.1 Initialize React Native Project**

```bash
# Create new project
npx react-native init myAPP --template react-native-template-typescript

cd myAPP

# Install core dependencies
npm install @react-native-firebase/app@latest
npm install @react-native-firebase/auth@latest
npm install @react-native-firebase/firestore@latest
npm install @react-native-firebase/messaging@latest
npm install @notifee/react-native@latest

# State management
npm install @reduxjs/toolkit react-redux
npm install redux-persist @react-native-async-storage/async-storage

# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

---

### Task 9: Create Redux Store

**File:** `src/store/index.ts`

Create file with:tive-picker/picker

# Utilities
npm install date-fns date-fns-tz
npm install zod
npm install react-hook-form @hookform/resolvers

# Google Sign-In
npm install @react-native-google-signin/google-signin

# Dev dependencies
npm install --save-dev @types/react @types/react-native
npm install --save-dev jest @testing-library/react-native
npm install --save-dev detox detox-cli
npm install --save-dev @firebase/rules-unit-testing
```

**1.2 Configure iOS Project**

```bash
cd ios
pod install
cd ..

# Add GoogleService-Info.plist to ios/myAPP/
# Update Info.plist with URL schemes
# Configure AppDelegate.mm for Firebase
```

**iOS AppDelegate Configuration:**

```objective-c
// ios/myAPP/AppDelegate.mm
#import <Firebase.h>
#iNote:** Empty slices will be created in subsequent tasks

---

## Authentication Implementation

### Task 10: Create Type Definitions

**File:** `src/types/user.types.ts`

Create file with:ure**

```
src/
├── components/          # Reusable UI components
│   ├── common/
│   ├── calendar/
│   └── session/
├── screens/            # Screen components
│   ├── auth/
│   ├── user/
│   └── admin/
├── navigation/         # Navigation configuration
├── store/             # Redux store and slices
│   ├── slices/
│   └── index.ts
├── services/          # Firebase and API services
│   ├── auth.service.ts
│   ├── session.service.ts
│   ├── user.service.ts
│   └── notification.service.ts
├── utils/             # Helper functions
│   ├── dateTime.utils.ts
│   ├── validation.schemas.ts
│   └── constants.ts
├── types/             # TypeScript type definitions
└── App.tsx            # Root component
```

**1.5 Configure TypeScript**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017", "es2019", "es2020"],
    "jsx": "react-native",
    "strict": true,
---

### Task 11: Implement Auth Service

**File:** `src/services/auth.service.ts`

Create file with complete implementation from [SDD.md Authentication Section](./SDD.md#authentication-and-role-based-access-control):
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**1.6 Setup Redux Store**

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import sessionsReducer from './slices/sessionsSlice';
import usersReducer from './slices/usersSlice';
import settingsReducer from './slices/settingsSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'role'],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    sessions: sessionsReducer,
    users: usersReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Deliverables:**
- ✅ React Native project initialized with all dependencies
- ✅ Firebase SDKs configured for iOS and Android
- ✅ Project structure created
- ✅ Redux store configured with persistence
- ✅ TypeScript paths configured
- ✅ Development environment verified (app builds and runs)

**Acceptance Criteria:**
- App builds successfully on both iOS and Android
- Firebase connection verified (no console errors)
- Redux DevTools shows store structure
- Hot reload working

---

### Phase 2: Authentication & Role Bootstrap (Week 2-3)

**Duration:** 1 week  
**Team:** Lead Engineer or Mobile Developer  
**Goal:** Implement Google Sign-In and role-based navigation

#### Tasks

**2.1 Create Type Definitions**

```typescript
// src/types/user.types.ts
import { Timestamp } from '@react-native-firebase/firestore';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'IN_TRAINING' | 'INACTIVE';

export interface User {
  const currentUser = auth().currentUser;
  if (!currentUser) return null;

  const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
  if (!userDoc.exists) return null;

  return {
    uid: currentUser.uid,
    ...userDoc.data(),
  } as User;
};
```

**Important:** Replace `'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'` with actual Web Client ID from Task 6

---

### Task 12: Create Auth Redux Slice

**File:** `src/store/slices/authSlice.ts`

Create file with:
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

**2.2 Implement Auth Service**

Reference: [SDD.md - Authentication Section](./SDD.md#authentication-and-role-based-access-control)

```typescript
// src/services/auth.service.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { User } from '@types/user.types';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});

export const signInWithGoogle = async (): Promise<User> => {
  // Implementation from SDD.md
  // ... (copy from SDD)
};

export const signOut = async (): Promise<void> => {
  // Implementation from SDD.md
  // ... (copy from SDD)
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Implementation from SDD.md
  // ... (copy from SDD)
};
```

**2.3 Create Auth Slice**

```typescript
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithGoogle, signOut, getCurrentUser } from '@services/auth.service';
import { AuthState } from '@types/user.types';
File:** `src/store/index.ts` (Update)

Import and add authSlice:
```typescript
import authReducer from './slices/authSlice';

// Add to reducer in configureStore
auth: persistReducer(authPersistConfig, authReducer),
```

---

### Task 13: Create Login Screen

**File:** `src/screens/auth/LoginScreen.tsx`

Create file with:
    return await signInWithGoogle();
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await signOut();
  }
);

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'ADMIN';

export default authSlice.reducer;
```

**2.4 Create Login Screen**

```typescript
// src/screens/auth/LoginScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle } from '@store/slices/authSlice';
import { AppDispatch, RootState } from '@store';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
    } catch (err) {
---

### Task 14: Create Navigation Structure

**File:** `src/navigation/UserNavigator.tsx`

Create file with:
```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const UserNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UserDashboard" component={() => null} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="UserCalendar" component={() => null} options={{ title: 'Calendar' }} />
      <Stack.Screen name="UserSettings" component={() => null} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
};

export default UserNavigator;
```

**File:** `src/navigation/AdminNavigator.tsx`

Create file with:
```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminCalendar" component={() => null} options={{ title: 'Calendar' }} />
      <Stack.Screen name="AdminUserList" component={() => null} options={{ title: 'Users' }} />
---

### Task 15: Update App.tsx

**File:** `App.tsx`

Replace entire content with:
```typescript
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
};

export default App;
```

**Test:** Run app - should see Login screen

---

### Task 16: Bootstrap First Admin Account

**Option A: Manual (Firebase Console

export default AdminNavigator;
```

**File:** `src/navigation/AppNavigator.tsx`

Create file with:
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pilates Training</Text>
      <Text style={styles.subtitle}>Welcome! Please sign in to continue.</Text>
      
      <TouchableOpacity
        testID="google-sign-in-button"
        style={styles.button}
        onPress={handleGoogleSignIn}
        disabled={loading}
  Verification:** First admin can log in and see admin portal

---

## Database Layer

### Task 17: Create Firestore Collections

**Manual Steps
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
});

export default LoginScreen;
```

**2.5 Setup Navigation**

```typescript
// src/navigation/AppNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin } from '@store/slices/authSlice';

import LoginScreen from '@screens/auth/LoginScreen';
import UserNavigator from './UserNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  if (!user) {
  Verification:** Collections created with sample data in Firebase Console

---

### Task 18: Create and Deploy Firestore Indexes

**File:** `firestore.indexes.json` (root directory)

Create file with:ame="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {isAdmin ? <AdminNavigator /> : <UserNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
```

**2.6 Bootstrap First Admin**

**Option A: Firebase Console (Manual)**

1. User signs in via app (creates user document with role=USER)
2. Admin goes to Firebase Console > Firestore
3. Manually changes role field to 'ADMIN'
4. User logs out and logs back in

**Option B: Admin Bootstrap Script**

```typescript
// scripts/createFirstAdmin.ts
import admin from 'firebase-admin';
import * as serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const createFirstAdmin = async (email: string) => {
  try {
    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      username: userRecord.displayName || 'Admin',
      gmail: email,
      role: 'ADMIN',
      status: 'IN_TRAINING',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log(`✅ Successfully made ${email} an admin`);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage: node createFirstAdmin.ts admin@example.com
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

createFirstAdmin(email).then(() => process.exit(0));
```

**Deliverables:**
- ✅ Google Sign-In implemented and tested
- ✅ Auth slice with Redux actions
- ✅ Login screen UI
- ✅ Role-based navigation working
- ✅ First admin account created

**Acceptance Criteria:**
- User can sign in with Google account
- App navigates to correct portal based on role
- Auth state persists across app restarts
- Sign out functionality works
- Error handling displays user-friendly messages

---

### Phase 3: Firestore Schema & Security Rules (Week 3-4)

**Duration:** 1 week  
**Team:** Lead Engineer  
**Goal:** Deploy database schema, indexes, and security rules

#### Tasks

**3.1 Create Firestore Collections**

**Manual Setup in Firebase Console:**

1. Navigate to Firestore Database
2. Create collections: `users`, `training_sessions`, `device_tokens`, `notification_preferences`
3. Add sample documents for testing

**Sample Data:**

```javascript
// users/test-user-uid
{
  username: "Jane Doe",
  gmail: "jane@example.com",
  role: "USER",
  status: "IN_TRAINING",
  created_at: Timestamp.now(),
  updated_at: Timestamp.now()
}
Commands:**
```bash
# Login to Firebase
firebase login

# Initialize Firestore in project (if not done)
firebase init firestore
# Select existing project
# Accept default firestore.rules
# Accept default firestore.indexes.json

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Verification:** Check Firebase Console > Firestore > Indexes tab - should show "Building" then "Enabled"

---

### Task 19: Create and Deploy Security Rules

**File:** `firestore.rules` (root directory)

Create file with complete rules from [SDD.md Authentication Section](./SDD.md#authentication-and-role-based-access-control):
```

**3.2 Define Firestore Indexes**

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "training_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "start_time", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "training_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "end_time", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "training_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "start_time", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "username", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "users",
      "fieldPath": "gmail",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        }
      ]
    },
    {
      "collectionGroup": "device_tokens",
      "fieldPath": "fcm_token",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        }
      ]
    }
  ]
}
```

**Deploy Indexes:**

```bash
firebase deploy --only firestore:indexes
```

**Commands:**
```bash
firebase deploy --only firestore:rules
```

**Verification:** Check Firebase Console > Firestore > Rules tab - should show updated rules

---

### Task 20: Create Type Definitions for Sessions

**File:** `src/types/session.types.ts`

Create file with:
```typescript
import { Timestamp } from '@react-native-firebase/firestore';

export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface TrainingSession {
  id: string;
  user_id: string;
  created_by_id: string;
  start_time: Timestamp;
  end_time: Timestamp;
  status: SessionStatus;
  notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateSessionDTO {
  userId: string;
  startTime: Date;
  endTime: Date;
  notes: string;
}

export interface UpdateSessionDTO {
  sessionId: string;
  startTime?: Date;
  endTime?: Date;
  status?: SessionStatus;
  notes?: string;
}
```

---

### Task 21: Implement Session Service

**File:** `src/services/session.service.ts`

Create file with complete implementation from [SDD.md Firestore Operations](./SDD.md#firestore-readwrite-operations):

```typescript
// Copy complete session service from SDD.md
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin(uid) {
// Include: createTrainingSession, updateTrainingSession, deleteTrainingSession,
// fetchUserSessions, fetchNextSession, countCompletedSessions
```

**Note:** Copy complete implementation from SDD.md, don't abbreviate

---

### Task 22: Create Sessions Redux Slice

**File:** `src/store/slices/sessionsSlice.ts`

Create file with complete implementation from [SDD.md Session Service](./SDD.md#firestore-readwrite-operations):
```bash
firebase deploy --only firestore:rules
```

**3.4 Test Security Rules**

```typescript
// tests/firestore.rules.test.ts
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-pilates-app',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

describe('Firestore Security Rules', () => {
  test('Users can read own profile', async () => {
    const alice = testEnv.authenticatedContext('alice-uid');
    await assertSucceeds(
      alice.firestore().collection('users').doc('alice-uid').get()
    );
  });

  test('Users cannot read other profiles', async () => {
    const alice = testEnv.authenticatedContext('alice-uid');
    await assertFails(
      alice.firestore().collection('users').doc('bob-uid').get()
    );
  });

  test('Only admins can create sessions', async () => {
    // Seed admin user
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('admin-uid').set({
        role: 'ADMIN',
      });
    });

    const admin = testEnv.authenticatedContext('admin-uid');
    await assertSucceeds(
      admin.firestore().collection('training_sessions').add({
        user_id: 'user-uid',
        created_by_id: 'admin-uid',
        start_time: new Date('2026-02-01T10:00:00Z'),
        end_time: new Date('2026-02-01T11:00:00Z'),
        status: 'SCHEDULED',
        notes: 'Test',
        created_at: new Date(),
        updated_at: new Date(),
      })
    );
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});
```

**Run Tests:**

```bash
# Start emulators
firebase emulators:start

# In another terminal
npm test -- firestore.rules.test.ts
```

**Deliverables:**
- ✅ Firestore collections created with sample data
- ✅ Composite indexes deployed
- ✅ Security rules implemented and deployed
- ✅ Security rules tested with emulator

**Acceptance Criteria:**
- All indexes created (verify in Firebase Console)
- Security rules deployed successfully
- All security rule tests passing
- Sample queries work as expected

---

### Phase 4: Core Session CRUD (Week 4-5)

**Duration:** 1 week  
**Team:** Mobile Developer  
**Goal:** Implement session create, read, update, delete operations

#### Tasks

**4.1 Create Session Type Definitions**

```typescript
// src/types/session.types.ts
import { Timestamp } from '@react-native-firebase/firestore';

export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface TrainingSession {
  id: string;
  user_id: string;
  created_by_id: string;
  start_time: Timestamp;
  end_time: Timestamp;
  status: SessionStatus;
  notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateSessionDTO {
  userId: string;
  startTime: Date;
  endTime: Date;
  notes: string;
}

export interface UpdateSessionDTO {
  sessionId: string;
  startTime?: Date;
  endTime?: Date;
  status?: SessionStatus;
  notes?: string;
}
```

**4.2 Implement Session Service**

Reference: [SDD.md - Firestore Operations](./SDD.md#firestore-readwrite-operations)

```typescript
// src/services/session.service.ts
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { TrainingSession, CreateSessionDTO, UpdateSessionDTO } from '@types/session.types';

export const createTrainingSession = async (dto: CreateSessionDTO): Promise<string> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  const sessionData = {
    user_id: dto.userId,
    created_by_id: currentUser.uid,
    start_time: firestore.Timestamp.fromDate(dto.startTime),
    end_time: firestore.Timestamp.fromDate(dto.endTime),
    status: 'SCHEDULED',
    notes: dto.notes,
    created_at: firestore.FieldValue.serverTimestamp(),
    updated_at: firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await firestore().collection('training_sessions').add(sessionData);
  return docRef.id;
};

export const updateTrainingSession = async (dto: UpdateSessionDTO): Promise<void> => {
  const updateData: any = {
    updated_at: firestore.FieldValue.serverTimestamp(),
  };

  if (dto.startTime) updateData.start_time = firestore.Timestamp.fromDate(dto.startTime);
  if (dto.endTime) updateData.end_time = firestore.Timestamp.fromDate(dto.endTime);
  if (dto.status) updateData.status = dto.status;
  if (dto.notes !== undefined) updateData.notes = dto.notes;

  await firestore().collection('training_sessions').doc(dto.sessionId).update(updateData);
};

export const deleteTrainingSession = async (sessionId: string): Promise<void> => {
  await firestore().collection('training_sessions').doc(sessionId).delete();
};

export const fetchUserSessions = async (userId: string, startDate: Date, endDate: Date): Promise<TrainingSession[]> => {
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('start_time', '>=', firestore.Timestamp.fromDate(startDate))
    .where('start_time', '<=', firestore.Timestamp.fromDate(endDate))
    .orderBy('start_time', 'asc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TrainingSession[];
};

export const fetchNextSession = async (userId: string): Promise<TrainingSession | null> => {
  const now = new Date();
  
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('start_time', '>', firestore.Timestamp.fromDate(now))
    .where('status', '==', 'SCHEDULED')
    .orderBy('start_time', 'asc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as TrainingSession;
};

export const countCompletedSessions = async (userId: string): Promise<number> => {
  const now = new Date();
  
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('end_time', '<', firestore.Timestamp.fromDate(now))
    .where('status', 'in', ['COMPLETED', 'NO_SHOW'])
    .get();

  return snapshot.size;
};
```

**4.3 Create Sessions Redux Slice**

```typescript
// src/store/slices/sessionsSlice.ts
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  fetchUserSessions,
} from '@services/session.service';
import { TrainingSession, CreateSessionDTO, UpdateSessionDTO } from '@types/session.types';
import { RootState } from '@store';

interface SessionsState {
  sessions: Record<string, TrainingSession>;
  loading: boolean;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: {},
  loading: false,
  error: null,
};

export const createSession = createAsyncThunk(
  'sessions/create',
  async (dto: CreateSessionDTO) => {
    const sessionId = await createTrainingSession(dto);
    return sessionId;
  }
);

export const updateSession = createAsyncThunk(
  'sessions/update',
  async (dto: UpdateSessionDTO) => {
    await updateTrainingSession(dto);
    return dto;
  }
);

export const deleteSession = createAsyncThunk(
  'sessions/delete',
```typescript
import { z } from 'zod';

export const CreateSessionSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().max(5000, 'Notes too long'),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const UpdateUserSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  gmail: z.string().email('Invalid email address'),
  status: z.enum(['IN_TRAINING', 'INACTIVE']),
});

export const NotificationPreferencesSchema = z.object({
  enabled: z.boolean(),
  rule: z.enum(['24H', '1H', 'BOTH']),
});
```

---

## User Interface Components

### Task 24: Create User Dashboard Screen

**File:** `src/screens/user/UserDashboard.tsx`

Create file with implementation from [SDD.md UI Mapping](./SDD.md#ui-to-backend-behavior-mapping):
```typescript
// Copy User Dashboard implementation from SDD.md
// Include: fetchNextSession, countCompletedSessions, navigation
```

**File:** `src/navigation/UserNavigator.tsx` (Update)

Import and use UserDashboard:
```typescript
import UserDashboard from '../screens/user/UserDashboard';

<Stack.Screen name="UserDashboard" component={UserDashboard} />
```

---

### Task 25: Create User Calendar Screen

**File:** `src/screens/user/UserCalendar.tsx`

Create file with implementation from [SDD.md UI Mapping](./SDD.md#ui-to-backend-behavior-mapping):
```typescript
// Copy User Calendar implementation from SDD.md
// Include: Calendar component, session markers, month selection
```

**File:** `src/navigation/UserNavigator.tsx` (Update)
```typescript
import UserCalendar from '../screens/user/UserCalendar';

<Stack.Screen name="UserCalendar" component={UserCalendar} />
```

---

### Task 26: Create Session Detail Modal

**File:** `src/components/session/SessionDetailModal.tsx`

Create file with:
```typescript
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrainingSession } from '@types/session.types';
import { format } from 'date-fns';

interface Props {
  session: TrainingSession | null;
  visible: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<Props> = ({ session, visible, onClose }) => {
  if (!session) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>Session Details</Text>
          
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>
            {format(session.start_time.toDate(), 'MMMM d, yyyy h:mm a')} - 
            {format(session.end_time.toDate(), 'h:mm a')}
          </Text>
          
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{session.status}</Text>
          
          {session.notes && (
            <>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{session.notes}</Text>
            </>
          )}
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
---

### Task 29: Create Admin Edit Session Modal

**File:** `src/screens/admin/EditSessionModal.tsx`

Create file with implementation similar to CreateSessionModal but with:
- Load existing session data
- Allow status changes
- Delete session option
- Use `updateSession` thunk

---

### Task 30: Create User Service

**File:** `src/services/user.service.ts`

Create file with:
```typescript
import firestore from '@react-native-firebase/firestore';
import { User } from '@types/user.types';

export const fetchAllUsers = async (): Promise<User[]> => {
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'USER')
    .orderBy('username', 'asc')
    .get();

  return snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  })) as User[];
};

export const createUser = async (userData: Partial<User>): Promise<void> => {
  await firestore().collection('users').add({
    ...userData,
    created_at: firestore.FieldValue.serverTimestamp(),
    updated_at: firestore.FieldValue.serverTimestamp(),
  });
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  await firestore().collection('users').doc(userId).update({
    ...updates,
    updated_at: firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  await firestore().collection('users').doc(userId).delete();
};
```

---

### Task 31: Create Admin User List Screen

**File:** `src/screens/admin/AdminUserList.tsx`

Create file with implementation from [SDD.md UI Mapping](./SDD.md#ui-to-backend-behavior-mapping):
```typescript
// Copy Admin User List implementation
// Include: user list, search, filters, navigation to add/edit
```

**File:** `src/navigation/AdminNavigator.tsx` (Update)
```typescript
import AdminUserList from '../screens/admin/AdminUserList';

<Stack.Screen name="AdminUserList" component={AdminUserList} />
```

---

### Task 32: Create Admin Add/Edit User Screen

**File:** `src/screens/admin/AddEditUserScreen.tsx`

Create file with implementation from [SDD.md UI Mapping](./SDD.md#ui-to-backend-behavior-mapping):
```typescript
// Copy Add/Edit User implementation
// Include: form validation, email uniqueness check, role/status selection
```

---

## Real-Time Synchronization

### Task 33: Create Real-Time Listener Hooks

**File:** `src/hooks/useUserSessions.ts`

Create file with implementation from [SDD.md Real-Time Sync](./SDD.md#real-time-data-synchronization):n from SDD.md
// Include: Calendar with all users' sessions, create session FAB
```

**File:** `src/navigation/AdminNavigator.tsx` (Update)
```typescript
import AdminCalendar from '../screens/admin/AdminCalendar';

<Stack.Screen name="AdminCalendar" component={AdminCalendar} />
```

```

**File:** `src/hooks/useAdminSessions.ts`

Create file for admin-side listener:
```typescript
// Similar to useUserSessions but listens to all sessions
// Copy implementation from SDD.md
export const loadUserSessions = createAsyncThunk(
  'sessions/loadUserSessions',
  async ({ userId, startDate, endDate }: { userId: string; startDate: Date; endDate: Date }) => {
    return await fetchUserSessions(userId, startDate, endDate);
  }
);

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    addSession: (state, action) => {
      const session = action.payload;
      state.sessions[session.id] = session;
    },
    updateSessionLocal: (state, action) => {
      const session = action.payload;
      if (state.sessions[session.id]) {
        state.sessions[session.id] = { ...state.sessions[session.id], ...session };
      }
    },
    removeSession: (state, action) => {
      delete state.sessions[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserSessions.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserSessions.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(session => {
          state.sessions[session.id] = session;
        });
      })
      .addCase(loadUserSessions.rejected, (state, action) => {
**Usage:** Add to UserDashboard, UserCalendar screens:
```typescript
// At top of component
useUserSessions();
```

---

## Notification System

### Task 34: Configure Notification Permissions

**File:** `ios/myAPP/AppDelegate.mm` (Update)

Add notification imports and permission request:
```objective-c
#import <UserNotifications/UserNotifications.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  
  // Request notification permissions
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge)
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (!granted) {
      NSLog(@"Notification permission denied");
    }
  }];
  
  // ... existing code
}
```

**File:** `android/app/src/main/AndroidManifest.xml` (Update)

Add permissions:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
```

---

### Task 35: Implement Notification Scheduler Service

**File:** `src/services/notificationScheduler.service.ts`

Create file with complete NotificationSchedulerService class from [SDD.md Notification Scheduling](./SDD.md#notification-scheduling-design-client-side-only):
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Training Session</Text>
          
          <DateTimePicker
            value={startTime}
            mode="datetime"
            onChange={(event, date) => date && setStartTime(date)}
          />
          
          <DateTimePicker
            value={endTime}
            mode="datetime"
            onChange={(event, date) => date && setEndTime(date)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Training notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="create-button"
              onPress={handleCreate}
              style={styles.createButton}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    minHeight: 100,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    padding: 15,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CreateSessionModal;
```

**Deliverables:**
- ✅ Session service with CRUD operations
- ✅ Sessions Redux slice
- ✅ Create session modal (admin)
- ✅ Edit session modal (admin)
- ✅ Delete session functionality
- ✅ Unit tests for session service

**Acceptance Criteria:**
- Admin can create sessions successfully
- Created sessions appear in Firestore
- Session validation working (end > start)
- Error handling displays properly
- Unit tests passing

---

### Phase 5: Calendar UI (Week 5-6)

**Duration:** 1 week  
**Team:** Mobile Developer  
**Goal:** Implement calendar views for both users and admins

#### Tasks

**5.1 Install Calendar Dependencies**

```bash
npm install react-native-calendars
```

**5.2 Create User Calendar Screen**

Reference: [SDD.md - UI-to-Backend Behavior Mapping](./SDD.md#ui-to-backend-behavior-mapping)

```typescript
// src/screens/user/UserCalendar.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { selectSessionsForMonth } from '@store/slices/sessionsSlice';
import { loadUserSessions } from '@store/slices/sessionsSlice';
import { selectUser } from '@store/slices/authSlice';
import SessionDetailModal from '@components/session/SessionDetailModal';

const UserCalendar: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const sessions = useSelector((state: RootState) => selectSessionsForMonth(state, selectedMonth));
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (user) {
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      dispatch(loadUserSessions({
        userId: user.uid,
        startDate,
        endDate,
      }));
    }
  }, [selectedMonth, user]);

  const markedDates = sessions.reduce((acc, session) => {
    const dateKey = session.start_time.toDate().toISOString().split('T')[0];
    acc[dateKey] = { marked: true, dotColor: '#007AFF' };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Calendar
        testID="user-calendar"
        markedDates={markedDates}
        onDayPress={(day) => {
          const session = sessions.find(s =>
            s.start_time.toDate().toISOString().startsWith(day.dateString)
          );
          if (session) setSelectedSession(session);
        }}
        onMonthChange={(month) => {
          setSelectedMonth(new Date(month.year, month.month - 1, 1));
        }}
      />
      
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          visible={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default UserCalendar;
```

**5.3 Setup Real-Time Listeners**

Reference: [SDD.md - Real-Time Data Synchronization](./SDD.md#real-time-data-synchronization)
Note:** Copy complete implementation including:
- initialize()
- requestPermissions()
- createNotificationChannel()
- startListeners()
- return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
};
```

---

### Task 37: Create User Settings Screen

**File:** `src/screens/user/UserSettings.tsx`

Create file with implementation from [SDD.md UI Mapping](./SDD.md#ui-to-backend-behavior-mapping):
### Task 36: Initialize Notification Scheduler in App

**File:** `App.tsx` (Update)

Add notification initialization:fect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { selectUser } from '@store/slices/authSlice';
import { addSession, updateSessionLocal, removeSession } from '@store/slices/sessionsSlice';

export const useUserSessions = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('training_sessions')
      .where('user_id', '==', user.uid)
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const session = { id: change.doc.id, ...change.doc.data() };
            
            if (change.type === 'added') {
              dispatch(addSession(session));
            } else if (change.type === 'modified') {
              dispatch(updateSessionLocal(session));
            } else if (change.type === 'removed') {
              dispatch(removeSession(change.doc.id));
            }
          });
        },
        (error) => {
          console.error('Session listener error:', error);
        }
      );

    return () => unsubscribe();
  }, [user, dispatch]);
};
```

**Deliverables:**
- ✅ User calendar screen with monthly view
- ✅ Admin calendar screen
- ✅ Session detail modal
- ✅ Real-time listeners integrated
- ✅ Calendar markers for scheduled sessions

**Acceptance Criteria:**
- Calendar displays current month
- Session markers appear on correct dates
- Tapping date shows session details
- Real-time updates work (create session in admin, appears in user calendar)
- Month navigation works

---

### Phase 6: Notification Scheduling Engine (Week 6-7)

**Duration:** 1 week  
**Team:** Mobile Developer  
**Goal:** Implement client-side local notification scheduling

Reference: [SDD.md - Notification Scheduling Design](./SDD.md#notification-scheduling-design-client-side-only)

#### Tasks

**6.1 Configure Notifee**

**iOS Configuration:**

```objective-c
// ios/myAPP/AppDelegate.mm
#import <UserNotifications/UserNotifications.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Request notification permissions on launch
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge)
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (!granted) {
      NSLog(@"Notification permission denied");
    }
  }];
  
  // ... rest of code
}
```

**Android Configuration:**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  File:** `src/navigation/UserNavigator.tsx` (Update)
```typescript
import UserSettings from '../screens/user/UserSettings';

<Stack.Screen name="UserSettings" component={UserSettings} />
```

---

### Task 38: Create Utility Functions

**File:** `src/utils/dateTime.utils.ts`

Create file with:
```typescript
import { format, formatDistanceToNow } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export const toUTC = (localDate: Date): Date => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zonedTimeToUtc(localDate, timezone);
};

export const toLocalTime = (utcDate: Date): Date => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return utcToZonedTime(utcDate, timezone);
};

export const formatSessionDate = (utcDate: Date): string => {
  const localDate = toLocalTime(utcDate);
  return format(localDate, 'MMMM d, yyyy h:mm a');
};

export const formatRelativeTime = (utcDate: Date): string => {
  const localDate = toLocalTime(utcDate);
  return formatDistanceToNow(localDate, { addSuffix: true });
};

export const calculateReminderTimes = (
  startTime: Date,
  rule: '24H' | '1H' | 'BOTH'
): Date[] => {
  const now = new Date();
  const triggers: Date[] = [];

  if (rule === '24H' || rule === 'BOTH') {
    const trigger24H = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    if (trigger24H > now) {
      triggers.push(trigger24H);
    }
  }

  if (rule === '1H' || rule === 'BOTH') {
    const trigger1H = new Date(startTime.getTime() - 60 * 60 * 1000);
    if (trigger1H > now) {
      triggers.push(trigger1H);
    }
  }

  return triggers;
};
```

---

## Testing Implementation

### Task 39: Setup Testing Infrastructure

**File:** `jest.config.js` (Update)

Replace with:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-firebase)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
};
```

**File:** `jest.setup.js` (Create)

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  // ... mock implementation
}));

jest.mock('@react-native-firebase/auth', () => ({
  // ... mock implementation
}));

jest.mock('@react-native-firebase/firestore', () => ({
  // ... mock implementation
}));
```

---

### Task 40: Write Unit Tests for Utilities

**File:** `src/utils/__tests__/dateTime.utils.test.ts`

Create file with tests from [SDD.md Testing Strategy](./SDD.md#testing-strategy-for-implementation):
```typescript
// Copy unit tests from SDD.md
// Test: calculateReminderTimes, timezone conversions, edge cases
```

---

### Task 41: Write Service Layer Tests

**File:** `src/services/__tests__/session.service.test.ts`

Create file with tests for session service:
```typescript
// Mock Firestore
// Test: createTrainingSession, updateTrainingSession, fetchUserSessions, etc.
```

---

## Deployment Preparation

### Task 42: Environment Configuration

**File:** `.env.development` (Create)

```
FIREBASE_PROJECT_ID=pilates-training-app-dev
GOOGLE_WEB_CLIENT_ID=your-dev-client-id
```

**File:** `.env.production` (Create)

```
FIREBASE_PROJECT_ID=pilates-training-app-prod
GOOGLE_WEB_CLIENT_ID=your-prod-client-id
```

**Install:** `npm install react-native-config`

---

### Task 43: Setup Firebase Hosting (Optional)

**Commands:**
```bash
firebase init hosting
# Select project
# Public directory: build
# Single-page app: No

# Add privacy policy and terms
# Create public/privacy.html
# Create public/terms.html
```

---

### Task 44: Prepare App Store Assets

**Required Assets:**

**iOS:**
- [ ] App icon (1024x1024)
- [ ] Screenshots (6.5" iPhone, 12.9" iPad)
- [ ] App name: "Pilates Training"
- [ ] Description (4000 chars max)
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL

**Android:**
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (Phone + Tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL

---

### Task 45: Build for Production

**iOS:**
```bash
# Update version in ios/myAPP/Info.plist
# CFBundleShortVersionString: 1.0.0
# CFBundleVersion: 1

# Archive
cd ios
xcodebuild -workspace myAPP.xcworkspace \
  -scheme myAPP \
  -configuration Release \
  -archivePath build/myAPP.xcarchive \
  archive
```

**Android:**
```bash
# Update version in android/app/build.gradle
# versionCode 1
# versionName "1.0.0"

# Generate release build
cd android
./gradlew bundleRelease

# AAB location: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Final Checklist

### Pre-Launch Verification

**Functionality:**
- [ ] Google Sign-In works (both iOS and Android)
- [ ] Role-based navigation (USER → User portal, ADMIN → Admin portal)
- [ ] Admin can create/edit/delete sessions
- [ ] User can view sessions in calendar
- [ ] User can view dashboard with stats
- [ ] Notifications schedule correctly
- [ ] User can adjust notification preferences
- [ ] Real-time sync works (multi-device test)
- [ ] Offline behavior works (airplane mode test)

**Security:**
- [ ] Firestore Security Rules deployed
- [ ] Users can only access own data
- [ ] Admins can access all data
- [ ] Security rules tested in emulator

**Performance:**
- [ ] App loads in < 3 seconds
- [ ] No memory leaks
- [ ] Smooth scrolling in lists
- [ ] Calendar navigation responsive

**Testing:**
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Tested different timezones
- [ ] Tested with slow network

**Configuration:**
- [ ] Production Firebase project configured
- [ ] Production Google OAuth credentials set
- [ ] App icons set for both platforms
- [ ] Splash screens configured
- [ ] App name correct
- [ ] Bundle IDs correct

**Documentation:**
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured
- [ ] README updated

---

## Post-Implementation Tasks

### After Deployment

**Monitoring:**
- [ ] Set up Firebase Console alerts (quota usage at 80%)
- [ ] Monitor crash reports daily
- [ ] Check user reviews
- [ ] Monitor notification delivery rates

**User Support:**
- [ ] Set up support email auto-responder
- [ ] Create FAQ document
- [ ] Record demo videos for admins

**Maintenance:**
- [ ] Weekly dependency updates check
- [ ] Monthly security audit
- [ ] Quarterly feature usage analysis

---

## Summary

This implementation plan provides a complete, sequential task list for building the Pilates Training Mobile Application. Execute tasks in order, verify each step, and check off items as completed.

**Total Tasks:** 45 major tasks  
**Estimated Completion Time:** 4-10 weeks depending on complexity and testing thoroughness

**Key Dependencies:**
1. Firebase setup must be completed before any Firebase-related code
2. Authentication must work before implementing features
3. Database layer must be ready before UI components
4. Real-time listeners should be added after basic CRUD works
5. Notifications are independent and can be done anytime after sessions work

**Next Step:** Start with Task 1 (Create React Native Project)

---

**Document Maintenance:**
- Update this checklist as tasks are completed
- Note any blockers or issues encountered
- Document deviations from the plan

**Related Documents:**
- [Software Design Document (SDD.md)](./SDD.md) - Complete technical specifications
- [System Design (system-design.md)](./system-design.md) - Architecture overview
- [App Requirements (app-requirement.md)](./app-requirement.md) - Business requirements
  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.requestPermission();
    }
    // iOS permissions requested in AppDelegate
  }

  private async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'training_reminders',
        name: 'Training Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  }

  private startListeners(userId: string): void {
    // Listen to sessions changes
    this.unsubscribe = firestore()
      .collection('training_sessions')
      .where('user_id', '==', userId)
      .where('status', '==', 'SCHEDULED')
      .onSnapshot(
        async (snapshot) => {
          // Get user's notification preferences
          const prefsDoc = await firestore()
            .collection('notification_preferences')
            .doc(userId)
            .get();
          
          const prefs = prefsDoc.data();
          if (!prefs || !prefs.enabled) {
            return; // Notifications disabled
          }

          // Reschedule all notifications
          await this.rescheduleAllNotifications(snapshot.docs, prefs.rule);
        },
        (error) => {
          console.error('Notification listener error:', error);
        }
      );
  }

  private async rescheduleAllNotifications(
    sessionDocs: any[],
    rule: '24H' | '1H' | 'BOTH'
  ): Promise<void> {
    // Cancel all existing notifications
    await notifee.cancelAllNotifications();

    // Schedule new notifications
    for (const doc of sessionDocs) {
      const data = doc.data();
      await this.scheduleNotificationsForSession(
        doc.id,
        data.start_time.toDate(),
        rule
      );
    }
  }

  private async scheduleNotificationsForSession(
    sessionId: string,
    startTime: Date,
    rule: '24H' | '1H' | 'BOTH'
  ): Promise<void> {
    const now = new Date();

    if (rule === '24H' || rule === 'BOTH') {
      const trigger24H = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      if (trigger24H > now) {
        await this.scheduleNotification(sessionId, startTime, trigger24H, '24H');
      }
    }

    if (rule === '1H' || rule === 'BOTH') {
      const trigger1H = new Date(startTime.getTime() - 60 * 60 * 1000);
      if (trigger1H > now) {
        await this.scheduleNotification(sessionId, startTime, trigger1H, '1H');
      }
    }
  }

  private async scheduleNotification(
    sessionId: string,
    startTime: Date,
    triggerTime: Date,
    type: '24H' | '1H'
  ): Promise<string | null> {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
    };

    const timeText = type === '24H' ? '24 hours' : '1 hour';

    const notificationId = await notifee.createTriggerNotification(
      {
        id: `${sessionId}-${type}`,
        title: 'Upcoming Training Session',
        body: `Your training session starts in ${timeText}`,
        data: {
          session_id: sessionId,
          start_time: startTime.toISOString(),
          type: 'session_reminder',
        },
        android: {
          channelId: 'training_reminders',
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    return notificationId;
  }

  setupNotificationHandler(navigation: any): () => void {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.session_id) {
        // Navigate to session detail
        navigation.navigate('SessionDetail', {
          sessionId: detail.notification.data.session_id,
        });
      }
    });
  }

  private setupAppStateListener(userId: string): void {
    // Re-schedule notifications when app becomes active
    // (handles iOS notification limit and Android battery optimization)
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // Refresh notification schedule
        const snapshot = await firestore()
          .collection('training_sessions')
          .where('user_id', '==', userId)
          .where('status', '==', 'SCHEDULED')
          .get();

        const prefsDoc = await firestore()
          .collection('notification_preferences')
          .doc(userId)
          .get();

        const prefs = prefsDoc.data();
        if (prefs && prefs.enabled) {
          await this.rescheduleAllNotifications(snapshot.docs, prefs.rule);
        }
      }
    });
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const notificationScheduler = new NotificationSchedulerService();
```

**6.3 Initialize Notification Scheduler**

```typescript
// src/App.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@store/slices/authSlice';
import { notificationScheduler } from '@services/notificationScheduler.service';

const App: React.FC = () => {
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user) {
      notificationScheduler.initialize(user.uid);
      
      return () => {
        notificationScheduler.cleanup();
      };
    }
  }, [user]);

  // ... rest of app
};
```

**6.4 Create User Settings Screen**

```typescript
// src/screens/user/UserSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectUser } from '@store/slices/authSlice';
import firestore from '@react-native-firebase/firestore';

const UserSettings: React.FC = () => {
  const user = useSelector(selectUser);
  const [enabled, setEnabled] = useState(true);
  const [rule, setRule] = useState<'24H' | '1H' | 'BOTH'>('BOTH');

  useEffect(() => {
    if (user) {
      firestore()
        .collection('notification_preferences')
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data()!;
            setEnabled(data.enabled);
            setRule(data.rule);
          }
        });
    }
  }, [user]);

  const updatePreferences = async (newEnabled: boolean, newRule: string) => {
    if (!user) return;

    await firestore()
      .collection('notification_preferences')
      .doc(user.uid)
      .set({
        enabled: newEnabled,
        rule: newRule,
        updated_at: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Enable Notifications</Text>
        <Switch
          value={enabled}
          onValueChange={(value) => {
            setEnabled(value);
            updatePreferences(value, rule);
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>Reminder Schedule</Text>
      
      {['24H', '1H', 'BOTH'].map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.option}
          onPress={() => {
            setRule(option as any);
            updatePreferences(enabled, option);
          }}
        >
          <Text>{option === '24H' ? '24 hours before' : option === '1H' ? '1 hour before' : 'Both'}</Text>
          {rule === option && <Text>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default UserSettings;
```

**Deliverables:**
- ✅ Notifee configured for iOS and Android
- ✅ Notification scheduler service implemented
- ✅ Firestore listeners trigger notification rescheduling
- ✅ User settings screen for notification preferences
- ✅ FCM token registration

**Acceptance Criteria:**
- Notifications scheduled when session created
- Notifications fire at correct times (24H, 1H before)
- User can enable/disable notifications
- User can choose reminder rule
- Tapping notification opens session detail

---

### Phase 7: Admin Management Tools (Week 7-8)

**Duration:** 1 week  
**Team:** Mobile Developer  
**Goal:** Implement admin user management screens

#### Tasks

**7.1 Create Admin User List Screen**

```typescript
// src/screens/admin/AdminUserList.tsx
import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { User } from '@types/user.types';

const AdminUserList: React.FC = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const snapshot = await firestore()
      .collection('users')
      .where('role', '==', 'USER')
      .orderBy('username', 'asc')
      .get();

    setUsers(snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[]);
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('EditUser', { userId: item.uid })}
          >
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.email}>{item.gmail}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={loadUsers}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddUser')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  status: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 30,
    color: 'white',
  },
});

export default AdminUserList;
```

**7.2 Create Add/Edit User Screen**

```typescript
// src/screens/admin/AddEditUserScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';

const AddEditUserScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const userId = route.params?.userId;

  const [username, setUsername] = useState('');
  const [gmail, setGmail] = useState('');
  const [status, setStatus] = useState<'IN_TRAINING' | 'INACTIVE'>('INACTIVE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      // Load existing user
      firestore()
        .collection('users')
        .doc(userId)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data()!;
            setUsername(data.username);
            setGmail(data.gmail);
            setStatus(data.status);
          }
        });
    }
  }, [userId]);

  const handleSave = async () => {
    if (!username || !gmail) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (userId) {
        // Update existing user
        await firestore().collection('users').doc(userId).update({
          username,
          gmail,
          status,
          updated_at: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Check if email already exists
        const snapshot = await firestore()
          .collection('users')
          .where('gmail', '==', gmail)
          .get();

        if (!snapshot.empty) {
          Alert.alert('Error', 'User with this email already exists');
          setLoading(false);
          return;
        }

        // Create new user document (UID will be assigned when user logs in)
        // For now, we'll create a placeholder document that will be updated on first login
        Alert.alert('Info', 'User must sign in with Google first before you can assign them');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        testID="username-input"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        testID="email-input"
        style={styles.input}
        value={gmail}
        onChangeText={setGmail}
        placeholder="user@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Status</Text>
      <Picker
        selectedValue={status}
        onValueChange={setStatus}
      >
        <Picker.Item label="In Training" value="IN_TRAINING" />
        <Picker.Item label="Inactive" value="INACTIVE" />
      </Picker>

      <TouchableOpacity
        testID="save-button"
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEditUserScreen;
```

**Deliverables:**
- ✅ Admin user list screen with pagination
- ✅ Add user screen
- ✅ Edit user screen
- ✅ User stats display (completed classes, next session)

**Acceptance Criteria:**
- Admin can view list of all users
- Admin can add new users
- Admin can edit existing user info
- Email uniqueness validation working
- User stats displaying correctly

---

### Phase 8: Testing & Deployment Pipeline (Week 8-9)

**Duration:** 1 week  
**Team:** All engineers + QA  
**Goal:** Comprehensive testing and CI/CD setup

Reference: [SDD.md - Testing Strategy](./SDD.md#testing-strategy-for-implementation)

#### Tasks

**8.1 Unit Tests**

**Jest Configuration:**

```json
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-firebase)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Run Tests:**

```bash
npm test -- --coverage
```

**8.2 Integration Tests**

```bash
# Start Firebase emulators
firebase emulators:start

# Run integration tests
npm run test:integration
```

**8.3 E2E Tests with Detox**

```bash
# Build iOS for E2E testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

**8.4 Setup GitHub Actions CI/CD**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  build-ios:
    runs-on: macos-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install pods
        run: cd ios && pod install
      
      - name: Build iOS
        run: |
          xcodebuild -workspace ios/myAPP.xcworkspace \
            -scheme myAPP \
            -configuration Debug \
            -sdk iphonesimulator \
            -derivedDataPath ios/build
  
  build-android:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android
        run: cd android && ./gradlew assembleDebug
```

**Deliverables:**
- ✅ 80%+ test coverage
- ✅ All unit tests passing
- ✅ Integration tests passing
- ✅ E2E tests for critical flows
- ✅ CI/CD pipeline configured

**Acceptance Criteria:**
- All tests passing in CI
- Code coverage meets thresholds
- E2E tests covering user and admin flows
- Automated builds working for both platforms

---

### Phase 9: Polish & Launch (Week 9-10)

**Duration:** 1 week  
**Team:** All engineers  
**Goal:** UI polish, performance optimization, app store submission

#### Tasks

**9.1 UI/UX Polish**

- [ ] Match design from `pilates-app-ui.html`
- [ ] Add loading states to all screens
- [ ] Implement pull-to-refresh
- [ ] Add error boundaries
- [ ] Toast notifications for actions
- [ ] Accessibility labels
- [ ] Dark mode support (optional)

**9.2 Performance Optimization**

```bash
# Profile with Flipper
npx react-native run-ios
# Open Flipper app

# Analyze bundle size
npx react-native-bundle-visualizer

# Enable Hermes (if not already)
# Edit android/app/build.gradle
# enableHermes: true
```

**9.3 App Store Metadata**

**iOS:**
- App name: "Pilates Training"
- Description: "Manage your Pilates training sessions with real-time scheduling and notifications"
- Screenshots: 6.5" iPhone, 12.9" iPad
- Privacy policy URL
- Support URL

**Android:**
- App name: "Pilates Training"
- Short description (80 chars)
- Full description (4000 chars)
- Screenshots: Phone + Tablet
- Feature graphic (1024x500)
- Privacy policy URL

**9.4 App Store Submission**

**iOS (TestFlight):**

```bash
# Archive build
xcodebuild -workspace ios/myAPP.xcworkspace \
  -scheme myAPP \
  -configuration Release \
  -archivePath build/myAPP.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/myAPP.xcarchive \
  -exportPath build \
  -exportOptionsPlist ios/ExportOptions.plist

# Upload via Transporter app or xcodebuild
xcrun altool --upload-app \
  --file build/myAPP.ipa \
  --type ios \
  --apiKey YOUR_API_KEY \
  --apiIssuer YOUR_ISSUER_ID
```

**Android (Internal Testing):**

```bash
# Generate signed APK/AAB
cd android
./gradlew bundleRelease

# AAB will be at: android/app/build/outputs/bundle/release/app-release.aab

# Upload to Google Play Console manually or via API
```

**Deliverables:**
- ✅ UI polished to match design
- ✅ Performance optimized
- ✅ Apps submitted to stores
- ✅ Beta testing initiated

**Acceptance Criteria:**
- App approved for TestFlight/Internal Testing
- No critical performance issues
- All features working on production Firebase
- Privacy policy and terms published

---

## Task Breakdown & Dependencies

### Gantt Chart (Simplified)

```
Week 1-2:  [Foundation========================================]
Week 2-3:       [Auth & Role==========================]
Week 3-4:            [Firestore Schema & Rules================]
Week 4-5:                 [Session CRUD===========================]
Week 5-6:                      [Calendar UI==========================]
Week 6-7:                           [Notifications=========================]
Week 7-8:                                [Admin Tools======================]
Week 8-9:                                     [Testing & CI/CD==================]
Week 9-10:                                          [Polish & Launch============]
```

### Critical Path

1. **Foundation** (blocking all others)
2. **Auth & Role** (blocking all feature development)
3. **Firestore Schema** (blocking CRUD operations)
4. **Session CRUD** (blocking calendar and notifications)
5. **Notifications** (can run parallel to Admin Tools)
6. **Testing** (should run parallel to all development)
7. **Launch** (depends on all previous phases)

---

## Milestone Deliverables

### Milestone 1: MVP Backend (End of Week 4)

**Deliverables:**
- ✅ Firebase project fully configured
- ✅ Authentication working (Google Sign-In)
- ✅ Firestore collections created with indexes
- ✅ Security rules deployed and tested
- ✅ Session CRUD operations functional

**Demo:** Admin can log in, create session for user, user can log in and see session

---

### Milestone 2: MVP Frontend (End of Week 6)

**Deliverables:**
- ✅ Calendar views working for user and admin
- ✅ Real-time sync operational
- ✅ User dashboard showing stats
- ✅ Session creation/editing UIs complete

**Demo:** End-to-end flow from admin creating session to user seeing it in calendar

---

### Milestone 3: Full Feature Set (End of Week 7)

**Deliverables:**
- ✅ Notifications scheduling working
- ✅ User settings for notification preferences
- ✅ Admin user management tools
- ✅ All core features implemented

**Demo:** Complete user and admin workflows including notifications

---

### Milestone 4: Production Ready (End of Week 9)

**Deliverables:**
- ✅ 80%+ test coverage
- ✅ CI/CD pipeline operational
- ✅ Performance optimized
- ✅ UI polished
- ✅ Apps submitted to stores

**Demo:** Production-ready app in TestFlight/Internal Testing

---

## Risk Management

### High-Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Firebase Spark plan quota exceeded | High | Medium | Monitor usage daily, implement caching, prepare Blaze upgrade plan |
| iOS notification limit (64) hit | Medium | High | Implement prioritization logic, reschedule on app open |
| Apple/Google app review rejection | High | Low | Follow guidelines strictly, prepare privacy policy, thorough testing |
| Android battery optimization kills notifications | Medium | High | Prompt users to whitelist app, document limitation |
| Timezone bugs in session scheduling | Medium | Medium | Comprehensive unit tests, test with multiple timezones |
| Security rules misconfiguration | Critical | Low | Test rules in emulator, peer review, incremental deployment |

### Mitigation Strategies

**Firebase Quota Management:**
```typescript
// Monitor quota usage
export const trackQuotaUsage = () => {
  analytics().logEvent('firestore_operation', {
    operation: 'read',
    timestamp: Date.now(),
  });
  
  // Set up alerts in Firebase Console at 80% quota
};
```

**Notification Prioritization:**
```typescript
// Prioritize upcoming sessions (iOS 64-notification limit)
const prioritizeSessions = (sessions: TrainingSession[]) => {
  return sessions
    .sort((a, b) => a.start_time.toMillis() - b.start_time.toMillis())
    .slice(0, 32); // Max 32 sessions × 2 notifications = 64
};
```

---

## Quality Assurance Strategy

### Code Review Process

1. **Feature Branch Development**
   - All work in feature branches
   - Branch naming: `feature/[TASK-ID]-description`
   - Regular commits with descriptive messages

2. **Pull Request Requirements**
   - All tests passing
   - No linting errors
   - Code coverage maintained
   - At least 1 approval required
   - Description of changes
   - Screenshots/videos for UI changes

3. **Review Checklist**
   - [ ] Code follows TypeScript best practices
   - [ ] Error handling implemented
   - [ ] Loading states added
   - [ ] Accessibility considered
   - [ ] Tests included
   - [ ] No console.log statements (use proper logging)
   - [ ] Security best practices followed

### Testing Checklist

**Unit Testing:**
- [ ] All utility functions tested
- [ ] Redux reducers/selectors tested
- [ ] Service layer tested with mocks
- [ ] Edge cases covered

**Integration Testing:**
- [ ] Auth flow tested with emulator
- [ ] Firestore operations tested
- [ ] Security rules validated
- [ ] Real-time listeners verified

**E2E Testing:**
- [ ] User login flow
- [ ] User dashboard and calendar
- [ ] Admin session creation
- [ ] Admin user management
- [ ] Notification scheduling

**Manual Testing:**
- [ ] iOS physical device testing
- [ ] Android physical device testing
- [ ] Different timezones
- [ ] Offline behavior
- [ ] Low battery/background mode
- [ ] Notification delivery

### Bug Tracking

**Use GitHub Issues with labels:**
- `bug` - Production bugs
- `enhancement` - New features
- `security` - Security issues (high priority)
- `performance` - Performance problems
- `ui` - UI/UX issues

**Bug Priority Levels:**
- **P0 (Critical):** App crashes, data loss, security breach
- **P1 (High):** Major feature broken, poor UX
- **P2 (Medium):** Minor bugs, cosmetic issues
- **P3 (Low):** Nice-to-have improvements

---

## Deployment Strategy

### Environment Setup

**Development:**
- Firebase project: `pilates-app-dev`
- Firestore: Dev data
- No production user data

**Staging:**
- Firebase project: `pilates-app-staging`
- Firestore: Copy of production schema
- Test with real-like data

**Production:**
- Firebase project: `pilates-app-prod`
- Firestore: Live user data
- Monitor closely

### Deployment Process

**Backend (Firebase):**

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project prod

# Deploy indexes
firebase deploy --only firestore:indexes --project prod

# Verify in console
firebase open firestore --project prod
```

**Mobile Apps:**

**iOS:**
1. Increment build number
2. Archive in Xcode
3. Upload to TestFlight
4. Submit for review
5. Monitor crash reports

**Android:**
1. Increment versionCode
2. Generate signed AAB
3. Upload to Play Console (Internal Testing)
4. Promote to Beta → Production
5. Monitor crash reports

### Rollback Plan

**If critical bug found post-launch:**

1. **Immediate:**
   - Pause app rollout in store
   - Post status update for users

2. **Fix:**
   - Create hotfix branch
   - Fix bug, test thoroughly
   - Fast-track review

3. **Deploy:**
   - Submit emergency update
   - Expedited review request
   - Resume rollout once approved

---

## Post-Launch Support

### Monitoring

**Firebase Console:**
- Daily quota usage checks
- Crash rate monitoring (target < 1%)
- Authentication metrics

**App Store Metrics:**
- Download/install rates
- Crash-free sessions (target > 99%)
- User reviews/ratings

**Custom Analytics:**

```typescript
// Track key user actions
analytics().logEvent('session_created', {
  user_role: 'admin',
  session_id: sessionId,
});

analytics().logEvent('notification_delivered', {
  type: '24H',
  on_time: true,
});
```

### Support Channels

**User Support:**
- In-app support email
- FAQ documentation
- Video tutorials for admin features

**Bug Reports:**
- GitHub Issues (private repo)
- Firebase Crashlytics auto-reporting
- User feedback form in app

### Maintenance Schedule

**Weekly:**
- Review Firebase quota usage
- Check crash reports
- Respond to user reviews
- Monitor notification delivery rates

**Monthly:**
- Dependency updates
- Security audit
- Performance review
- Feature usage analysis

**Quarterly:**
- Cost analysis (if upgraded to Blaze)
- User feedback review
- Roadmap planning
- Backup validation

---

## Appendix: Checklists

### Pre-Development Checklist

- [ ] Firebase project created (dev, staging, prod)
- [ ] Google Cloud OAuth configured
- [ ] Apple Developer account active
- [ ] Google Play Developer account active
- [ ] Development machines set up (Xcode, Android Studio)
- [ ] Git repository created
- [ ] Project management tool configured (Jira/Linear/GitHub Projects)
- [ ] Design assets finalized
- [ ] Privacy policy drafted
- [ ] Terms of service drafted

### Pre-Launch Checklist

- [ ] All features tested on iOS and Android
- [ ] Security rules peer-reviewed
- [ ] Performance profiling completed
- [ ] Crashlytics integrated
- [ ] Analytics events configured
- [ ] App icons and splash screens finalized
- [ ] App Store metadata prepared
- [ ] Screenshots taken
- [ ] Privacy policy published
- [ ] Support email configured
- [ ] Backup strategy validated
- [ ] Rollback plan documented

### Phase Completion Checklist Template

For each phase:
- [ ] All tasks completed
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Demo prepared and delivered
- [ ] Next phase dependencies verified
- [ ] Retrospective conducted
- [ ] Issues logged for future improvements

---

## Conclusion

This implementation plan provides a detailed roadmap for building the Pilates Training Mobile Application. Follow the phases sequentially, complete all deliverables, and maintain the quality standards outlined. Regular communication with stakeholders and adherence to the testing strategy will ensure a successful launch.

**Key Success Factors:**
- Stick to the timeline and dependencies
- Maintain 80%+ test coverage throughout
- Test on real devices frequently
- Monitor Firebase quotas proactively
- Document decisions and changes
- Conduct regular team syncs

**Next Steps:**
1. Team kickoff meeting
2. Assign roles and responsibilities
3. Set up development environments
4. Begin Phase 1: Foundation

**Questions or Issues:**
Contact the technical lead or project manager for clarification on any aspect of this plan.

---

**Document History:**
- v1.0 (2026-01-29): Initial implementation plan created

**Related Documents:**
- [Software Design Document (SDD.md)](./SDD.md)
- [System Design (system-design.md)](./system-design.md)
- [App Requirements (app-requirement.md)](./app-requirement.md)
