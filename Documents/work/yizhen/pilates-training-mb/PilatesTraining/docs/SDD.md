# Software Design Document: Pilates Training Mobile Application

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Target Audience:** Software Engineers (Implementation Team)

---

## System Purpose and Core Workflows

### System Purpose

This is a cross-platform mobile application (iOS and Android) built with React Native and TypeScript for managing Pilates training sessions. The system serves two distinct user roles:

- **Users (Trainees)**: Track their training sessions, view schedules, and receive automated reminders
- **Admins (Trainers)**: Manage all users, create/edit training sessions, and maintain training notes

The application uses Firebase as the backend infrastructure, specifically:
- **Firebase Authentication** with Google Sign-In (OAuth 2.0)
- **Cloud Firestore** for data persistence and real-time updates
- **Firebase Cloud Messaging** for device token registration
- **Client-side local notifications** for session reminders (Spark plan constraint)

### Core User Workflows

**User (Trainee) Journey:**

1. **Authentication**: User opens app → taps "Sign in with Google" → authenticates via Google OAuth → app retrieves user document from Firestore → verifies `role=USER` → navigates to User Dashboard
2. **View Dashboard**: User sees completed class count and next scheduled session
3. **Browse Calendar**: User taps "View Calendar" → sees monthly view with past/upcoming sessions marked → taps date to view session details (time, status, notes)
4. **Manage Notifications**: User goes to Settings → toggles notifications on/off → selects reminder rule (24H, 1H, or BOTH)
5. **Receive Reminders**: App listens to Firestore sessions → schedules local notifications → OS fires notification at scheduled time → user taps notification → app opens to session detail

**Admin (Trainer) Journey:**

1. **Authentication**: Admin opens app → signs in with Google → app retrieves user document → verifies `role=ADMIN` → navigates to Admin Calendar
2. **View Schedule**: Admin sees calendar with all users' sessions color-coded or marked
3. **Create Session**: Admin taps date → modal opens → selects user from dropdown (alphabetically sorted) → views user stats (completed classes, last 5 notes) → enters start/end time and training notes → submits → Firestore writes `training_session` document → user's app receives real-time update → user's app reschedules notifications
4. **Edit Session**: Admin taps existing session → edit modal opens → updates time, notes, or status (COMPLETED, CANCELLED, NO_SHOW) → submits → Firestore updates document → all connected clients sync
5. **Manage Users**: Admin navigates to User List → filters by status (IN_TRAINING/INACTIVE) → taps user → edits username, email, or status → saves → Firestore updates `user` document

### Role Separation and Scope

- **Users** can only:
  - Read their own profile
  - Read training sessions where `user_id == their UID`
  - Write their own notification preferences
  - Write their own device tokens
  
- **Admins** can:
  - Read all users and sessions
  - Create/update/delete training sessions for any user
  - Update user profiles and statuses
  - Perform all User role actions on their own account

- **Firestore Security Rules** enforce these permissions server-side
- **Redux state management** ensures client-side UI reflects current role

---

## Architecture Overview (React Native + Firebase Spark Plan)

### Technology Stack

**Frontend:**
- **React Native** 0.73+ with **TypeScript** for type safety
- **Redux Toolkit** for global state management
- **React Navigation** for screen routing
- **React Native Calendar** for calendar UI
- **@react-native-firebase/app**, **auth**, **firestore**, **messaging** for Firebase integration
- **@notifee/react-native** or **react-native-push-notification** for local notification scheduling

**Backend:**
- **Firebase Spark Plan** (free tier) with limitations:
  - No Cloud Functions
  - No Cloud Scheduler
  - 50,000 Firestore reads/day
  - 20,000 Firestore writes/day
  - 1 GB stored data

**Authentication:**
- **Firebase Authentication** with Google Sign-In provider
- OAuth 2.0 flow handled by Firebase SDK

**Database:**
- **Cloud Firestore** (NoSQL document database)
- Real-time listeners for data synchronization
- Offline persistence enabled

**Notifications:**
- **Firebase Cloud Messaging (FCM)** for token registration only
- **Client-side local notifications** scheduled using native OS APIs

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native App (iOS/Android)              │
│                                                                 │
│  ┌──────────────┐   ┌─────────────┐   ┌────────────────────┐  │
│  │  UI Layer    │   │ Redux Store │   │ Firebase SDK Layer │  │
│  │              │   │             │   │                    │  │
│  │ - Login      │◄─►│ - Auth      │◄─►│ - Auth API        │  │
│  │ - Dashboard  │   │ - User      │   │ - Firestore SDK   │  │
│  │ - Calendar   │   │ - Sessions  │   │ - FCM SDK         │  │
│  │ - Settings   │   │ - Prefs     │   │                    │  │
│  │ - Admin UI   │   │             │   │                    │  │
│  └──────────────┘   └─────────────┘   └────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     Local Notification Scheduler (Client-Side)           │  │
│  │  - Listens to Firestore sessions                         │  │
│  │  - Calculates reminder times (24H/1H/BOTH)               │  │
│  │  - Schedules via UNUserNotificationCenter (iOS)          │  │
│  │  - Schedules via WorkManager/AlarmManager (Android)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS (TLS 1.3)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Services                        │
│                                                                 │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Firebase Auth  │  │  Cloud Firestore │  │ Cloud Messaging│  │
│  │                │  │                  │  │ (FCM)          │  │
│  │ - Google OAuth │  │ - users          │  │ - Token Mgmt   │  │
│  │ - JWT Tokens   │  │ - sessions       │  │ - APNs Bridge  │  │
│  │                │  │ - device_tokens  │  │                │  │
│  │                │  │ - preferences    │  │                │  │
│  │                │  │                  │  │                │  │
│  │                │  │ Security Rules   │  │                │  │
│  │                │  │ - RBAC           │  │                │  │
│  └────────────────┘  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Key Scenarios

**Scenario 1: User Login and Dashboard Load**

1. User taps "Sign in with Google" → UI calls Firebase Auth SDK
2. Firebase Auth opens Google OAuth consent screen → user approves
3. Firebase Auth returns `UserCredential` with `uid`
4. App queries Firestore `users/{uid}` → retrieves document
5. App stores `{uid, role, username, email}` in Redux auth slice
6. App checks `role === 'USER'` → navigates to User Dashboard
7. Dashboard component mounts → dispatches Redux action to fetch sessions
8. Redux thunk queries Firestore: `training_sessions.where('user_id', '==', uid).where('end_time', '<', now).where('status', '!=', 'CANCELLED')` → counts for completed classes
9. Redux thunk queries Firestore: `training_sessions.where('user_id', '==', uid).where('start_time', '>', now).where('status', '==', 'SCHEDULED').orderBy('start_time', 'asc').limit(1)` → fetches next session
10. Redux updates state → UI re-renders with data

**Scenario 2: Admin Creates Session → User Gets Notification**

1. Admin taps date on calendar → "Create Session" modal opens
2. Admin selects user, enters time and notes → taps "Save"
3. UI dispatches Redux action → calls Firestore SDK: `firestore().collection('training_sessions').add({user_id, created_by_id, start_time, end_time, status: 'SCHEDULED', notes, created_at, updated_at})`
4. Firestore writes document → returns document ID
5. **Real-time listener on admin's app** triggers → Redux updates calendar state → modal closes → UI shows new session marker
6. **Real-time listener on user's app** (listening to `training_sessions.where('user_id', '==', uid)`) triggers → Redux receives new session document
7. **Notification Scheduler Service** (background or foreground listener) detects new session → calculates reminder times:
   - If user preference is `24H`: schedule 1 notification 24 hours before `start_time`
   - If user preference is `1H`: schedule 1 notification 1 hour before `start_time`
   - If user preference is `BOTH`: schedule 2 notifications (24H and 1H before)
8. Notification service calls native API:
   - **iOS**: `UNUserNotificationCenter.add()` with trigger date
   - **Android**: `WorkManager.enqueueWork()` or `AlarmManager.setExact()`
9. OS registers notification → fires at scheduled time → user receives alert

**Scenario 3: Offline Behavior**

1. User opens app while offline → Firestore SDK checks local cache
2. UI loads cached sessions from last sync → displays "Offline" indicator
3. User navigates calendar → reads from local cache
4. User reconnects → Firestore SDK syncs queued writes (if any) → fetches new documents → updates cache → triggers listeners → Redux state updates → UI reflects latest data

### Spark Plan Constraints and Workarounds

**Constraint:** No Cloud Functions for server-side notification scheduling

**Workaround:**
- Implement **client-side notification scheduler** that listens to Firestore sessions in real-time
- Schedule local notifications using native OS APIs
- Reschedule on app startup to handle missed schedules

**Limitations:**
- Notifications lost if user uninstalls app or clears data
- Requires app to run periodically (background refresh) to maintain schedules
- No server-side enforcement of notification delivery

**Future Migration Path:**
- Upgrade to **Blaze Plan** → deploy Cloud Function triggered by Firestore writes → send FCM data messages → guaranteed delivery

---

## Authentication and Role-Based Access Control

### Implementation: Google Sign-In

**Libraries:**
- `@react-native-firebase/auth`
- `@react-native-google-signin/google-signin`

**Configuration Files:**
- **iOS**: `GoogleService-Info.plist` (from Firebase Console)
- **Android**: `google-services.json` (from Firebase Console)
- **Firebase Console**: Enable Google Sign-In provider in Authentication settings

**Code Implementation (TypeScript):**

```typescript
// services/auth.service.ts
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';

export interface User {
  uid: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'IN_TRAINING' | 'INACTIVE';
}

export const initializeGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE',
  });
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Step 1: Get Google ID token
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    
    // Step 2: Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // Step 3: Sign in to Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);
    const { uid } = userCredential.user;
    
    // Step 4: Fetch or create user document in Firestore
    const userDoc = await firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // New user - create document with default role
      const newUser = {
        username: userCredential.user.displayName || 'New User',
        gmail: userCredential.user.email!,
        role: 'USER',
        status: 'INACTIVE',
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      };
      await firestore().collection('users').doc(uid).set(newUser);
      
      return {
        uid,
        username: newUser.username,
        email: newUser.gmail,
        role: 'USER',
        status: 'INACTIVE',
      };
    }
    
    // Existing user - return data
    const userData = userDoc.data()!;
    return {
      uid,
      username: userData.username,
      email: userData.gmail,
      role: userData.role,
      status: userData.status,
    };
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  await GoogleSignin.signOut();
  await auth().signOut();
};
```

**Redux Integration:**

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithGoogle, signOut, User } from '../../services/auth.service';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async () => {
    return await signInWithGoogle();
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await signOut();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
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

export default authSlice.reducer;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'ADMIN';
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
```

### Role-Based Navigation

**Implementation:**

```typescript
// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin } from '../store/slices/authSlice';

// Screens
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/user/UserDashboard';
import UserCalendar from '../screens/user/UserCalendar';
import UserSettings from '../screens/user/UserSettings';
import AdminCalendar from '../screens/admin/AdminCalendar';
import AdminUserList from '../screens/admin/AdminUserList';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  
  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAdmin ? (
          <>
            <Stack.Screen name="AdminCalendar" component={AdminCalendar} />
            <Stack.Screen name="AdminUserList" component={AdminUserList} />
          </>
        ) : (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="UserCalendar" component={UserCalendar} />
            <Stack.Screen name="UserSettings" component={UserSettings} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### First Admin Bootstrap Process

**Option 1: Firebase Console (Recommended for MVP)**

1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the document with the admin's Google account UID (check Authentication tab for UID)
4. Edit document → set `role: "ADMIN"`
5. Admin can now log in and access Admin Portal

**Option 2: Firebase Admin SDK Script (One-Time)**

```javascript
// scripts/createAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const createAdmin = async (email) => {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(user.uid).set({
      username: user.displayName || 'Admin',
      gmail: email,
      role: 'ADMIN',
      status: 'IN_TRAINING', // Admins can also be trainees
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log(`✅ Admin created: ${email} (${user.uid})`);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};

// Usage: node createAdmin.js
createAdmin('admin@example.com');
```

**Run once during initial deployment.**

### User Onboarding Lifecycle

**New User Flow:**

1. User signs in with Google for the first time
2. App checks if `users/{uid}` document exists
3. **Document doesn't exist** → app creates new document:
   ```typescript
   {
     username: displayName,
     gmail: email,
     role: 'USER',
     status: 'INACTIVE', // Admin must activate
     created_at: serverTimestamp(),
     updated_at: serverTimestamp(),
   }
   ```
4. User sees dashboard with message: "Your account is pending activation. Please contact your trainer."
5. Admin navigates to User List → sees new user with status `INACTIVE` → edits user → changes status to `IN_TRAINING` → saves
6. User's app (real-time listener on own user document) receives update → Redux updates status → UI shows "Account Activated!"

### Firestore Security Rules: RBAC Enforcement

**Full Rules Implementation:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'ADMIN';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidTimestamp(timestamp) {
      return timestamp is timestamp;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read their own profile
      allow read: if isOwner(userId);
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // New users can create their own profile on first login
      allow create: if isOwner(userId)
                    && request.resource.data.role == 'USER'
                    && request.resource.data.status == 'INACTIVE'
                    && isValidEmail(request.resource.data.gmail)
                    && request.resource.data.username is string
                    && request.resource.data.created_at == request.time
                    && request.resource.data.updated_at == request.time;
      
      // Users can update their own username
      allow update: if isOwner(userId)
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'gmail'])
                    && request.resource.data.updated_at == request.time;
      
      // Admins can update any user
      allow update: if isAdmin()
                    && request.resource.data.role in ['USER', 'ADMIN']
                    && request.resource.data.status in ['IN_TRAINING', 'INACTIVE']
                    && isValidEmail(request.resource.data.gmail)
                    && request.resource.data.updated_at == request.time;
      
      // No deletes allowed
      allow delete: if false;
    }
    
    // Training sessions
    match /training_sessions/{sessionId} {
      // Users can read their own sessions
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      
      // Admins can read all sessions
      allow read: if isAdmin();
      
      // Admins can create sessions
      allow create: if isAdmin()
                    && request.resource.data.user_id is string
                    && request.resource.data.created_by_id == request.auth.uid
                    && request.resource.data.status in ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
                    && request.resource.data.end_time > request.resource.data.start_time
                    && isValidTimestamp(request.resource.data.start_time)
                    && isValidTimestamp(request.resource.data.end_time)
                    && request.resource.data.created_at == request.time
                    && request.resource.data.updated_at == request.time;
      
      // Admins can update sessions
      allow update: if isAdmin()
                    && request.resource.data.status in ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
                    && request.resource.data.end_time > request.resource.data.start_time
                    && request.resource.data.updated_at == request.time
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['user_id', 'created_by_id', 'created_at']);
      
      // Admins can delete sessions
      allow delete: if isAdmin();
    }
    
    // Device tokens
    match /device_tokens/{tokenId} {
      // Users can write their own tokens
      allow create, update: if isAuthenticated()
                            && request.resource.data.user_id == request.auth.uid
                            && request.resource.data.platform in ['IOS', 'ANDROID']
                            && request.resource.data.fcm_token is string
                            && request.resource.data.last_seen_at == request.time;
      
      // Users can read their own tokens
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      
      // Admins can read all tokens
      allow read: if isAdmin();
      
      // Users can delete their own tokens
      allow delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    
    // Notification preferences
    match /notification_preferences/{userId} {
      // Users can read/write their own preferences
      allow read, write: if isOwner(userId)
                         && request.resource.data.enabled is bool
                         && request.resource.data.rule in ['24H', '1H', 'BOTH']
                         && request.resource.data.updated_at == request.time;
      
      // Admins can read all preferences
      allow read: if isAdmin();
    }
  }
}
```

### Secure Token Storage

**Implementation Notes:**

- Firebase Auth SDK automatically stores tokens in:
  - **iOS**: Keychain (encrypted, sandboxed per app)
  - **Android**: EncryptedSharedPreferences (AES-256)
- No custom token storage required
- Tokens auto-refresh via SDK
- Listen to auth state changes:

```typescript
// App.tsx
import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from './store/slices/authSlice';

export default function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in - fetch Firestore profile
        const userDoc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get();
        
        if (userDoc.exists) {
          dispatch(setUser({
            uid: firebaseUser.uid,
            ...userDoc.data(),
          }));
        }
      } else {
        // User logged out
        dispatch(clearUser());
      }
    });
    
    return unsubscribe;
  }, []);
  
  return <AppNavigator />;
}
```

---

## Firestore Data Model and Collection Design

### Collection: `users`

**Document ID:** Firebase Auth UID (string)

**Schema:**

```typescript
interface UserDocument {
  username: string;          // Display name
  gmail: string;             // Google email (unique across collection)
  role: 'USER' | 'ADMIN';    // Access control
  status: 'IN_TRAINING' | 'INACTIVE'; // Only relevant for USER role
  created_at: Timestamp;     // Document creation time
  updated_at: Timestamp;     // Last modification time
}
```

**Example Document:**

```json
{
  "username": "Jane Doe",
  "gmail": "jane.doe@gmail.com",
  "role": "USER",
  "status": "IN_TRAINING",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-20T14:22:00Z"
}
```

**Indexes:**

- **Single-field index on `gmail`** (ascending, unique constraint enforced by Security Rules + client validation)
- Composite index not required for this collection

**Query Patterns:**

1. **Get user by UID** (document read):
   ```typescript
   firestore().collection('users').doc(uid).get()
   ```

2. **Admin: List all users ordered by username**:
   ```typescript
   firestore().collection('users').orderBy('username', 'asc').get()
   ```

3. **Admin: Filter users by status**:
   ```typescript
   firestore()
     .collection('users')
     .where('role', '==', 'USER')
     .where('status', '==', 'IN_TRAINING')
     .orderBy('username', 'asc')
     .get()
   ```

### Collection: `training_sessions`

**Document ID:** Auto-generated by Firestore

**Schema:**

```typescript
interface TrainingSessionDocument {
  user_id: string;           // FK to users/{uid}
  created_by_id: string;     // FK to users/{uid} (admin who created)
  start_time: Timestamp;     // Session start (UTC)
  end_time: Timestamp;       // Session end (UTC)
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string;             // Training content/observations
  created_at: Timestamp;     // Document creation time
  updated_at: Timestamp;     // Last modification time
}
```

**Example Document:**

```json
{
  "user_id": "abc123uid",
  "created_by_id": "xyz789adminuid",
  "start_time": "2026-02-01T09:00:00Z",
  "end_time": "2026-02-01T10:00:00Z",
  "status": "SCHEDULED",
  "notes": "Focus on core strengthening and posture",
  "created_at": "2026-01-25T15:00:00Z",
  "updated_at": "2026-01-25T15:00:00Z"
}
```

**Indexes:**

Required composite indexes (create in Firebase Console or via `firestore.indexes.json`):

1. **Collection: `training_sessions`**
   - Fields: `user_id` (ascending), `start_time` (ascending)
   - Query scope: Collection
   - Used for: User calendar queries

2. **Collection: `training_sessions`**
   - Fields: `user_id` (ascending), `end_time` (ascending), `status` (ascending)
   - Query scope: Collection
   - Used for: Completed class counting

3. **Collection: `training_sessions`**
   - Fields: `start_time` (ascending), `status` (ascending)
   - Query scope: Collection
   - Used for: Admin global calendar queries

**Query Patterns:**

1. **User: Get all sessions for calendar month**:
   ```typescript
   const startOfMonth = new Date(2026, 1, 1); // Feb 1, 2026
   const endOfMonth = new Date(2026, 2, 0); // Last day of Feb
   
   firestore()
     .collection('training_sessions')
     .where('user_id', '==', currentUserUid)
     .where('start_time', '>=', startOfMonth)
     .where('start_time', '<=', endOfMonth)
     .orderBy('start_time', 'asc')
     .get()
   ```

2. **User: Count completed classes**:
   ```typescript
   const now = new Date();
   
   const snapshot = await firestore()
     .collection('training_sessions')
     .where('user_id', '==', currentUserUid)
     .where('end_time', '<', now)
     .where('status', '!=', 'CANCELLED')
     .get();
   
   const completedCount = snapshot.size;
   ```

3. **User: Get next scheduled session**:
   ```typescript
   const now = new Date();
   
   firestore()
     .collection('training_sessions')
     .where('user_id', '==', currentUserUid)
     .where('start_time', '>', now)
     .where('status', '==', 'SCHEDULED')
     .orderBy('start_time', 'asc')
     .limit(1)
     .get()
   ```

4. **Admin: Get all sessions for a specific date**:
   ```typescript
   const startOfDay = new Date(2026, 1, 15, 0, 0, 0);
   const endOfDay = new Date(2026, 1, 15, 23, 59, 59);
   
   firestore()
     .collection('training_sessions')
     .where('start_time', '>=', startOfDay)
     .where('start_time', '<=', endOfDay)
     .orderBy('start_time', 'asc')
     .get()
   ```

5. **Admin: Get last 5 training notes for a user**:
   ```typescript
   firestore()
     .collection('training_sessions')
     .where('user_id', '==', selectedUserUid)
     .where('status', 'in', ['COMPLETED', 'NO_SHOW'])
     .orderBy('end_time', 'desc')
     .limit(5)
     .get()
   ```

### Collection: `device_tokens`

**Document ID:** Auto-generated by Firestore

**Schema:**

```typescript
interface DeviceTokenDocument {
  user_id: string;           // FK to users/{uid}
  platform: 'IOS' | 'ANDROID';
  fcm_token: string;         // Firebase Cloud Messaging token (unique)
  last_seen_at: Timestamp;   // Last time this token was refreshed
  created_at: Timestamp;     // First registration time
  updated_at: Timestamp;     // Last update time
}
```

**Example Document:**

```json
{
  "user_id": "abc123uid",
  "platform": "IOS",
  "fcm_token": "eXaMpLeFcMToKeN123456789",
  "last_seen_at": "2026-01-29T08:00:00Z",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-29T08:00:00Z"
}
```

**Indexes:**

- Single-field index on `user_id` (ascending)
- Single-field index on `fcm_token` (ascending, for uniqueness checks)

**Query Patterns:**

1. **Get all tokens for a user**:
   ```typescript
   firestore()
     .collection('device_tokens')
     .where('user_id', '==', uid)
     .get()
   ```

2. **Register or update token**:
   ```typescript
   // Check if token already exists
   const existing = await firestore()
     .collection('device_tokens')
     .where('fcm_token', '==', newToken)
     .limit(1)
     .get();
   
   if (existing.empty) {
     // Create new token
     await firestore().collection('device_tokens').add({
       user_id: uid,
       platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
       fcm_token: newToken,
       last_seen_at: firestore.FieldValue.serverTimestamp(),
       created_at: firestore.FieldValue.serverTimestamp(),
       updated_at: firestore.FieldValue.serverTimestamp(),
     });
   } else {
     // Update last_seen_at
     const docId = existing.docs[0].id;
     await firestore().collection('device_tokens').doc(docId).update({
       last_seen_at: firestore.FieldValue.serverTimestamp(),
       updated_at: firestore.FieldValue.serverTimestamp(),
     });
   }
   ```

### Collection: `notification_preferences`

**Document ID:** User UID (one document per user)

**Schema:**

```typescript
interface NotificationPreferenceDocument {
  enabled: boolean;          // Master toggle for notifications
  rule: '24H' | '1H' | 'BOTH'; // When to send reminders
  updated_at: Timestamp;     // Last modification time
}
```

**Example Document:**

```json
{
  "enabled": true,
  "rule": "BOTH",
  "updated_at": "2026-01-20T14:30:00Z"
}
```

**Indexes:**

- No indexes required (queries always by document ID)

**Query Patterns:**

1. **Get user's notification preferences**:
   ```typescript
   const prefs = await firestore()
     .collection('notification_preferences')
     .doc(uid)
     .get();
   
   if (!prefs.exists) {
     // Create default preferences
     await firestore().collection('notification_preferences').doc(uid).set({
       enabled: true,
       rule: '24H',
       updated_at: firestore.FieldValue.serverTimestamp(),
     });
   }
   ```

2. **Update preferences**:
   ```typescript
   await firestore()
     .collection('notification_preferences')
     .doc(uid)
     .set({
       enabled: newEnabled,
       rule: newRule,
       updated_at: firestore.FieldValue.serverTimestamp(),
     }, { merge: true });
   ```

### Firestore Configuration

**Enable Offline Persistence:**

```typescript
// App initialization
import firestore from '@react-native-firebase/firestore';

firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

**Timestamp Handling:**

Always use `firestore.FieldValue.serverTimestamp()` for `created_at` and `updated_at` fields to ensure consistency across clients.

**UTC Storage:**

All `Timestamp` fields in Firestore store dates in UTC automatically. Client-side conversion to local timezone is handled in UI layer.

---

## Firestore Read/Write Operations

### Client-Side Data Operations

Since Cloud Functions are not available on the Spark plan, all database operations are performed directly from the mobile app using the Firestore SDK. This section documents the implementation patterns for each operation.

### Admin: Create Training Session

**Trigger:** Admin taps "Save" on Create Session modal

**Implementation:**

```typescript
// services/session.service.ts
import firestore from '@react-native-firebase/firestore';

export interface CreateSessionParams {
  userId: string;
  startTime: Date;
  endTime: Date;
  notes: string;
  createdById: string;
}

export const createTrainingSession = async (
  params: CreateSessionParams
): Promise<string> => {
  try {
    const sessionRef = await firestore()
      .collection('training_sessions')
      .add({
        user_id: params.userId,
        created_by_id: params.createdById,
        start_time: firestore.Timestamp.fromDate(params.startTime),
        end_time: firestore.Timestamp.fromDate(params.endTime),
        status: 'SCHEDULED',
        notes: params.notes,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
    
    return sessionRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create training session');
  }
};
```

**Redux Action:**

```typescript
// store/slices/sessionsSlice.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createTrainingSession } from '../../services/session.service';

export const createSession = createAsyncThunk(
  'sessions/create',
  async (params: CreateSessionParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const createdById = state.auth.user?.uid;
      
      if (!createdById) {
        throw new Error('User not authenticated');
      }
      
      const sessionId = await createTrainingSession({
        ...params,
        createdById,
      });
      
      return { id: sessionId, ...params };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

**UI Component:**

```typescript
// screens/admin/CreateSessionModal.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createSession } from '../../store/slices/sessionsSlice';

export default function CreateSessionModal({ selectedDate, onClose }) {
  const dispatch = useDispatch();
  const [userId, setUserId] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    // Validation
    if (!userId) {
      alert('Please select a user');
      return;
    }
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }
    
    setLoading(true);
    try {
      await dispatch(createSession({
        userId,
        startTime,
        endTime,
        notes,
      })).unwrap();
      
      onClose();
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // UI implementation...
  );
}
```

### Admin: Update Training Session

**Trigger:** Admin taps "Save" on Edit Session modal

**Implementation:**

```typescript
// services/session.service.ts
export interface UpdateSessionParams {
  sessionId: string;
  startTime?: Date;
  endTime?: Date;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
}

export const updateTrainingSession = async (
  params: UpdateSessionParams
): Promise<void> => {
  try {
    const updates: any = {
      updated_at: firestore.FieldValue.serverTimestamp(),
    };
    
    if (params.startTime) {
      updates.start_time = firestore.Timestamp.fromDate(params.startTime);
    }
    if (params.endTime) {
      updates.end_time = firestore.Timestamp.fromDate(params.endTime);
    }
    if (params.status) {
      updates.status = params.status;
    }
    if (params.notes !== undefined) {
      updates.notes = params.notes;
    }
    
    await firestore()
      .collection('training_sessions')
      .doc(params.sessionId)
      .update(updates);
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update training session');
  }
};
```

### Admin: Delete Training Session

**Implementation:**

```typescript
// services/session.service.ts
export const deleteTrainingSession = async (sessionId: string): Promise<void> => {
  try {
    await firestore()
      .collection('training_sessions')
      .doc(sessionId)
      .delete();
  } catch (error) {
    console.error('Error deleting session:', error);
    throw new Error('Failed to delete training session');
  }
};
```

### User: Fetch Own Sessions

**Trigger:** User navigates to Calendar screen or Dashboard mounts

**Implementation:**

```typescript
// services/session.service.ts
export const fetchUserSessions = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TrainingSessionDocument[]> => {
  try {
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
    })) as TrainingSessionDocument[];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw new Error('Failed to fetch sessions');
  }
};

export const fetchNextSession = async (userId: string): Promise<TrainingSessionDocument | null> => {
  try {
    const now = new Date();
    const snapshot = await firestore()
      .collection('training_sessions')
      .where('user_id', '==', userId)
      .where('start_time', '>', firestore.Timestamp.fromDate(now))
      .where('status', '==', 'SCHEDULED')
      .orderBy('start_time', 'asc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as TrainingSessionDocument;
  } catch (error) {
    console.error('Error fetching next session:', error);
    return null;
  }
};

export const countCompletedSessions = async (userId: string): Promise<number> => {
  try {
    const now = new Date();
    const snapshot = await firestore()
      .collection('training_sessions')
      .where('user_id', '==', userId)
      .where('end_time', '<', firestore.Timestamp.fromDate(now))
      .where('status', '!=', 'CANCELLED')
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Error counting completed sessions:', error);
    return 0;
  }
};
```

### Admin: Fetch All Users with Pagination

**Implementation:**

```typescript
// services/user.service.ts
import firestore from '@react-native-firebase/firestore';

export interface UserWithStats {
  uid: string;
  username: string;
  gmail: string;
  role: 'USER' | 'ADMIN';
  status: 'IN_TRAINING' | 'INACTIVE';
  completedClasses?: number;
  nextSession?: Date | null;
}

export const fetchUsers = async (
  lastDoc?: firestore.DocumentSnapshot,
  statusFilter?: 'IN_TRAINING' | 'INACTIVE',
  limit: number = 20
): Promise<{ users: UserWithStats[], lastDoc: firestore.DocumentSnapshot | null }> => {
  try {
    let query = firestore()
      .collection('users')
      .where('role', '==', 'USER')
      .orderBy('username', 'asc');
    
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserWithStats[];
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { users, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};
```

### Admin: Update User

**Implementation:**

```typescript
// services/user.service.ts
export interface UpdateUserParams {
  uid: string;
  username?: string;
  gmail?: string;
  status?: 'IN_TRAINING' | 'INACTIVE';
}

export const updateUser = async (params: UpdateUserParams): Promise<void> => {
  try {
    const updates: any = {
      updated_at: firestore.FieldValue.serverTimestamp(),
    };
    
    if (params.username) updates.username = params.username;
    if (params.gmail) updates.gmail = params.gmail;
    if (params.status) updates.status = params.status;
    
    await firestore()
      .collection('users')
      .doc(params.uid)
      .update(updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};
```

### User: Register Device Token

**Trigger:** App startup or FCM token refresh

**Implementation:**

```typescript
// services/notification.service.ts
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

export const registerDeviceToken = async (userId: string): Promise<void> => {
  try {
    // Request permission (iOS only)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (!enabled) {
      console.warn('User denied notification permissions');
      return;
    }
    
    // Get FCM token
    const fcmToken = await messaging().getToken();
    
    // Check if token already exists
    const existingTokens = await firestore()
      .collection('device_tokens')
      .where('fcm_token', '==', fcmToken)
      .limit(1)
      .get();
    
    if (existingTokens.empty) {
      // Create new token document
      await firestore().collection('device_tokens').add({
        user_id: userId,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        fcm_token: fcmToken,
        last_seen_at: firestore.FieldValue.serverTimestamp(),
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing token's last_seen_at
      const tokenDoc = existingTokens.docs[0];
      await firestore()
        .collection('device_tokens')
        .doc(tokenDoc.id)
        .update({
          user_id: userId, // Update user_id in case token was reassigned
          last_seen_at: firestore.FieldValue.serverTimestamp(),
          updated_at: firestore.FieldValue.serverTimestamp(),
        });
    }
    
    console.log('Device token registered successfully');
  } catch (error) {
    console.error('Error registering device token:', error);
  }
};

// Listen for token refresh
export const setupTokenRefreshListener = (userId: string): (() => void) => {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM token refreshed:', newToken);
    await registerDeviceToken(userId);
  });
  
  return unsubscribe;
};
```

### User: Update Notification Preferences

**Trigger:** User toggles settings in Settings screen

**Implementation:**

```typescript
// services/notification.service.ts
export interface NotificationPreferences {
  enabled: boolean;
  rule: '24H' | '1H' | 'BOTH';
}

export const updateNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
): Promise<void> => {
  try {
    await firestore()
      .collection('notification_preferences')
      .doc(userId)
      .set({
        enabled: preferences.enabled,
        rule: preferences.rule,
        updated_at: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw new Error('Failed to update notification preferences');
  }
};

export const fetchNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  try {
    const doc = await firestore()
      .collection('notification_preferences')
      .doc(userId)
      .get();
    
    if (!doc.exists) {
      // Create default preferences
      const defaults: NotificationPreferences = {
        enabled: true,
        rule: '24H',
      };
      
      await updateNotificationPreferences(userId, defaults);
      return defaults;
    }
    
    return doc.data() as NotificationPreferences;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return { enabled: true, rule: '24H' }; // Fallback defaults
  }
};
```

### Batch Operations

**Admin: Fetch User Stats in Bulk**

When displaying user list, fetch stats for multiple users efficiently:

```typescript
// services/user.service.ts
export const enrichUsersWithStats = async (
  users: UserWithStats[]
): Promise<UserWithStats[]> => {
  const now = new Date();
  
  const enrichedUsers = await Promise.all(
    users.map(async (user) => {
      try {
        // Fetch completed classes count
        const completedSnapshot = await firestore()
          .collection('training_sessions')
          .where('user_id', '==', user.uid)
          .where('end_time', '<', firestore.Timestamp.fromDate(now))
          .where('status', '!=', 'CANCELLED')
          .get();
        
        // Fetch next session
        const nextSnapshot = await firestore()
          .collection('training_sessions')
          .where('user_id', '==', user.uid)
          .where('start_time', '>', firestore.Timestamp.fromDate(now))
          .where('status', '==', 'SCHEDULED')
          .orderBy('start_time', 'asc')
          .limit(1)
          .get();
        
        return {
          ...user,
          completedClasses: completedSnapshot.size,
          nextSession: nextSnapshot.empty
            ? null
            : nextSnapshot.docs[0].data().start_time.toDate(),
        };
      } catch (error) {
        console.error(`Error fetching stats for user ${user.uid}:`, error);
        return user;
      }
    })
  );
  
  return enrichedUsers;
};
```

**Note:** This pattern makes 2N queries (where N = number of users). For large user lists, consider:
- Implementing server-side aggregation (requires Blaze plan + Cloud Functions)
- Caching stats in Redux store with TTL
- Lazy-loading stats only when user row is visible (virtualized list)

---

## Real-Time Data Synchronization

### Firestore Real-Time Listeners

Firestore's real-time listeners enable automatic UI updates when data changes in the database. This section documents the implementation patterns for all listener scenarios.

### User: Listen to Own Training Sessions

**Purpose:** Auto-update calendar and dashboard when admin creates/edits sessions

**Implementation:**

```typescript
// hooks/useSessions.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { setSessions, addSession, updateSession, removeSession } from '../store/slices/sessionsSlice';
import { selectUser } from '../store/slices/authSlice';

export const useUserSessions = (startDate: Date, endDate: Date) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = firestore()
      .collection('training_sessions')
      .where('user_id', '==', user.uid)
      .where('start_time', '>=', firestore.Timestamp.fromDate(startDate))
      .where('start_time', '<=', firestore.Timestamp.fromDate(endDate))
      .orderBy('start_time', 'asc')
      .onSnapshot(
        (snapshot) => {
          // Process document changes
          snapshot.docChanges().forEach((change) => {
            const session = {
              id: change.doc.id,
              ...change.doc.data(),
            };
            
            if (change.type === 'added') {
              dispatch(addSession(session));
            } else if (change.type === 'modified') {
              dispatch(updateSession(session));
            } else if (change.type === 'removed') {
              dispatch(removeSession(session.id));
            }
          });
        },
        (error) => {
          console.error('Error in sessions listener:', error);
        }
      );
    
    return () => unsubscribe();
  }, [user, startDate, endDate]);
};
```

**Usage in Component:**

```typescript
// screens/user/UserCalendar.tsx
import React, { useState } from 'react';
import { useUserSessions } from '../../hooks/useSessions';

export default function UserCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  // This hook automatically updates Redux when sessions change
  useUserSessions(startOfMonth, endOfMonth);
  
  const sessions = useSelector(selectSessionsForMonth(selectedMonth));
  
  return (
    // Calendar UI renders sessions from Redux store
  );
}
```

### Admin: Listen to All Training Sessions

**Purpose:** Auto-update admin calendar when any admin creates/edits sessions

**Implementation:**

```typescript
// hooks/useSessions.ts
export const useAdminSessions = (startDate: Date, endDate: Date) => {
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);
  
  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubscribe = firestore()
      .collection('training_sessions')
      .where('start_time', '>=', firestore.Timestamp.fromDate(startDate))
      .where('start_time', '<=', firestore.Timestamp.fromDate(endDate))
      .orderBy('start_time', 'asc')
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const session = {
              id: change.doc.id,
              ...change.doc.data(),
            };
            
            if (change.type === 'added') {
              dispatch(addSession(session));
            } else if (change.type === 'modified') {
              dispatch(updateSession(session));
            } else if (change.type === 'removed') {
              dispatch(removeSession(session.id));
            }
          });
        },
        (error) => {
          console.error('Error in admin sessions listener:', error);
        }
      );
    
    return () => unsubscribe();
  }, [isAdmin, startDate, endDate]);
};
```

### User: Listen to Own Profile

**Purpose:** Auto-update UI when admin changes user status or profile

**Implementation:**

```typescript
// hooks/useUserProfile.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { updateUserProfile } from '../store/slices/authSlice';
import { selectUser } from '../store/slices/authSlice';

export const useUserProfileListener = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const updatedData = doc.data();
            dispatch(updateUserProfile({
              username: updatedData.username,
              status: updatedData.status,
            }));
            
            // Show toast if status changed to IN_TRAINING
            if (user.status === 'INACTIVE' && updatedData.status === 'IN_TRAINING') {
              // Show notification: "Your account has been activated!"
            }
          }
        },
        (error) => {
          console.error('Error in user profile listener:', error);
        }
      );
    
    return () => unsubscribe();
  }, [user]);
};
```

### Admin: Listen to User List

**Purpose:** Auto-update user list when users are created or modified

**Implementation:**

```typescript
// hooks/useUsers.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { setUsers, addUser, updateUserInList } from '../store/slices/usersSlice';
import { selectIsAdmin } from '../store/slices/authSlice';

export const useUsersListener = (statusFilter?: 'IN_TRAINING' | 'INACTIVE') => {
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);
  
  useEffect(() => {
    if (!isAdmin) return;
    
    let query = firestore()
      .collection('users')
      .where('role', '==', 'USER')
      .orderBy('username', 'asc');
    
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    
    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const user = {
            uid: change.doc.id,
            ...change.doc.data(),
          };
          
          if (change.type === 'added') {
            dispatch(addUser(user));
          } else if (change.type === 'modified') {
            dispatch(updateUserInList(user));
          }
        });
      },
      (error) => {
        console.error('Error in users listener:', error);
      }
    );
    
    return () => unsubscribe();
  }, [isAdmin, statusFilter]);
};
```

### User: Listen to Notification Preferences

**Purpose:** Auto-update notification settings when changed on another device

**Implementation:**

```typescript
// hooks/useNotificationPreferences.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { setNotificationPreferences } from '../store/slices/settingsSlice';
import { selectUser } from '../store/slices/authSlice';

export const useNotificationPreferencesListener = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = firestore()
      .collection('notification_preferences')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const prefs = doc.data();
            dispatch(setNotificationPreferences({
              enabled: prefs.enabled,
              rule: prefs.rule,
            }));
            
            // Trigger notification rescheduling if preferences changed
            // (handled by notification scheduler service)
          } else {
            // Create default preferences if document doesn't exist
            firestore()
              .collection('notification_preferences')
              .doc(user.uid)
              .set({
                enabled: true,
                rule: '24H',
                updated_at: firestore.FieldValue.serverTimestamp(),
              });
          }
        },
        (error) => {
          console.error('Error in notification preferences listener:', error);
        }
      );
    
    return () => unsubscribe();
  }, [user]);
};
```

### Redux State Caching

**Sessions Slice:**

```typescript
// store/slices/sessionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionsState {
  sessions: Record<string, TrainingSessionDocument>; // Keyed by session ID
  loading: boolean;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: {},
  loading: false,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<TrainingSessionDocument>) => {
      state.sessions[action.payload.id] = action.payload;
    },
    updateSession: (state, action: PayloadAction<TrainingSessionDocument>) => {
      if (state.sessions[action.payload.id]) {
        state.sessions[action.payload.id] = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      delete state.sessions[action.payload];
    },
    setSessions: (state, action: PayloadAction<TrainingSessionDocument[]>) => {
      state.sessions = action.payload.reduce((acc, session) => {
        acc[session.id] = session;
        return acc;
      }, {} as Record<string, TrainingSessionDocument>);
    },
  },
});

export const { addSession, updateSession, removeSession, setSessions } = sessionsSlice.actions;
export default sessionsSlice.reducer;

// Selectors
export const selectAllSessions = (state: RootState) => 
  Object.values(state.sessions.sessions);

export const selectSessionsForDate = (date: Date) => (state: RootState) => {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  return Object.values(state.sessions.sessions).filter(session => {
    const sessionStart = session.start_time.toDate();
    return sessionStart >= dayStart && sessionStart <= dayEnd;
  });
};

export const selectSessionsForMonth = (month: Date) => (state: RootState) => {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  
  return Object.values(state.sessions.sessions).filter(session => {
    const sessionStart = session.start_time.toDate();
    return sessionStart >= monthStart && sessionStart <= monthEnd;
  });
};
```

### Offline Persistence and Reconnection

**Enable Offline Persistence:**

```typescript
// App.tsx initialization
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

**Offline Behavior:**

1. **Read Operations:**
   - Firestore SDK serves data from local cache
   - UI displays cached data with "Offline" indicator
   - No network errors thrown for reads

2. **Write Operations:**
   - Writes are queued locally
   - UI shows "Pending sync" indicator
   - When network reconnects, queued writes are sent to Firestore
   - Listeners fire with updates after successful sync

3. **Conflict Resolution:**
   - Firestore uses **last-write-wins** strategy by default
   - No manual conflict resolution required
   - Use optimistic UI updates for better UX

**Optimistic UI Updates:**

```typescript
// Example: Admin creates session with optimistic update
const handleCreateSession = async (params) => {
  const tempId = `temp-${Date.now()}`;
  const tempSession = {
    id: tempId,
    ...params,
    status: 'SCHEDULED',
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  // Immediately add to Redux (optimistic)
  dispatch(addSession(tempSession));
  
  try {
    // Perform actual Firestore write
    const sessionId = await createTrainingSession(params);
    
    // Replace temp session with real one
    dispatch(removeSession(tempId));
    // Real session will be added by listener
  } catch (error) {
    // Rollback optimistic update on error
    dispatch(removeSession(tempId));
    alert('Failed to create session. Please try again.');
  }
};
```

**Network Status Monitoring:**

```typescript
// hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    
    return () => unsubscribe();
  }, []);
  
  return isOnline;
};
```

**Display Offline Indicator:**

```typescript
// components/OfflineIndicator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <View style={{ backgroundColor: '#FFA500', padding: 8 }}>
      <Text style={{ color: 'white', textAlign: 'center' }}>
        You are offline. Changes will sync when connection is restored.
      </Text>
    </View>
  );
}
```

### Listener Cleanup

**Important:** Always unsubscribe from listeners when components unmount to prevent memory leaks.

**Pattern:**

```typescript
useEffect(() => {
  const unsubscribe = firestore()
    .collection('...')
    .onSnapshot(...);
  
  return () => unsubscribe(); // Cleanup on unmount
}, [dependencies]);
```

### Performance Optimization: Listener Scoping

**Problem:** Listening to large collections can cause excessive data transfer and re-renders.

**Solution:** Scope listeners to only necessary data.

**Example: Calendar View**

```typescript
// Bad: Listen to ALL sessions (100+ documents)
firestore().collection('training_sessions').onSnapshot(...)

// Good: Listen only to current month (10-20 documents)
firestore()
  .collection('training_sessions')
  .where('user_id', '==', userId)
  .where('start_time', '>=', startOfMonth)
  .where('start_time', '<=', endOfMonth)
  .onSnapshot(...)
```

**Example: Dashboard**

```typescript
// For dashboard, only listen to next session (1 document)
firestore()
  .collection('training_sessions')
  .where('user_id', '==', userId)
  .where('start_time', '>', now)
  .where('status', '==', 'SCHEDULED')
  .orderBy('start_time', 'asc')
  .limit(1)
  .onSnapshot(...)
```

---

## Notification Scheduling Design (Client-Side Only)

### Overview

Since Cloud Functions and Cloud Scheduler are unavailable on the Firebase Spark plan, all notification scheduling must be handled client-side using native OS notification APIs. This section provides a complete implementation guide.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React Native App                          │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Notification Scheduler Service                   │    │
│  │                                                     │    │
│  │  1. Listen to training_sessions (Firestore)        │    │
│  │  2. Listen to notification_preferences             │    │
│  │  3. Calculate reminder times (24H/1H/BOTH)         │    │
│  │  4. Schedule local notifications                   │    │
│  │  5. Handle notification taps                       │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Native Notification APIs                    │    │
│  │                                                     │    │
│  │  iOS: UNUserNotificationCenter                     │    │
│  │  Android: WorkManager / AlarmManager               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Operating System                           │
│                                                             │
│  - Schedules notifications in system queue                 │
│  - Fires notifications at exact scheduled time             │
│  - Delivers to user even when app is closed                │
└─────────────────────────────────────────────────────────────┘
```

### Libraries Required

```json
{
  "dependencies": {
    "@react-native-firebase/messaging": "^18.7.0",
    "@notifee/react-native": "^7.8.0"
  }
}
```

**Why Notifee:**
- Supports both iOS and Android local notifications
- Provides trigger-based scheduling (specific date/time)
- Handles notification permissions
- Superior to `react-native-push-notification` (better maintained, TypeScript support)

### Notification Scheduler Service Implementation

**Core Service:**

```typescript
// services/notificationScheduler.service.ts
import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';
import firestore from '@react-native-firebase/firestore';
import { AppState, Platform } from 'react-native';

interface ScheduledNotification {
  sessionId: string;
  notificationId: string;
  triggerTime: Date;
  type: '24H' | '1H';
}

class NotificationSchedulerService {
  private scheduledNotifications: Map<string, ScheduledNotification[]> = new Map();
  private sessionListenerUnsubscribe: (() => void) | null = null;
  private preferencesListenerUnsubscribe: (() => void) | null = null;
  
  /**
   * Initialize the notification scheduler
   * Call this on app startup after user authentication
   */
  async initialize(userId: string): Promise<void> {
    console.log('[NotificationScheduler] Initializing for user:', userId);
    
    // Request notification permissions
    await this.requestPermissions();
    
    // Create notification channel (Android only)
    await this.createNotificationChannel();
    
    // Cancel all existing scheduled notifications
    await notifee.cancelAllNotifications();
    this.scheduledNotifications.clear();
    
    // Start listening to sessions and preferences
    this.startListeners(userId);
    
    // Handle app state changes (foreground/background)
    this.setupAppStateListener(userId);
  }
  
  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus === 0) { // Denied
      console.warn('[NotificationScheduler] User denied notification permissions');
    } else {
      console.log('[NotificationScheduler] Notification permissions granted');
    }
  }
  
  /**
   * Create notification channel for Android
   */
  private async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'training_reminders',
        name: 'Training Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }
  }
  
  /**
   * Start Firestore listeners for sessions and preferences
   */
  private startListeners(userId: string): void {
    // Listen to training sessions
    this.sessionListenerUnsubscribe = firestore()
      .collection('training_sessions')
      .where('user_id', '==', userId)
      .where('status', '==', 'SCHEDULED')
      .where('start_time', '>', new Date()) // Only future sessions
      .onSnapshot(
        async (snapshot) => {
          console.log('[NotificationScheduler] Sessions updated:', snapshot.size);
          
          // Fetch current preferences
          const prefs = await this.getNotificationPreferences(userId);
          
          if (!prefs.enabled) {
            console.log('[NotificationScheduler] Notifications disabled');
            return;
          }
          
          // Reschedule all notifications
          await this.rescheduleAllNotifications(snapshot.docs, prefs.rule);
        },
        (error) => {
          console.error('[NotificationScheduler] Session listener error:', error);
        }
      );
    
    // Listen to notification preferences
    this.preferencesListenerUnsubscribe = firestore()
      .collection('notification_preferences')
      .doc(userId)
      .onSnapshot(
        async (doc) => {
          if (!doc.exists) return;
          
          const prefs = doc.data();
          console.log('[NotificationScheduler] Preferences updated:', prefs);
          
          if (!prefs.enabled) {
            // Cancel all notifications if disabled
            await notifee.cancelAllNotifications();
            this.scheduledNotifications.clear();
            console.log('[NotificationScheduler] All notifications cancelled (disabled)');
          } else {
            // Re-fetch sessions and reschedule
            const sessionsSnapshot = await firestore()
              .collection('training_sessions')
              .where('user_id', '==', userId)
              .where('status', '==', 'SCHEDULED')
              .where('start_time', '>', new Date())
              .get();
            
            await this.rescheduleAllNotifications(sessionsSnapshot.docs, prefs.rule);
          }
        },
        (error) => {
          console.error('[NotificationScheduler] Preferences listener error:', error);
        }
      );
  }
  
  /**
   * Get user's notification preferences
   */
  private async getNotificationPreferences(userId: string): Promise<{ enabled: boolean; rule: '24H' | '1H' | 'BOTH' }> {
    const doc = await firestore()
      .collection('notification_preferences')
      .doc(userId)
      .get();
    
    if (!doc.exists) {
      return { enabled: true, rule: '24H' }; // Defaults
    }
    
    return doc.data() as { enabled: boolean; rule: '24H' | '1H' | 'BOTH' };
  }
  
  /**
   * Reschedule all notifications based on current sessions and preferences
   */
  private async rescheduleAllNotifications(
    sessionDocs: firestore.QueryDocumentSnapshot[],
    rule: '24H' | '1H' | 'BOTH'
  ): Promise<void> {
    console.log('[NotificationScheduler] Rescheduling all notifications');
    
    // Cancel all existing notifications
    await notifee.cancelAllNotifications();
    this.scheduledNotifications.clear();
    
    // Schedule notifications for each session
    for (const doc of sessionDocs) {
      const session = doc.data();
      const sessionId = doc.id;
      const startTime = session.start_time.toDate();
      
      await this.scheduleNotificationsForSession(sessionId, startTime, rule);
    }
    
    console.log('[NotificationScheduler] Scheduled', this.scheduledNotifications.size, 'sessions');
  }
  
  /**
   * Schedule notifications for a specific session
   */
  private async scheduleNotificationsForSession(
    sessionId: string,
    startTime: Date,
    rule: '24H' | '1H' | 'BOTH'
  ): Promise<void> {
    const now = new Date();
    const notifications: ScheduledNotification[] = [];
    
    // Calculate trigger times
    const triggers: { time: Date; type: '24H' | '1H' }[] = [];
    
    if (rule === '24H' || rule === 'BOTH') {
      const trigger24H = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      if (trigger24H > now) {
        triggers.push({ time: trigger24H, type: '24H' });
      }
    }
    
    if (rule === '1H' || rule === 'BOTH') {
      const trigger1H = new Date(startTime.getTime() - 60 * 60 * 1000);
      if (trigger1H > now) {
        triggers.push({ time: trigger1H, type: '1H' });
      }
    }
    
    // Schedule each notification
    for (const trigger of triggers) {
      const notificationId = await this.scheduleNotification(
        sessionId,
        startTime,
        trigger.time,
        trigger.type
      );
      
      if (notificationId) {
        notifications.push({
          sessionId,
          notificationId,
          triggerTime: trigger.time,
          type: trigger.type,
        });
      }
    }
    
    // Store scheduled notifications
    if (notifications.length > 0) {
      this.scheduledNotifications.set(sessionId, notifications);
    }
  }
  
  /**
   * Schedule a single notification
   */
  private async scheduleNotification(
    sessionId: string,
    startTime: Date,
    triggerTime: Date,
    type: '24H' | '1H'
  ): Promise<string | null> {
    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
      };
      
      const timeUntilSession = type === '24H' ? '24 hours' : '1 hour';
      
      const notificationId = await notifee.createTriggerNotification(
        {
          id: `${sessionId}-${type}`,
          title: '🧘 Upcoming Pilates Session',
          body: `Your training session starts in ${timeUntilSession}`,
          android: {
            channelId: 'training_reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            smallIcon: 'ic_notification',
            color: '#4F46E5',
          },
          ios: {
            sound: 'default',
            categoryId: 'training_reminder',
          },
          data: {
            sessionId,
            type,
            startTime: startTime.toISOString(),
          },
        },
        trigger
      );
      
      console.log(
        `[NotificationScheduler] Scheduled ${type} notification for session ${sessionId} at`,
        triggerTime.toISOString()
      );
      
      return notificationId;
    } catch (error) {
      console.error('[NotificationScheduler] Error scheduling notification:', error);
      return null;
    }
  }
  
  /**
   * Handle notification tap (user opens app from notification)
   */
  setupNotificationHandler(navigation: any): () => void {
    // Handle notification tap when app is in foreground
    const foregroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === 1 /* PRESS */) {
        const sessionId = detail.notification?.data?.sessionId;
        if (sessionId) {
          console.log('[NotificationScheduler] User tapped notification:', sessionId);
          navigation.navigate('SessionDetail', { sessionId });
        }
      }
    });
    
    // Handle notification tap when app was in background/quit
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === 1 /* PRESS */) {
        const sessionId = detail.notification?.data?.sessionId;
        if (sessionId) {
          console.log('[NotificationScheduler] Background notification tap:', sessionId);
          // Navigation handled by deep linking or initial route
        }
      }
    });
    
    return foregroundUnsubscribe;
  }
  
  /**
   * Handle app state changes (foreground/background)
   */
  private setupAppStateListener(userId: string): void {
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[NotificationScheduler] App became active, refreshing schedules');
        
        // Re-fetch sessions and reschedule (in case schedules were lost)
        const prefs = await this.getNotificationPreferences(userId);
        
        if (prefs.enabled) {
          const sessionsSnapshot = await firestore()
            .collection('training_sessions')
            .where('user_id', '==', userId)
            .where('status', '==', 'SCHEDULED')
            .where('start_time', '>', new Date())
            .get();
          
          await this.rescheduleAllNotifications(sessionsSnapshot.docs, prefs.rule);
        }
      }
    });
  }
  
  /**
   * Cleanup listeners (call on logout)
   */
  cleanup(): void {
    console.log('[NotificationScheduler] Cleaning up');
    
    if (this.sessionListenerUnsubscribe) {
      this.sessionListenerUnsubscribe();
    }
    
    if (this.preferencesListenerUnsubscribe) {
      this.preferencesListenerUnsubscribe();
    }
    
    notifee.cancelAllNotifications();
    this.scheduledNotifications.clear();
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationSchedulerService();
```

### Integration with App Lifecycle

**App.tsx:**

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from './store/slices/authSlice';
import { notificationScheduler } from './services/notificationScheduler.service';
import { useNavigation } from '@react-navigation/native';

export default function App() {
  const user = useSelector(selectUser);
  const navigation = useNavigation();
  
  useEffect(() => {
    if (user) {
      // Initialize notification scheduler when user logs in
      notificationScheduler.initialize(user.uid);
      
      // Setup notification tap handler
      const unsubscribe = notificationScheduler.setupNotificationHandler(navigation);
      
      return () => {
        unsubscribe();
      };
    } else {
      // Cleanup when user logs out
      notificationScheduler.cleanup();
    }
  }, [user]);
  
  return <AppNavigator />;
}
```

### Reminder Calculation Pseudocode

```typescript
/**
 * Pseudocode for calculating reminder trigger times
 * 
 * Given:
 * - session.start_time (UTC timestamp)
 * - user.preference.rule ('24H' | '1H' | 'BOTH')
 * 
 * Calculate:
 * - trigger_times[] (array of UTC timestamps)
 */

function calculateReminderTimes(
  startTime: Date,
  rule: '24H' | '1H' | 'BOTH'
): Date[] {
  const now = new Date();
  const triggers: Date[] = [];
  
  // 24-hour reminder
  if (rule === '24H' || rule === 'BOTH') {
    const trigger24H = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    
    // Only schedule if trigger time is in the future
    if (trigger24H > now) {
      triggers.push(trigger24H);
    }
  }
  
  // 1-hour reminder
  if (rule === '1H' || rule === 'BOTH') {
    const trigger1H = new Date(startTime.getTime() - 60 * 60 * 1000);
    
    // Only schedule if trigger time is in the future
    if (trigger1H > now) {
      triggers.push(trigger1H);
    }
  }
  
  return triggers;
}

/**
 * Example:
 * 
 * Session start_time: 2026-02-01T09:00:00Z (UTC)
 * User rule: 'BOTH'
 * Current time: 2026-01-30T10:00:00Z (UTC)
 * 
 * Calculations:
 * - 24H trigger: 2026-01-31T09:00:00Z (24 hours before)
 * - 1H trigger: 2026-02-01T08:00:00Z (1 hour before)
 * 
 * Result: [2026-01-31T09:00:00Z, 2026-02-01T08:00:00Z]
 * 
 * Both triggers are in the future, so both notifications are scheduled.
 */
```

### Timezone Handling

**Key Principle:** All calculations are done in UTC, then native OS handles local delivery.

```typescript
// Session stored in Firestore (UTC)
const sessionStartUTC = new Date('2026-02-01T09:00:00Z');

// Calculate 24H trigger (still UTC)
const trigger24HUTC = new Date(sessionStartUTC.getTime() - 24 * 60 * 60 * 1000);
// Result: 2026-01-31T09:00:00Z

// Schedule notification with UTC timestamp
await notifee.createTriggerNotification(
  { /* notification config */ },
  {
    type: TriggerType.TIMESTAMP,
    timestamp: trigger24HUTC.getTime(), // Unix timestamp (milliseconds)
  }
);

// OS will fire notification at the correct LOCAL time for the user
// If user is in PST (UTC-8):
//   - Session start: 2026-02-01 01:00 AM PST
//   - 24H reminder fires: 2026-01-31 01:00 AM PST
```

### Handling Edge Cases

**Case 1: Session created with less than 24H notice**

```typescript
// Current time: 2026-02-01T10:00:00Z
// Session start: 2026-02-01T15:00:00Z (only 5 hours away)
// User rule: 'BOTH'

const triggers = calculateReminderTimes(sessionStart, 'BOTH');
// 24H trigger: 2026-01-31T15:00:00Z (in the past) → SKIP
// 1H trigger: 2026-02-01T14:00:00Z (in the future) → SCHEDULE

// Result: Only 1H notification is scheduled
```

**Case 2: Session rescheduled to earlier time**

```typescript
// Original: 2026-02-05T10:00:00Z
// Rescheduled: 2026-02-02T10:00:00Z
// Current time: 2026-02-01T08:00:00Z

// When Firestore listener fires with updated session:
// 1. Cancel all old notifications for this session
await notifee.cancelNotification(`${sessionId}-24H`);
await notifee.cancelNotification(`${sessionId}-1H`);

// 2. Recalculate and reschedule
const newTriggers = calculateReminderTimes(newStartTime, rule);
// 24H: 2026-02-01T10:00:00Z (2 hours from now) → SCHEDULE
// 1H: 2026-02-02T09:00:00Z (tomorrow) → SCHEDULE
```

**Case 3: User changes preference from 24H to 1H**

```typescript
// Firestore preference listener fires
// Cancel all existing notifications
await notifee.cancelAllNotifications();

// Re-fetch all scheduled sessions
const sessions = await firestore()
  .collection('training_sessions')
  .where('user_id', '==', userId)
  .where('status', '==', 'SCHEDULED')
  .where('start_time', '>', now)
  .get();

// Reschedule with new rule
sessions.forEach(session => {
  scheduleNotificationsForSession(session.id, session.start_time, '1H');
});
```

**Case 4: Session cancelled**

```typescript
// Admin updates session.status to 'CANCELLED'
// Firestore listener fires

// Since query filters status === 'SCHEDULED', cancelled session
// is automatically removed from snapshot

// Listener logic:
snapshot.docChanges().forEach(change => {
  if (change.type === 'removed') {
    // Cancel notifications for this session
    const sessionId = change.doc.id;
    await notifee.cancelNotification(`${sessionId}-24H`);
    await notifee.cancelNotification(`${sessionId}-1H`);
  }
});
```

### iOS-Specific Configuration

**Info.plist permissions:**

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

**Notification categories (AppDelegate.swift):**

```swift
import UserNotifications

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  UNUserNotificationCenter.current().delegate = self
  
  let category = UNNotificationCategory(
    identifier: "training_reminder",
    actions: [],
    intentIdentifiers: [],
    options: []
  )
  
  UNUserNotificationCenter.current().setNotificationCategories([category])
  
  return true
}
```

### Android-Specific Configuration

**AndroidManifest.xml permissions:**

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
```

**Notification icon:**

Place icon in `android/app/src/main/res/drawable/ic_notification.png` (white, transparent background, 24x24dp).

**AlarmManager exact timing (Android 12+):**

```typescript
// Notifee automatically requests SCHEDULE_EXACT_ALARM permission on Android 12+
// No additional configuration needed
```

### Limitations and Workarounds

**Limitation 1: Notifications lost on app uninstall**

- **Impact:** User uninstalls app → all scheduled notifications are cleared by OS
- **Workaround:** None (inherent to client-side scheduling)
- **Mitigation:** Display warning in app: "Notifications require the app to remain installed"

**Limitation 2: Battery optimization may delay/skip notifications**

- **Impact:** Aggressive battery savers on Android may prevent notifications
- **Workaround:** Prompt user to disable battery optimization for the app
- **Implementation:**
  ```typescript
  import { NativeModules } from 'react-native';
  
  // Check if battery optimization is enabled
  const isBatteryOptimizationEnabled = await NativeModules.PowerManager.isIgnoringBatteryOptimizations();
  
  if (!isBatteryOptimizationEnabled) {
    // Show alert prompting user to disable
    Alert.alert(
      'Enable Reliable Notifications',
      'Please disable battery optimization to ensure you receive all reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => NativeModules.PowerManager.requestIgnoreBatteryOptimizations() },
      ]
    );
  }
  ```

**Limitation 3: iOS notification limit (64 scheduled notifications max)**

- **Impact:** Users with many upcoming sessions may hit iOS limit
- **Workaround:** Prioritize nearest sessions (schedule only next 32 sessions)
- **Implementation:**
  ```typescript
  // Sort sessions by start_time ascending
  const sortedSessions = sessions.sort((a, b) => 
    a.start_time.toMillis() - b.start_time.toMillis()
  );
  
  // Schedule only first 32 sessions (64 notifications total: 32 * 2 if BOTH)
  const sessionsToSchedule = sortedSessions.slice(0, 32);
  ```

**Limitation 4: App must run periodically to refresh schedules**

- **Impact:** If app never opened, new sessions created by admin won't trigger notifications
- **Workaround:** Implement background refresh (limited on iOS, requires permission)
- **Implementation (iOS Background Fetch):**
  ```typescript
  // App.tsx
  import BackgroundFetch from 'react-native-background-fetch';
  
  useEffect(() => {
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // minutes
        stopOnTerminate: false,
        startOnBoot: true,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Running task:', taskId);
        
        // Refresh notification schedules
        if (user) {
          const prefs = await getNotificationPreferences(user.uid);
          const sessions = await fetchUserSessions(user.uid);
          await rescheduleAllNotifications(sessions, prefs.rule);
        }
        
        BackgroundFetch.finish(taskId);
      },
      (taskId) => {
        console.log('[BackgroundFetch] Timeout:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );
  }, [user]);
  ```

### Testing Notification Scheduling

**Test Scenarios:**

1. **Immediate notification (for testing):**
   ```typescript
   // Schedule notification 10 seconds in the future
   const testTrigger = new Date(Date.now() + 10 * 1000);
   await notifee.createTriggerNotification({ /* config */ }, {
     type: TriggerType.TIMESTAMP,
     timestamp: testTrigger.getTime(),
   });
   ```

2. **Verify scheduled notifications:**
   ```typescript
   const scheduled = await notifee.getTriggerNotifications();
   console.log('Scheduled notifications:', scheduled);
   ```

3. **Cancel specific notification:**
   ```typescript
   await notifee.cancelNotification('notification-id');
   ```

4. **Debug logging:**
   ```typescript
   // Enable verbose logging in notificationScheduler.service.ts
   console.log('[NotificationScheduler] ...');
   ```

### Notification Delivery Monitoring

**Track notification delivery (analytics):**

```typescript
// When notification is scheduled
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('notification_scheduled', {
  session_id: sessionId,
  trigger_type: '24H',
  trigger_time: triggerTime.toISOString(),
});

// When notification is tapped
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === 1) {
    analytics().logEvent('notification_tapped', {
      session_id: detail.notification?.data?.sessionId,
    });
  }
});
```

### Migration Path to Server-Side Notifications

**When upgrading to Blaze plan:**

1. Deploy Cloud Function triggered by Firestore writes:
   ```typescript
   // functions/src/index.ts
   export const onSessionCreated = functions.firestore
     .document('training_sessions/{sessionId}')
     .onCreate(async (snap, context) => {
       const session = snap.data();
       const userId = session.user_id;
       
       // Fetch user's device tokens
       const tokens = await getDeviceTokens(userId);
       
       // Fetch notification preferences
       const prefs = await getNotificationPreferences(userId);
       
       // Schedule FCM messages via Cloud Scheduler
       await scheduleNotificationsViaCloudScheduler(session, tokens, prefs);
     });
   ```

2. Replace client-side scheduler with FCM data message handler
3. Keep Notifee for displaying received FCM messages as local notifications

---

## UI-to-Backend Behavior Mapping

This section documents the implementation details for each key screen, including UI responsibilities, Firestore interactions, validation rules, and state management.

### Login Screen

**File:** `screens/LoginScreen.tsx`

**UI Components:**
- App logo and title
- "Sign in with Google" button
- Loading spinner during authentication
- Error message display

**Firestore Interactions:**
1. On "Sign in with Google" tap:
   - Call `signInWithGoogle()` from auth service
   - Firebase Auth handles OAuth flow
   - Query `users/{uid}` to fetch user document
   - If document doesn't exist, create with default `role=USER`, `status=INACTIVE`

**Validation Rules:**
- No client-side validation (Google handles authentication)
- Check if user document has valid `role` field

**State Management:**
```typescript
interface LoginScreenState {
  loading: boolean;
  error: string | null;
}

const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleGoogleSignIn = async () => {
  setLoading(true);
  setError(null);
  
  try {
    await dispatch(loginWithGoogle()).unwrap();
    // Navigation handled by AppNavigator based on role
  } catch (err) {
    setError('Failed to sign in. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Navigation Flow:**
- On successful login:
  - If `role === 'ADMIN'` → Navigate to `AdminCalendar`
  - If `role === 'USER'` → Navigate to `UserDashboard`

**Error States:**
- Google sign-in cancelled by user → Clear loading, show no error
- Network error → Show "No internet connection" error
- Firebase error → Show "Authentication failed" error

**Empty States:**
- Not applicable (login is the entry point)

### User Dashboard Screen

**File:** `screens/user/UserDashboard.tsx`

**UI Components:**
- Header with username and logout button
- Two stat cards:
  - Completed classes count
  - Next scheduled class (date/time)
- "View Calendar" button
- "Settings" button
- Bottom navigation bar

**Firestore Interactions:**

1. **On mount:**
   - Listen to own user document: `users/{uid}` (real-time)
   - Listen to next session: `training_sessions.where('user_id', '==', uid).where('start_time', '>', now).where('status', '==', 'SCHEDULED').limit(1)` (real-time)
   - Fetch completed classes count: `training_sessions.where('user_id', '==', uid).where('end_time', '<', now).where('status', '!=', 'CANCELLED').count()`

2. **On logout tap:**
   - Call `signOut()` from auth service
   - Clear Redux store
   - Navigate to Login

**Validation Rules:**
- None (read-only screen)

**State Management:**
```typescript
// Redux selectors
const user = useSelector(selectUser);
const nextSession = useSelector(selectNextSession);
const completedCount = useSelector(selectCompletedClassesCount);
const loading = useSelector(selectDashboardLoading);

// Local state for pull-to-refresh
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  await dispatch(refreshDashboard()).unwrap();
  setRefreshing(false);
};
```

**Navigation Flow:**
- Tap "View Calendar" → Navigate to `UserCalendar`
- Tap "Settings" → Navigate to `UserSettings`
- Tap logout → Navigate to `Login`

**Error States:**
- Firestore query error → Show error banner at top: "Failed to load sessions"
- No network → Show "Offline" indicator, display cached data

**Empty States:**
- No next session → Show card with "No upcoming sessions scheduled"
- Completed count = 0 → Show "0 Classes Completed" (not an error)

**Loading States:**
- Initial mount → Show skeleton loaders for stat cards
- Pull-to-refresh → Show refresh spinner

### User Calendar Screen

**File:** `screens/user/UserCalendar.tsx`

**UI Components:**
- Header with back button and month/year title
- Month selector (prev/next arrows)
- Calendar grid (7 columns, 5-6 rows)
- Session markers on dates (colored dots)
- "Upcoming Sessions" list below calendar

**Firestore Interactions:**

1. **On mount / month change:**
   - Listen to sessions for selected month: `training_sessions.where('user_id', '==', uid).where('start_time', '>=', startOfMonth).where('start_time', '<=', endOfMonth).orderBy('start_time', 'asc')` (real-time)

2. **On date tap:**
   - Show modal with session details (read from Redux store, no additional query)

**Validation Rules:**
- None (read-only)

**State Management:**
```typescript
const [selectedMonth, setSelectedMonth] = useState(new Date());
const [selectedDate, setSelectedDate] = useState<Date | null>(null);

// Listen to sessions for current month
useUserSessions(startOfMonth, endOfMonth);

// Select sessions from Redux
const sessionsForMonth = useSelector(selectSessionsForMonth(selectedMonth));
const sessionsForSelectedDate = useSelector(selectSessionsForDate(selectedDate));

const handleDatePress = (date: Date) => {
  setSelectedDate(date);
  // Open modal
};

const handleMonthChange = (direction: 'prev' | 'next') => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
  setSelectedMonth(newMonth);
};
```

**Navigation Flow:**
- Tap back button → Navigate back to `UserDashboard`
- Tap date → Open `SessionDetailModal` (overlay, not navigation)

**Error States:**
- Firestore query error → Show error banner: "Failed to load calendar"

**Empty States:**
- No sessions in month → Show calendar with no markers, message below: "No sessions this month"
- No sessions on selected date → Modal shows "No sessions on this date"

**Loading States:**
- Initial month load → Show calendar skeleton
- Month change → Show subtle loading indicator while fetching new month

### Session Detail Modal

**File:** `components/SessionDetailModal.tsx`

**UI Components:**
- Drag handle at top
- Session date and time (formatted for local timezone)
- Session status badge (Scheduled/Completed/Cancelled)
- Training notes (read-only for users)
- "Close" button

**Firestore Interactions:**
- None (reads from Redux store, data already loaded by calendar listener)

**Validation Rules:**
- None (read-only)

**State Management:**
```typescript
interface SessionDetailModalProps {
  sessionId: string;
  visible: boolean;
  onClose: () => void;
}

const session = useSelector(selectSessionById(sessionId));

// Format date/time for local timezone
const formattedDate = format(session.start_time.toDate(), 'MMMM d, yyyy');
const formattedTime = format(session.start_time.toDate(), 'h:mm a');
```

**Navigation Flow:**
- Tap "Close" or swipe down → Close modal, return to calendar

**Error States:**
- Session not found → Show "Session not available"

**Empty States:**
- Notes empty → Show "No notes for this session"

**Loading States:**
- Not applicable (data already in Redux)

### User Settings Screen

**File:** `screens/user/UserSettings.tsx`

**UI Components:**
- Header with back button
- Profile section (username, email, display only)
- Notification toggle switch
- Notification rule selector (24H / 1H / BOTH radio buttons)
- Logout button (red)

**Firestore Interactions:**

1. **On mount:**
   - Fetch notification preferences: `notification_preferences/{uid}` (one-time read or listener)

2. **On notification toggle change:**
   - Update Firestore: `notification_preferences/{uid}.set({ enabled: newValue, updated_at: serverTimestamp() }, { merge: true })`

3. **On rule selection change:**
   - Update Firestore: `notification_preferences/{uid}.set({ rule: newRule, updated_at: serverTimestamp() }, { merge: true })`

**Validation Rules:**
- `enabled` must be boolean
- `rule` must be one of: '24H', '1H', 'BOTH'

**State Management:**
```typescript
const user = useSelector(selectUser);
const preferences = useSelector(selectNotificationPreferences);

const [enabled, setEnabled] = useState(preferences.enabled);
const [rule, setRule] = useState(preferences.rule);
const [saving, setSaving] = useState(false);

const handleToggleNotifications = async (newValue: boolean) => {
  setEnabled(newValue);
  setSaving(true);
  
  try {
    await dispatch(updateNotificationPreferences({
      enabled: newValue,
      rule,
    })).unwrap();
  } catch (error) {
    // Rollback on error
    setEnabled(!newValue);
    alert('Failed to update settings');
  } finally {
    setSaving(false);
  }
};

const handleRuleChange = async (newRule: '24H' | '1H' | 'BOTH') => {
  setRule(newRule);
  setSaving(true);
  
  try {
    await dispatch(updateNotificationPreferences({
      enabled,
      rule: newRule,
    })).unwrap();
  } catch (error) {
    setRule(rule); // Rollback
    alert('Failed to update settings');
  } finally {
    setSaving(false);
  }
};
```

**Navigation Flow:**
- Tap back button → Navigate back to `UserDashboard`
- Tap logout → Sign out, navigate to `Login`

**Error States:**
- Firestore update error → Show alert: "Failed to update settings", rollback UI

**Empty States:**
- Preferences document doesn't exist → Create with defaults (`enabled: true`, `rule: '24H'`)

**Loading States:**
- Initial load → Show skeleton for preference toggles
- Saving changes → Disable controls, show saving indicator

### Admin Calendar Screen

**File:** `screens/admin/AdminCalendar.tsx`

**UI Components:**
- Header with title and user list button
- Month selector
- Calendar grid with all users' sessions marked
- Filter tabs (All / Today / This Week)
- "Today's Sessions" list below calendar
- "+" FAB (Floating Action Button) to create session
- Bottom navigation bar

**Firestore Interactions:**

1. **On mount / month change:**
   - Listen to all sessions for selected month: `training_sessions.where('start_time', '>=', startOfMonth).where('start_time', '<=', endOfMonth).orderBy('start_time', 'asc')` (real-time)

2. **On session tap:**
   - Open edit modal (data from Redux)

3. **On "+" FAB tap:**
   - Open create modal

**Validation Rules:**
- None (read-only for calendar view)

**State Management:**
```typescript
const [selectedMonth, setSelectedMonth] = useState(new Date());
const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

// Listen to all sessions for month
useAdminSessions(startOfMonth, endOfMonth);

const allSessions = useSelector(selectSessionsForMonth(selectedMonth));

const filteredSessions = useMemo(() => {
  if (filter === 'today') {
    return allSessions.filter(/* today filter */);
  } else if (filter === 'week') {
    return allSessions.filter(/* this week filter */);
  }
  return allSessions;
}, [allSessions, filter]);
```

**Navigation Flow:**
- Tap user list button → Navigate to `AdminUserList`
- Tap "+" FAB → Open `CreateSessionModal`
- Tap session → Open `EditSessionModal`
- Tap bottom nav icon → Navigate to corresponding screen

**Error States:**
- Firestore query error → Show error banner

**Empty States:**
- No sessions in month → Show empty calendar, message: "No sessions scheduled this month"

**Loading States:**
- Month change → Show loading indicator

### Admin Create Session Screen

**File:** `screens/admin/CreateSessionModal.tsx`

**UI Components:**
- Header with "Cancel" and "Create" buttons
- User selector dropdown (searchable)
- User stats card (after user selected):
  - Completed classes count
  - Last 5 training notes
- Date picker
- Start time picker
- End time picker
- Training notes textarea
- "Create Session" button

**Firestore Interactions:**

1. **On mount:**
   - Fetch all users: `users.where('role', '==', 'USER').orderBy('username', 'asc')`

2. **On user selection:**
   - Fetch user stats:
     - Completed count: `training_sessions.where('user_id', '==', selectedUserId).where('end_time', '<', now).where('status', '!=', 'CANCELLED').count()`
     - Last 5 notes: `training_sessions.where('user_id', '==', selectedUserId).where('status', 'in', ['COMPLETED', 'NO_SHOW']).orderBy('end_time', 'desc').limit(5)`

3. **On "Create" tap:**
   - Write to Firestore: `training_sessions.add({ user_id, created_by_id, start_time, end_time, status: 'SCHEDULED', notes, created_at, updated_at })`

**Validation Rules:**
- `user_id` required (must select a user)
- `start_time` required
- `end_time` required
- `end_time` must be after `start_time`
- `notes` optional (can be empty string)

**State Management:**
```typescript
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
const [startTime, setStartTime] = useState(new Date());
const [endTime, setEndTime] = useState(new Date());
const [notes, setNotes] = useState('');
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

const users = useSelector(selectAllUsers);
const currentUser = useSelector(selectUser);

const handleCreate = async () => {
  // Validation
  const validationErrors: Record<string, string> = {};
  
  if (!selectedUserId) {
    validationErrors.user = 'Please select a user';
  }
  if (endTime <= startTime) {
    validationErrors.time = 'End time must be after start time';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  setLoading(true);
  try {
    await dispatch(createSession({
      userId: selectedUserId!,
      startTime,
      endTime,
      notes,
    })).unwrap();
    
    onClose(); // Close modal
  } catch (error) {
    alert('Failed to create session');
  } finally {
    setLoading(false);
  }
};
```

**Navigation Flow:**
- Tap "Cancel" → Close modal, return to calendar
- Tap "Create" → Validate, create session, close modal

**Error States:**
- Validation errors → Show inline error messages (red text below fields)
- Firestore write error → Show alert: "Failed to create session"

**Empty States:**
- No users in system → Show "No users available. Please add users first."
- User has no training notes → Show "No training history"

**Loading States:**
- Loading users → Show dropdown skeleton
- Loading user stats → Show stats skeleton
- Creating session → Disable button, show "Creating..."

### Admin Edit Session Screen

**File:** `screens/admin/EditSessionModal.tsx`

**UI Components:**
- Header with "Cancel" and "Save" buttons
- User info card (read-only):
  - Username
  - Completed classes
  - Last training note
- Status selector (Scheduled / Completed / Cancelled / NO_SHOW)
- Start time picker
- End time picker
- Training notes textarea
- "Save Changes" button
- "Delete Session" button (red, at bottom)

**Firestore Interactions:**

1. **On mount:**
   - Data already in Redux (from calendar listener)
   - Fetch user info: `users/{session.user_id}` (if not cached)

2. **On "Save" tap:**
   - Update Firestore: `training_sessions/{sessionId}.update({ start_time, end_time, status, notes, updated_at })`

3. **On "Delete" tap:**
   - Show confirmation dialog
   - If confirmed: `training_sessions/{sessionId}.delete()`

**Validation Rules:**
- `end_time` must be after `start_time`
- `status` must be valid enum value
- Cannot change `user_id` or `created_by_id`

**State Management:**
```typescript
const session = useSelector(selectSessionById(sessionId));
const sessionUser = useSelector(selectUserById(session.user_id));

const [status, setStatus] = useState(session.status);
const [startTime, setStartTime] = useState(session.start_time.toDate());
const [endTime, setEndTime] = useState(session.end_time.toDate());
const [notes, setNotes] = useState(session.notes);
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  if (endTime <= startTime) {
    alert('End time must be after start time');
    return;
  }
  
  setLoading(true);
  try {
    await dispatch(updateSession({
      sessionId,
      startTime,
      endTime,
      status,
      notes,
    })).unwrap();
    
    onClose();
  } catch (error) {
    alert('Failed to update session');
  } finally {
    setLoading(false);
  }
};

const handleDelete = () => {
  Alert.alert(
    'Delete Session',
    'Are you sure you want to delete this session?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await dispatch(deleteSession(sessionId)).unwrap();
          onClose();
        } catch (error) {
          alert('Failed to delete session');
        }
      }},
    ]
  );
};
```

**Navigation Flow:**
- Tap "Cancel" → Close modal, return to calendar
- Tap "Save" → Update session, close modal
- Tap "Delete" → Show confirmation, delete, close modal

**Error States:**
- Validation error → Show inline error message
- Firestore update/delete error → Show alert

**Empty States:**
- Notes empty → Show placeholder "Add training notes..."

**Loading States:**
- Saving → Disable button, show "Saving..."
- Deleting → Show loading overlay

### Admin User List Screen

**File:** `screens/admin/AdminUserList.tsx`

**UI Components:**
- Header with "Users" title and "+" button
- Search bar
- Filter tabs (All / Active / Inactive)
- User list (FlatList with pagination):
  - Username
  - Next session date
  - Completed classes count
  - Status badge
- Pull-to-refresh

**Firestore Interactions:**

1. **On mount:**
   - Listen to users: `users.where('role', '==', 'USER').orderBy('username', 'asc')` (real-time)
   - For each user, fetch stats (lazy-loaded or cached)

2. **On search input:**
   - Filter local Redux data (no new query)

3. **On filter tab change:**
   - Update Firestore listener: `users.where('role', '==', 'USER').where('status', '==', filter).orderBy('username', 'asc')`

4. **On pagination (load more):**
   - Fetch next page: `users.where(...).startAfter(lastDoc).limit(20)`

**Validation Rules:**
- None (read-only)

**State Management:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<'all' | 'IN_TRAINING' | 'INACTIVE'>('all');
const [refreshing, setRefreshing] = useState(false);

useUsersListener(statusFilter === 'all' ? undefined : statusFilter);

const users = useSelector(selectAllUsers);

const filteredUsers = useMemo(() => {
  if (!searchQuery) return users;
  
  return users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.gmail.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [users, searchQuery]);
```

**Navigation Flow:**
- Tap "+" button → Navigate to `AddUserScreen`
- Tap user row → Navigate to `EditUserScreen`
- Tap back → Return to `AdminCalendar`

**Error States:**
- Firestore query error → Show error banner

**Empty States:**
- No users in system → Show "No users yet. Tap + to add your first user."
- Search returns no results → Show "No users found matching '{searchQuery}'"

**Loading States:**
- Initial load → Show skeleton list
- Pull-to-refresh → Show refresh spinner
- Pagination → Show loading indicator at list bottom

### Admin Add/Edit User Screen

**File:** `screens/admin/AddEditUserScreen.tsx`

**UI Components:**
- Header with "Cancel" and "Save" buttons
- Profile picture placeholder
- Username input field
- Email input field
- Status selector (IN_TRAINING / INACTIVE)
- Stats card (edit mode only):
  - Completed classes (read-only)
  - Next session (read-only)
- "Save" button
- "Delete User" button (edit mode only, red)

**Firestore Interactions:**

1. **Add mode - On "Save" tap:**
   - Check if email already exists: `users.where('gmail', '==', email).limit(1)`
   - If exists → Show error
   - If not → Create: `users.doc(newUid).set({ username, gmail, role: 'USER', status, created_at, updated_at })`

2. **Edit mode - On mount:**
   - Data from Redux

3. **Edit mode - On "Save" tap:**
   - Update: `users/{userId}.update({ username, gmail, status, updated_at })`

4. **Edit mode - On "Delete" tap:**
   - Show confirmation
   - If confirmed: `users/{userId}.delete()` (also delete all sessions: `training_sessions.where('user_id', '==', userId).get()` then batch delete)

**Validation Rules:**
- `username` required, min 2 characters
- `gmail` required, valid email format, unique
- `status` required

**State Management:**
```typescript
const [username, setUsername] = useState(user?.username || '');
const [email, setEmail] = useState(user?.gmail || '');
const [status, setStatus] = useState<'IN_TRAINING' | 'INACTIVE'>(user?.status || 'INACTIVE');
const [errors, setErrors] = useState<Record<string, string>>({});
const [loading, setLoading] = useState(false);

const isEditMode = !!user;

const handleSave = async () => {
  const validationErrors: Record<string, string> = {};
  
  if (!username || username.length < 2) {
    validationErrors.username = 'Username must be at least 2 characters';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    validationErrors.email = 'Please enter a valid email';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  setLoading(true);
  try {
    if (isEditMode) {
      await dispatch(updateUser({
        uid: user.uid,
        username,
        gmail: email,
        status,
      })).unwrap();
    } else {
      // Check email uniqueness
      const existing = await firestore()
        .collection('users')
        .where('gmail', '==', email)
        .limit(1)
        .get();
      
      if (!existing.empty) {
        setErrors({ email: 'This email is already registered' });
        return;
      }
      
      await dispatch(createUser({
        username,
        gmail: email,
        status,
      })).unwrap();
    }
    
    navigation.goBack();
  } catch (error) {
    alert('Failed to save user');
  } finally {
    setLoading(false);
  }
};
```

**Navigation Flow:**
- Tap "Cancel" → Navigate back to `AdminUserList`
- Tap "Save" → Validate, save, navigate back
- Tap "Delete" → Confirm, delete, navigate back

**Error States:**
- Validation errors → Show inline error messages
- Email already exists → Show error under email field
- Firestore error → Show alert

**Empty States:**
- Not applicable

**Loading States:**
- Saving → Disable button, show "Saving..."
- Checking email uniqueness → Show spinner next to email field

---

## Business Rules and Edge Cases

### Session Status Lifecycle

**State Machine:**

```
SCHEDULED
   ├─→ COMPLETED (session occurred, user attended)
   ├─→ CANCELLED (session cancelled by admin)
   └─→ NO_SHOW (session occurred, user didn't attend)

COMPLETED (terminal state, no transitions)
CANCELLED (terminal state, no transitions)
NO_SHOW (terminal state, no transitions)
```

**Implementation:**

```typescript
// services/session.service.ts
export const transitionSessionStatus = async (
  sessionId: string,
  newStatus: 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
): Promise<void> => {
  const sessionDoc = await firestore()
    .collection('training_sessions')
    .doc(sessionId)
    .get();
  
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }
  
  const currentStatus = sessionDoc.data()!.status;
  
  // Validate transition
  if (currentStatus !== 'SCHEDULED') {
    throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`);
  }
  
  // Additional validation for COMPLETED and NO_SHOW
  const now = new Date();
  const endTime = sessionDoc.data()!.end_time.toDate();
  
  if ((newStatus === 'COMPLETED' || newStatus === 'NO_SHOW') && endTime > now) {
    throw new Error('Cannot mark future session as completed or no-show');
  }
  
  // Perform update
  await firestore()
    .collection('training_sessions')
    .doc(sessionId)
    .update({
      status: newStatus,
      updated_at: firestore.FieldValue.serverTimestamp(),
    });
};
```

**Business Rules:**
1. Only `SCHEDULED` sessions can transition to other states
2. `COMPLETED` and `NO_SHOW` can only be set after session `end_time` has passed
3. `CANCELLED` can be set at any time before session starts
4. Terminal states (`COMPLETED`, `CANCELLED`, `NO_SHOW`) cannot be changed

### Completed Class Counting Logic

**Rule:** Count all sessions where:
- `user_id` matches current user
- `end_time` < current time (session has passed)
- `status` != `CANCELLED`

**Edge Cases:**

1. **Session marked COMPLETED before end_time:**
   - Should NOT count (validation prevents this)

2. **Session marked NO_SHOW:**
   - SHOULD count (user was expected but didn't attend)

3. **Session cancelled after completion:**
   - Should NOT be possible (terminal state validation prevents this)

4. **Multiple sessions on same day:**
   - Each counts separately

**Implementation:**

```typescript
// services/session.service.ts
export const countCompletedSessions = async (userId: string): Promise<number> => {
  const now = new Date();
  
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('end_time', '<', firestore.Timestamp.fromDate(now))
    .where('status', 'in', ['COMPLETED', 'NO_SHOW']) // Include NO_SHOW
    .get();
  
  return snapshot.size;
};
```

**Alternative (exclude NO_SHOW):**

If business requirement is to only count COMPLETED sessions:

```typescript
.where('status', '==', 'COMPLETED')
```

**Clarify with stakeholders:** Should NO_SHOW count toward completed classes?

### Next Session Calculation

**Rule:** Find the earliest future session where:
- `user_id` matches current user
- `start_time` > current time
- `status` == `SCHEDULED`

**Edge Cases:**

1. **No upcoming sessions:**
   - Return `null`, UI shows "No upcoming sessions"

2. **Session starting within minutes:**
   - Still returned as "next session"
   - UI should handle formatting (e.g., "Starts in 5 minutes")

3. **Multiple sessions on same day:**
   - Return earliest by `start_time`

4. **Session in far future (months away):**
   - Still valid, display normally

**Implementation:**

```typescript
// services/session.service.ts
export const fetchNextSession = async (
  userId: string
): Promise<TrainingSessionDocument | null> => {
  const now = new Date();
  
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('start_time', '>', firestore.Timestamp.fromDate(now))
    .where('status', '==', 'SCHEDULED')
    .orderBy('start_time', 'asc')
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as TrainingSessionDocument;
};
```

### Role-Based Write Permissions

**Rules:**

| Action | USER | ADMIN |
|--------|------|-------|
| Create training session | ❌ | ✅ |
| Edit own training session | ❌ | ❌ |
| Edit any training session | ❌ | ✅ |
| Delete training session | ❌ | ✅ |
| Update own profile (username) | ✅ | ✅ |
| Update own status | ❌ | ❌ |
| Update other user profiles | ❌ | ✅ |
| Create user | ❌ | ✅ |
| Delete user | ❌ | ✅ |
| Update own notification preferences | ✅ | ✅ |
| Register device token | ✅ | ✅ |

**Implementation:** Enforced via Firestore Security Rules (see Authentication section)

### Timezone Conversion (UTC Storage + Local Display)

**Storage Rule:** All timestamps stored in Firestore are UTC.

**Display Rule:** All timestamps displayed to user are in local timezone.

**Implementation:**

```typescript
// utils/dateTime.utils.ts
import { format, formatDistanceToNow } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

/**
 * Convert local Date to UTC for Firestore storage
 */
export const toUTC = (localDate: Date): Date => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zonedTimeToUtc(localDate, timezone);
};

/**
 * Convert UTC Date from Firestore to local timezone for display
 */
export const toLocalTime = (utcDate: Date): Date => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return utcToZonedTime(utcDate, timezone);
};

/**
 * Format date for display (local timezone)
 */
export const formatSessionDate = (utcDate: Date): string => {
  const localDate = toLocalTime(utcDate);
  return format(localDate, 'MMMM d, yyyy h:mm a');
};

/**
 * Relative time display
 */
export const formatRelativeTime = (utcDate: Date): string => {
  const localDate = toLocalTime(utcDate);
  return formatDistanceToNow(localDate, { addSuffix: true });
};
```

**Usage in UI:**

```typescript
// Display session time
<Text>{formatSessionDate(session.start_time.toDate())}</Text>

// Display relative time
<Text>Starts {formatRelativeTime(session.start_time.toDate())}</Text>
```

**Edge Cases:**

1. **Daylight Saving Time (DST) transitions:**
   - Firestore stores UTC (unaffected by DST)
   - Client converts to local time (handles DST automatically via `date-fns-tz`)
   - Example: Session at 10:00 AM PST (winter) remains 10:00 AM PDT (summer)

2. **User travels to different timezone:**
   - Session displays in new local timezone
   - Example: Session at 2:00 PM EST → user travels to PST → displays as 11:00 AM PST

3. **Admin and user in different timezones:**
   - Admin creates session at "10:00 AM" in their timezone (EST)
   - Stored as UTC: 15:00 UTC
   - User in PST sees: 7:00 AM PST
   - **Risk:** Confusion if admin doesn't consider user's timezone
   - **Mitigation:** Display user's timezone in admin create session UI

### Handling Cancelled/No-Show Sessions

**Cancelled Sessions:**

1. **Impact on completed count:** Do NOT count
2. **Impact on calendar:** Still visible with "CANCELLED" badge
3. **Impact on notifications:**
   - Firestore listener removes from query results (status != SCHEDULED)
   - Client cancels scheduled notifications

**No-Show Sessions:**

1. **Impact on completed count:** Count (or don't count, clarify with stakeholders)
2. **Impact on calendar:** Visible with "NO_SHOW" badge
3. **Impact on user dashboard:** May show in history

**Implementation:**

```typescript
// When admin marks session as CANCELLED
const handleCancelSession = async (sessionId: string) => {
  await firestore()
    .collection('training_sessions')
    .doc(sessionId)
    .update({
      status: 'CANCELLED',
      updated_at: firestore.FieldValue.serverTimestamp(),
    });
  
  // Firestore listener on user's device will detect change
  // Notification scheduler will cancel local notifications automatically
};
```

**Notification Cleanup:**

```typescript
// In notification scheduler listener
snapshot.docChanges().forEach((change) => {
  if (change.type === 'modified') {
    const session = change.doc.data();
    
    if (session.status !== 'SCHEDULED') {
      // Cancel notifications for this session
      notifee.cancelNotification(`${change.doc.id}-24H`);
      notifee.cancelNotification(`${change.doc.id}-1H`);
    }
  }
});
```

### Handling Spark Plan Quotas

**Daily Limits:**
- 50,000 read operations
- 20,000 write operations
- 1 GB storage
- 10 GB/month network egress

**Quota Monitoring:**

```typescript
// services/analytics.service.ts
import analytics from '@react-native-firebase/analytics';

export const trackFirestoreOperation = (operation: 'read' | 'write', count: number = 1) => {
  analytics().logEvent('firestore_operation', {
    operation,
    count,
    timestamp: new Date().toISOString(),
  });
};

// Usage after queries
const sessions = await firestore()
  .collection('training_sessions')
  .where('user_id', '==', userId)
  .get();

trackFirestoreOperation('read', sessions.size);
```

**Optimization Strategies:**

1. **Use listeners instead of repeated queries:**
   - Bad: Polling every 30 seconds (lots of reads)
   - Good: Real-time listener (1 initial read + incremental updates)

2. **Cache in Redux:**
   - Don't re-query data already in store

3. **Limit query ranges:**
   - Fetch only current month for calendar (not entire year)

4. **Batch reads:**
   - Use `getAll()` or `in` queries instead of multiple individual reads

5. **Monitor usage:**
   - Set up Firebase Console alerts at 80% quota usage
   - Display warning in app if approaching limits

**Quota Exceeded Handling:**

```typescript
// Error handling for quota exceeded
try {
  await firestore().collection('...').get();
} catch (error) {
  if (error.code === 'resource-exhausted') {
    // Show user-friendly message
    Alert.alert(
      'Service Temporarily Unavailable',
      'Our servers are experiencing high traffic. Please try again later.',
      [{ text: 'OK' }]
    );
    
    // Log to analytics for monitoring
    analytics().logEvent('quota_exceeded', {
      collection: '...',
      operation: 'read',
    });
  }
}
```

### Session Overlap Detection

**Business Rule:** Prevent double-booking (optional, clarify with stakeholders)

**Implementation:**

```typescript
// services/session.service.ts
export const checkSessionOverlap = async (
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeSessionId?: string
): Promise<boolean> => {
  // Query for sessions that overlap with the new time range
  const snapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .where('status', '==', 'SCHEDULED')
    .where('start_time', '<', firestore.Timestamp.fromDate(endTime))
    .get();
  
  // Filter in-memory for end_time > new start_time
  const overlapping = snapshot.docs.filter(doc => {
    if (excludeSessionId && doc.id === excludeSessionId) {
      return false; // Exclude current session when editing
    }
    
    const existingStart = doc.data().start_time.toDate();
    const existingEnd = doc.data().end_time.toDate();
    
    // Check if ranges overlap
    return existingEnd > startTime && existingStart < endTime;
  });
  
  return overlapping.length > 0;
};

// Usage in create session
const hasOverlap = await checkSessionOverlap(userId, startTime, endTime);
if (hasOverlap) {
  Alert.alert('Scheduling Conflict', 'User already has a session during this time.');
  return;
}
```

**Note:** Firestore doesn't support range queries on two fields, so we query on `start_time` and filter `end_time` in-memory.

---

## Security Considerations

### Firestore Security Rules Testing

**Use Firebase Emulator Suite for local testing:**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

**Test Rules:**

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

test('Users can read their own profile', async () => {
  const alice = testEnv.authenticatedContext('alice-uid');
  const aliceDoc = alice.firestore().collection('users').doc('alice-uid');
  
  await assertSucceeds(aliceDoc.get());
});

test('Users cannot read other profiles', async () => {
  const alice = testEnv.authenticatedContext('alice-uid');
  const bobDoc = alice.firestore().collection('users').doc('bob-uid');
  
  await assertFails(bobDoc.get());
});

test('Admins can read all profiles', async () => {
  const admin = testEnv.authenticatedContext('admin-uid', { role: 'ADMIN' });
  const aliceDoc = admin.firestore().collection('users').doc('alice-uid');
  
  await assertSucceeds(aliceDoc.get());
});

test('Cannot create session with end_time before start_time', async () => {
  const admin = testEnv.authenticatedContext('admin-uid', { role: 'ADMIN' });
  const sessionDoc = admin.firestore().collection('training_sessions').doc();
  
  await assertFails(sessionDoc.set({
    user_id: 'user-uid',
    created_by_id: 'admin-uid',
    start_time: new Date('2026-02-01T10:00:00Z'),
    end_time: new Date('2026-02-01T09:00:00Z'), // Before start_time!
    status: 'SCHEDULED',
    notes: 'Test',
    created_at: new Date(),
    updated_at: new Date(),
  }));
});

test('Users cannot create sessions', async () => {
  const user = testEnv.authenticatedContext('user-uid', { role: 'USER' });
  const sessionDoc = user.firestore().collection('training_sessions').doc();
  
  await assertFails(sessionDoc.set({
    user_id: 'user-uid',
    created_by_id: 'user-uid',
    start_time: new Date('2026-02-01T10:00:00Z'),
    end_time: new Date('2026-02-01T11:00:00Z'),
    status: 'SCHEDULED',
    notes: 'Test',
    created_at: new Date(),
    updated_at: new Date(),
  }));
});

afterAll(async () => {
  await testEnv.cleanup();
});
```

**Run Tests:**

```bash
npm test -- firestore.rules.test.ts
```

### Input Validation on Client

**Validation Library:** Use `zod` for schema validation

```typescript
// utils/validation.schemas.ts
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

// Usage in component
const handleCreateSession = async (data) => {
  try {
    const validated = CreateSessionSchema.parse(data);
    await dispatch(createSession(validated)).unwrap();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Display validation errors
      setErrors(error.flatten().fieldErrors);
    }
  }
};
```

**Form Validation with React Hook Form:**

```typescript
// screens/admin/CreateSessionModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(CreateSessionSchema),
  defaultValues: {
    userId: '',
    startTime: new Date(),
    endTime: new Date(),
    notes: '',
  },
});

const onSubmit = async (data) => {
  await dispatch(createSession(data)).unwrap();
  onClose();
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    {/* Form fields */}
    {errors.endTime && <Text style={{ color: 'red' }}>{errors.endTime.message}</Text>}
  </form>
);
```

### Minimal PII Storage

**Data Minimization Principle:**

Only store essential information:

✅ **Stored:**
- Username (for display)
- Gmail (for authentication and communication)
- Training notes (business requirement)
- Session dates/times (business requirement)

❌ **NOT Stored:**
- Phone numbers (unless required for future SMS feature)
- Physical addresses
- Payment information (no payment feature)
- Health data (notes are trainer observations, not medical records)
- Social security numbers
- Date of birth

**GDPR/Privacy Compliance:**

1. **Right to Access:** Users can view their own data in app
2. **Right to Deletion:** Admin can delete user account (with cascade delete of sessions)
3. **Data Portability:** Export user data to JSON (implement if required)

**Implement User Data Export:**

```typescript
// services/user.service.ts
export const exportUserData = async (userId: string): Promise<object> => {
  const userDoc = await firestore().collection('users').doc(userId).get();
  const sessionsSnapshot = await firestore()
    .collection('training_sessions')
    .where('user_id', '==', userId)
    .get();
  
  const sessions = sessionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  return {
    user: userDoc.data(),
    sessions,
    exportDate: new Date().toISOString(),
  };
};

// Usage in UI
const handleExportData = async () => {
  const data = await exportUserData(user.uid);
  const json = JSON.stringify(data, null, 2);
  
  // Share or download file
  await Share.share({
    message: json,
    title: 'My Training Data',
  });
};
```

### Audit Metadata Fields

**Required fields for accountability:**

```typescript
// All Firestore documents should include:
{
  created_at: Timestamp,    // When document was created
  updated_at: Timestamp,    // Last modification time
  created_by_id?: string,   // UID of user who created (for sessions)
  updated_by_id?: string,   // UID of user who last updated (optional)
}
```

**Implementation pattern:**

```typescript
// Create
await firestore().collection('training_sessions').add({
  user_id: userId,
  created_by_id: currentUser.uid, // Log who created
  // ... other fields
  created_at: firestore.FieldValue.serverTimestamp(),
  updated_at: firestore.FieldValue.serverTimestamp(),
});

// Update
await firestore().collection('training_sessions').doc(sessionId).update({
  // ... updated fields
  updated_at: firestore.FieldValue.serverTimestamp(),
  updated_by_id: currentUser.uid, // Optional: log who updated
});
```

**Audit Log Query:**

```typescript
// services/audit.service.ts
export const getSessionHistory = async (sessionId: string) => {
  const sessionDoc = await firestore()
    .collection('training_sessions')
    .doc(sessionId)
    .get();
  
  const data = sessionDoc.data();
  
  return {
    created: {
      at: data.created_at.toDate(),
      by: data.created_by_id,
    },
    lastUpdated: {
      at: data.updated_at.toDate(),
      by: data.updated_by_id || data.created_by_id,
    },
  };
};
```

### Rate Limiting and Abuse Prevention

**Client-Side Rate Limiting:**

```typescript
// utils/rateLimiter.ts
class RateLimiter {
  private lastCall: Record<string, number> = {};
  
  canCall(key: string, minIntervalMs: number): boolean {
    const now = Date.now();
    const lastTime = this.lastCall[key] || 0;
    
    if (now - lastTime < minIntervalMs) {
      return false;
    }
    
    this.lastCall[key] = now;
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Usage
const handleCreateSession = async () => {
  if (!rateLimiter.canCall('createSession', 1000)) {
    alert('Please wait before creating another session');
    return;
  }
  
  await dispatch(createSession(...));
};
```

**Server-Side (Firestore Security Rules):**

Firebase provides built-in DDoS protection. For additional protection, use custom claims or rate limit rules (requires Cloud Functions on Blaze plan).

**Spark Plan:** Rely on daily quotas as natural rate limits.

---

## Performance and Scalability Notes

### Index Usage Optimization

**Required Composite Indexes:**

Create in Firebase Console or `firestore.indexes.json`:

```json
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
  "fieldOverrides": []
}
```

**Deploy Indexes:**

```bash
firebase deploy --only firestore:indexes
```

### Listener Query Scoping

**Best Practices:**

1. **Scope by user ID:**
   ```typescript
   // Good: Only user's sessions
   .where('user_id', '==', uid)
   
   // Bad: All sessions (admin should filter by date at least)
   .collection('training_sessions')
   ```

2. **Scope by date range:**
   ```typescript
   // Good: Only current month
   .where('start_time', '>=', startOfMonth)
   .where('start_time', '<=', endOfMonth)
   
   // Bad: All sessions ever
   .collection('training_sessions')
   ```

3. **Use limits when appropriate:**
   ```typescript
   // Good: Only next session
   .limit(1)
   
   // Good: Pagination
   .limit(20)
   ```

### Read/Write Quota Constraints

**Spark Plan Limits:**
- 50,000 reads/day
- 20,000 writes/day

**Typical Usage Per User Per Day:**
- Login: 1 read (user document)
- Dashboard load: 2 reads (next session + count query)
- Calendar month view: ~30 reads (sessions for month)
- Real-time listener updates: ~5 reads (incremental updates throughout day)
- Settings changes: 1 write (notification preferences)
- Device token registration: 1 write (on app start)

**Total per user:** ~40 reads, 2 writes per day

**Capacity:** ~1,250 users with moderate usage

**Optimization for higher usage:**
- Cache dashboard data longer (reduce refreshes)
- Limit listener ranges (current month only, not full year)
- Batch admin operations (create multiple sessions in one UI flow)

### Pagination Strategy

**Cursor-Based Pagination:**

```typescript
// services/user.service.ts
export const fetchUsersPaginated = async (
  pageSize: number = 20,
  lastDoc?: firestore.QueryDocumentSnapshot
): Promise<{
  users: User[];
  lastDoc: firestore.QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  let query = firestore()
    .collection('users')
    .where('role', '==', 'USER')
    .orderBy('username', 'asc')
    .limit(pageSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  const snapshot = await query.get();
  
  return {
    users: snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[],
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
};
```

**Usage in UI:**

```typescript
// screens/admin/AdminUserList.tsx
const [users, setUsers] = useState<User[]>([]);
const [lastDoc, setLastDoc] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (loading || !hasMore) return;
  
  setLoading(true);
  const result = await fetchUsersPaginated(20, lastDoc);
  
  setUsers(prev => [...prev, ...result.users]);
  setLastDoc(result.lastDoc);
  setHasMore(result.hasMore);
  setLoading(false);
};

// Initial load
useEffect(() => {
  loadMore();
}, []);

// FlatList
<FlatList
  data={users}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loading ? <ActivityIndicator /> : null}
/>
```

### Caching with Redux

**Selector Memoization:**

```typescript
// store/slices/sessionsSlice.ts
import { createSelector } from '@reduxjs/toolkit';

// Memoized selector - only recomputes if sessions or month changes
export const selectSessionsForMonth = createSelector(
  [
    (state: RootState) => state.sessions.sessions,
    (state: RootState, month: Date) => month,
  ],
  (sessions, month) => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    return Object.values(sessions).filter(session => {
      const sessionStart = session.start_time.toDate();
      return sessionStart >= monthStart && sessionStart <= monthEnd;
    });
  }
);
```

**Cache Invalidation:**

```typescript
// Refresh dashboard data
export const refreshDashboard = createAsyncThunk(
  'dashboard/refresh',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const userId = state.auth.user?.uid;
    
    if (!userId) throw new Error('Not authenticated');
    
    const [nextSession, completedCount] = await Promise.all([
      fetchNextSession(userId),
      countCompletedSessions(userId),
    ]);
    
    return { nextSession, completedCount };
  }
);
```

### Expected Scaling Limits

**Spark Plan Capacity:**

| Metric | Spark Limit | Usage Per Active User | Max Active Users |
|--------|-------------|----------------------|------------------|
| Reads/day | 50,000 | ~40 | ~1,250 |
| Writes/day | 20,000 | ~2 | ~10,000 |
| Storage | 1 GB | ~100 KB | ~10,000 |
| Network egress | 10 GB/month | ~50 KB/day | ~6,600 |

**Bottleneck:** Read operations (users viewing calendars, dashboards)

**When to upgrade to Blaze:**
- Approaching 1,000 active users
- Need server-side notifications (Cloud Functions)
- Need advanced analytics or scheduled tasks

**Cost Estimate (Blaze Plan):**
- First 50K reads: Free
- Additional reads: $0.06 per 100K
- At 2,000 users (~80K reads/day): ~$1.80/month
- At 5,000 users (~200K reads/day): ~$9/month

---

## Testing Strategy for Implementation

### Unit Tests

**Test Framework:** Jest + React Native Testing Library

**Coverage Targets:**
- Utility functions: 100%
- Redux reducers: 100%
- Business logic: 90%+
- UI components: 70%+

**Key Test Suites:**

1. **Date/Time Calculations:**

```typescript
// utils/__tests__/dateTime.utils.test.ts
import { toUTC, toLocalTime, calculateReminderTimes } from '../dateTime.utils';

describe('calculateReminderTimes', () => {
  it('should calculate 24H reminder correctly', () => {
    const startTime = new Date('2026-02-01T10:00:00Z');
    const triggers = calculateReminderTimes(startTime, '24H');
    
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toEqual(new Date('2026-01-31T10:00:00Z'));
  });
  
  it('should calculate BOTH reminders correctly', () => {
    const startTime = new Date('2026-02-01T10:00:00Z');
    const triggers = calculateReminderTimes(startTime, 'BOTH');
    
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toEqual(new Date('2026-01-31T10:00:00Z')); // 24H
    expect(triggers[1]).toEqual(new Date('2026-02-01T09:00:00Z')); // 1H
  });
  
  it('should skip past trigger times', () => {
    const now = new Date('2026-02-01T09:30:00Z');
    const startTime = new Date('2026-02-01T10:00:00Z');
    
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const triggers = calculateReminderTimes(startTime, 'BOTH');
    
    expect(triggers).toHaveLength(1); // Only 1H trigger (24H is in past)
    expect(triggers[0]).toEqual(new Date('2026-02-01T09:00:00Z'));
  });
});

describe('timezone conversions', () => {
  it('should convert local to UTC correctly', () => {
    const localDate = new Date('2026-02-01T10:00:00-08:00'); // PST
    const utcDate = toUTC(localDate);
    
    expect(utcDate.toISOString()).toBe('2026-02-01T18:00:00.000Z');
  });
});
```

2. **Status Transitions:**

```typescript
// services/__tests__/session.service.test.ts
import { transitionSessionStatus } from '../session.service';

describe('transitionSessionStatus', () => {
  it('should allow SCHEDULED → COMPLETED', async () => {
    await expect(
      transitionSessionStatus('session-id', 'COMPLETED')
    ).resolves.not.toThrow();
  });
  
  it('should reject COMPLETED → CANCELLED', async () => {
    // Mock session with status COMPLETED
    await expect(
      transitionSessionStatus('completed-session-id', 'CANCELLED')
    ).rejects.toThrow('Cannot change status from COMPLETED');
  });
});
```

3. **Redux Reducers:**

```typescript
// store/slices/__tests__/sessionsSlice.test.ts
import sessionsReducer, { addSession, updateSession, removeSession } from '../sessionsSlice';

describe('sessionsSlice', () => {
  it('should add session', () => {
    const initialState = { sessions: {}, loading: false, error: null };
    const session = { id: '1', user_id: 'user-1', /* ... */ };
    
    const newState = sessionsReducer(initialState, addSession(session));
    
    expect(newState.sessions['1']).toEqual(session);
  });
  
  it('should update session', () => {
    const initialState = {
      sessions: { '1': { id: '1', status: 'SCHEDULED', /* ... */ } },
      loading: false,
      error: null,
    };
    
    const updated = { id: '1', status: 'COMPLETED', /* ... */ };
    const newState = sessionsReducer(initialState, updateSession(updated));
    
    expect(newState.sessions['1'].status).toBe('COMPLETED');
  });
});
```

4. **Validation Schemas:**

```typescript
// utils/__tests__/validation.schemas.test.ts
import { CreateSessionSchema } from '../validation.schemas';

describe('CreateSessionSchema', () => {
  it('should validate correct data', () => {
    const data = {
      userId: 'user-123',
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T11:00:00Z'),
      notes: 'Test notes',
    };
    
    expect(() => CreateSessionSchema.parse(data)).not.toThrow();
  });
  
  it('should reject end time before start time', () => {
    const data = {
      userId: 'user-123',
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T09:00:00Z'), // Before start!
      notes: '',
    };
    
    expect(() => CreateSessionSchema.parse(data)).toThrow('End time must be after start time');
  });
});
```

### Integration Tests

**Test Framework:** Jest + Firebase Emulator Suite

**Setup:**

```bash
# firebase.json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 }
  }
}
```

**Key Test Suites:**

1. **Firebase Auth Flows:**

```typescript
// integration/__tests__/auth.integration.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Authentication Integration', () => {
  it('should create user document on first login', async () => {
    const testEnv = await initializeTestEnvironment({ /* config */ });
    const user = testEnv.authenticatedContext('new-user-uid');
    
    // Simulate first login
    await user.firestore().collection('users').doc('new-user-uid').set({
      username: 'New User',
      gmail: 'newuser@example.com',
      role: 'USER',
      status: 'INACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    const doc = await user.firestore().collection('users').doc('new-user-uid').get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.role).toBe('USER');
  });
});
```

2. **Firestore Security Rules:**

```typescript
// integration/__tests__/firestore.rules.test.ts
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  test('User can read own sessions', async () => {
    const user = testEnv.authenticatedContext('user-uid');
    
    await assertSucceeds(
      user.firestore()
        .collection('training_sessions')
        .where('user_id', '==', 'user-uid')
        .get()
    );
  });
  
  test('User cannot read other users sessions', async () => {
    const user = testEnv.authenticatedContext('user-uid');
    
    await assertFails(
      user.firestore()
        .collection('training_sessions')
        .where('user_id', '==', 'other-user-uid')
        .get()
    );
  });
});
```

3. **Real-Time Listener Updates:**

```typescript
// integration/__tests__/listeners.integration.test.ts
describe('Real-Time Listeners', () => {
  it('should update Redux when session is created', async (done) => {
    const store = mockStore();
    
    // Start listener
    const unsubscribe = firestore()
      .collection('training_sessions')
      .where('user_id', '==', 'test-user')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            store.dispatch(addSession({ id: change.doc.id, ...change.doc.data() }));
          }
        });
      });
    
    // Create session
    await firestore().collection('training_sessions').add({
      user_id: 'test-user',
      // ... other fields
    });
    
    // Wait for listener to fire
    setTimeout(() => {
      const state = store.getState();
      expect(Object.keys(state.sessions.sessions)).toHaveLength(1);
      unsubscribe();
      done();
    }, 1000);
  });
});
```

### E2E Tests

**Test Framework:** Detox (React Native)

**Setup:**

```bash
npm install --save-dev detox detox-cli
```

**Configuration:**

```json
// .detoxrc.json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/myAPP.app",
      "build": "xcodebuild -workspace ios/myAPP.xcworkspace -scheme myAPP -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": { "type": "iPhone 14" }
    },
    "emulator": {
      "type": "android.emulator",
      "device": { "avdName": "Pixel_6_API_33" }
    }
  }
}
```

**Key Test Flows:**

1. **User Flow: Login → Dashboard → Calendar:**

```typescript
// e2e/user.flow.test.ts
describe('User Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should login, view dashboard, and navigate to calendar', async () => {
    // Login
    await element(by.id('google-sign-in-button')).tap();
    await waitFor(element(by.id('user-dashboard'))).toBeVisible().withTimeout(5000);
    
    // Check dashboard
    await expect(element(by.id('completed-count'))).toBeVisible();
    await expect(element(by.id('next-session-card'))).toBeVisible();
    
    // Navigate to calendar
    await element(by.id('view-calendar-button')).tap();
    await expect(element(by.id('user-calendar'))).toBeVisible();
    
    // Tap a date
    await element(by.id('calendar-date-15')).tap();
    await expect(element(by.id('session-detail-modal'))).toBeVisible();
  });
});
```

2. **Admin Flow: Create Session:**

```typescript
// e2e/admin.flow.test.ts
describe('Admin Flow', () => {
  it('should create a training session', async () => {
    // Login as admin
    await element(by.id('google-sign-in-button')).tap();
    await waitFor(element(by.id('admin-calendar'))).toBeVisible();
    
    // Open create modal
    await element(by.id('create-session-fab')).tap();
    await expect(element(by.id('create-session-modal'))).toBeVisible();
    
    // Fill form
    await element(by.id('user-selector')).tap();
    await element(by.text('Jane Doe')).tap();
    
    await element(by.id('start-time-picker')).tap();
    // ... set time
    
    await element(by.id('notes-input')).typeText('Focus on core strength');
    
    // Submit
    await element(by.id('create-button')).tap();
    
    // Verify modal closed
    await waitFor(element(by.id('create-session-modal'))).not.toBeVisible();
    
    // Verify session appears on calendar
    await expect(element(by.id('session-marker-feb-15'))).toBeVisible();
  });
});
```

3. **Notification Scheduling Validation:**

```typescript
// e2e/notifications.test.ts
describe('Notification Scheduling', () => {
  it('should schedule notification when session is created', async () => {
    // Create session (as admin)
    // ... create session logic
    
    // Switch to user account
    await device.launchApp({ newInstance: true, permissions: { notifications: 'YES' } });
    
    // Check notification permissions
    const permissions = await device.getPermissions();
    expect(permissions.notifications).toBe('authorized');
    
    // Verify notification was scheduled (check iOS/Android notification center)
    // Note: This requires device-specific APIs
  });
});
```

### Notification Scheduling Tests

**Test reminder calculation logic:**

```typescript
// services/__tests__/notificationScheduler.service.test.ts
import { notificationScheduler } from '../notificationScheduler.service';

describe('Notification Scheduler', () => {
  it('should schedule 24H and 1H reminders for BOTH rule', async () => {
    const session = {
      id: 'session-1',
      start_time: new Date('2026-02-01T10:00:00Z'),
      status: 'SCHEDULED',
    };
    
    const scheduledNotifications = await notificationScheduler.scheduleNotificationsForSession(
      session.id,
      session.start_time,
      'BOTH'
    );
    
    expect(scheduledNotifications).toHaveLength(2);
    expect(scheduledNotifications[0].type).toBe('24H');
    expect(scheduledNotifications[1].type).toBe('1H');
  });
  
  it('should cancel notifications when session is cancelled', async () => {
    // Mock notifee
    const mockCancel = jest.fn();
    jest.mock('@notifee/react-native', () => ({
      cancelNotification: mockCancel,
    }));
    
    await notificationScheduler.cancelSessionNotifications('session-1');
    
    expect(mockCancel).toHaveBeenCalledWith('session-1-24H');
    expect(mockCancel).toHaveBeenCalledWith('session-1-1H');
  });
});
```

---

## Engineering Implementation Plan

### Recommended Build Sequence

**Phase 1: Foundation (Week 1-2)**

1. **Firebase Project Setup**
   - Create Firebase project in console
   - Enable Google Sign-In in Authentication
   - Create Firestore database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   
2. **React Native Project Initialization**
   - Initialize React Native project with TypeScript
   - Install dependencies:
     ```bash
     npx react-native init myAPP --template react-native-template-typescript
     cd myAPP
     npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/messaging
     npm install @notifee/react-native
     npm install @reduxjs/toolkit react-redux
     npm install @react-navigation/native @react-navigation/native-stack
     npm install react-native-calendars
     npm install date-fns date-fns-tz
     npm install zod react-hook-form @hookform/resolvers
     npm install @react-native-google-signin/google-signin
     ```
   
3. **Configure Firebase SDKs**
   - iOS: Add GoogleService-Info.plist to Xcode project
   - Android: Add google-services.json to android/app/
   - iOS: Configure AppDelegate for Firebase
   - Android: Configure build.gradle for Firebase
   
4. **Redux Store Setup**
   - Create store structure
   - Define slices: authSlice, sessionsSlice, usersSlice, settingsSlice
   - Configure Redux DevTools

**Phase 2: Authentication & Role Bootstrap (Week 2-3)**

5. **Implement Google Sign-In**
   - Configure Google Sign-In library
   - Create auth service with signInWithGoogle(), signOut()
   - Implement authSlice with login/logout actions
   
6. **Firestore User Management**
   - Create user service with createUser(), updateUser()
   - Implement first-login logic (create user document)
   - Manual admin creation script or Firebase Console setup
   
7. **Role-Based Navigation**
   - Create AppNavigator with role-based routing
   - Implement LoginScreen UI
   - Test USER vs ADMIN navigation

**Phase 3: Firestore Schema & Security Rules (Week 3-4)**

8. **Define Firestore Collections**
   - Create collections in Firebase Console (or via code)
   - Define composite indexes
   - Test queries with sample data
   
9. **Implement Security Rules**
   - Write firestore.rules file
   - Deploy rules: `firebase deploy --only firestore:rules`
   - Test rules with Firebase Emulator Suite
   
10. **Create Service Layer**
    - session.service.ts (CRUD operations)
    - user.service.ts (CRUD operations)
    - notification.service.ts (preferences, token registration)

**Phase 4: Core Session CRUD (Week 4-5)**

11. **Admin Session Creation**
    - Create AdminCalendar screen
    - Implement CreateSessionModal
    - Connect to Firestore service
    - Test real-time listener updates
    
12. **Admin Session Editing**
    - Implement EditSessionModal
    - Add delete functionality
    - Test status transitions
    
13. **User Session Viewing**
    - Create UserDashboard screen
    - Implement next session query
    - Implement completed count query

**Phase 5: Calendar UI (Week 5-6)**

14. **User Calendar Implementation**
    - Integrate react-native-calendars
    - Implement monthly view
    - Add session markers
    - Create SessionDetailModal
    
15. **Admin Calendar Implementation**
    - Admin calendar with all users' sessions
    - Color-code by user or status
    - Tap to edit functionality
    
16. **Real-Time Sync**
    - Implement Firestore listeners for both roles
    - Test multi-device sync
    - Test offline persistence

**Phase 6: Notification Scheduling Engine (Week 6-7)**

17. **FCM Token Registration**
    - Request notification permissions
    - Register FCM token on app startup
    - Store token in device_tokens collection
    
18. **Local Notification Scheduler**
    - Implement NotificationSchedulerService
    - Add Firestore listeners for sessions
    - Implement reminder calculation logic
    - Test iOS UNUserNotificationCenter
    - Test Android WorkManager
    
19. **Notification Preferences**
    - Create UserSettings screen
    - Implement preference toggles
    - Connect to notification rescheduling

**Phase 7: Admin Management Tools (Week 7-8)**

20. **User List & Management**
    - Create AdminUserList screen
    - Implement pagination
    - Add search and filters
    
21. **Add/Edit User Screen**
    - Create AddEditUserScreen
    - Implement validation
    - Test email uniqueness check
    
22. **User Stats Calculation**
    - Fetch completed classes for each user
    - Fetch next session for each user
    - Optimize with caching

**Phase 8: Testing & Deployment Pipeline (Week 8-9)**

23. **Unit Tests**
    - Write tests for utilities, services, reducers
    - Aim for 80%+ coverage
    
24. **Integration Tests**
    - Set up Firebase Emulator Suite
    - Test Security Rules
    - Test auth flows
    
25. **E2E Tests**
    - Set up Detox
    - Write critical user flows
    - Test on iOS and Android
    
26. **CI/CD Pipeline**
    - Set up GitHub Actions
    - Automate tests on PR
    - Automate builds for App Store/Play Store

**Phase 9: Polish & Launch (Week 9-10)**

27. **UI/UX Polish**
    - Match design from pilates-app-ui.html
    - Add loading states, error handling
    - Implement pull-to-refresh
    
28. **Performance Optimization**
    - Profile with Flipper
    - Optimize re-renders
    - Test on low-end devices
    
29. **App Store Submission**
    - Prepare app metadata
    - Screenshots and descriptions
    - Submit for review

**Timeline Summary:**
- Total: 9-10 weeks
- 2 engineers: 6-7 weeks
- 3 engineers: 4-5 weeks

---

## Open Issues and Future Enhancements

### Known Limitations of Spark Plan Notifications

**Issues:**

1. **Client-side scheduling dependency:**
   - Notifications require app to be installed and run periodically
   - Users who uninstall app lose all scheduled notifications
   - No server-side fallback

2. **Battery optimization interference:**
   - Android aggressive battery savers may kill background tasks
   - Notifications might not fire if device is in deep sleep
   - Requires user to whitelist app (poor UX)

3. **iOS notification limit:**
   - Maximum 64 scheduled notifications at a time
   - Users with many upcoming sessions may not get all reminders
   - Requires prioritization logic

4. **No delivery confirmation:**
   - No way to know if notification was actually delivered
   - No analytics on notification effectiveness
   - Can't retry failed deliveries

**Impact:**
- **Moderate risk** for MVP/early users
- **High risk** for production with >100 users

**Recommendations:**
- Monitor user feedback closely
- Plan for Blaze upgrade within 3-6 months
- Set clear expectations with users about notification reliability

### Potential Blaze Upgrade Path

**When to upgrade:**
- Approaching 1,000 active users
- User complaints about missed notifications
- Need for advanced features (analytics, scheduled tasks)
- Spark quota limits exceeded

**Blaze Plan Benefits:**

1. **Cloud Functions for server-side notifications:**
   ```typescript
   // functions/src/index.ts
   export const onSessionCreated = functions.firestore
     .document('training_sessions/{sessionId}')
     .onCreate(async (snap, context) => {
       const session = snap.data();
       
       // Schedule FCM messages via Cloud Scheduler
       await scheduleNotification(session, '24H');
       await scheduleNotification(session, '1H');
     });
   
   export const sendScheduledNotification = functions.pubsub
     .schedule('every 5 minutes')
     .onRun(async (context) => {
       // Check for notifications to send
       const now = new Date();
       const notifications = await getNotificationsDue(now);
       
       for (const notif of notifications) {
         await admin.messaging().send({
           token: notif.fcm_token,
           notification: {
             title: 'Upcoming Session',
             body: `Your session starts in ${notif.time_before}`,
           },
         });
       }
     });
   ```

2. **Pay-as-you-go pricing:**
   - No daily quotas
   - First 50K reads free, then $0.06 per 100K
   - Predictable scaling

3. **Cloud Scheduler:**
   - Reliable scheduled tasks
   - Server-side notification delivery
   - Cron-style triggers

4. **Advanced monitoring:**
   - Cloud Logging
   - Error Reporting
   - Performance Monitoring

**Migration Steps:**

1. Enable billing in Firebase Console
2. Deploy Cloud Functions for notification scheduling
3. Update mobile app to handle FCM data messages
4. Migrate existing local schedules to server-side
5. Monitor costs and optimize queries

**Estimated Cost (Blaze Plan):**
- 2,000 users: ~$10-15/month
- 5,000 users: ~$30-40/month
- 10,000 users: ~$80-100/month

### Future: Multi-Trainer Support

**Use Case:** Multiple trainers managing their own clients

**Database Changes:**

```typescript
// Add trainer_id to User model
interface User {
  uid: string;
  username: string;
  gmail: string;
  role: 'USER' | 'ADMIN' | 'TRAINER'; // New role
  status: 'IN_TRAINING' | 'INACTIVE';
  trainer_id?: string; // Reference to assigned trainer (for USERs)
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Update TrainingSession to include trainer
interface TrainingSession {
  // ... existing fields
  trainer_id: string; // Trainer who manages this session
}
```

**Security Rules Update:**

```javascript
// Trainers can only manage their assigned users
match /training_sessions/{sessionId} {
  allow read: if request.auth.uid == resource.data.user_id 
              || request.auth.uid == resource.data.trainer_id
              || isAdmin(request.auth.uid);
  
  allow create: if (isTrainer(request.auth.uid) || isAdmin(request.auth.uid))
                && request.resource.data.trainer_id == request.auth.uid;
}
```

**UI Changes:**
- Trainer dashboard shows only assigned users
- Admin dashboard shows all trainers and users
- User selection filtered by trainer

### Future: Server-Side Notification Improvements

**Enhanced Notification Features:**

1. **SMS Notifications (Twilio):**
   ```typescript
   // Cloud Function
   export const sendSMSReminder = functions.firestore
     .document('training_sessions/{sessionId}')
     .onCreate(async (snap) => {
       const session = snap.data();
       const user = await getUser(session.user_id);
       
       if (user.phone_number && user.sms_enabled) {
         await twilio.messages.create({
           to: user.phone_number,
           from: TWILIO_NUMBER,
           body: `Hi ${user.username}, you have a training session tomorrow at ${formatTime(session.start_time)}`,
         });
       }
     });
   ```

2. **Email Reminders (SendGrid):**
   - Fallback when push notifications fail
   - Rich HTML templates with session details
   - Calendar invite attachments (.ics files)

3. **Push Notification Analytics:**
   - Track delivery rate
   - Measure tap-through rate
   - A/B test notification copy

4. **Smart Notification Timing:**
   - Machine learning to optimize send time based on user behavior
   - Time zone-aware scheduling
   - Quiet hours (don't send late at night)

5. **Notification Templates:**
   - Customizable message templates for admins
   - Multi-language support
   - Personalization tokens ({{username}}, {{trainer_name}})

**Implementation Timeline:**
- SMS: 1-2 weeks
- Email: 1 week
- Analytics: 2-3 weeks
- Smart timing: 3-4 weeks (requires ML model training)

---

## Conclusion

This Software Design Document provides a complete implementation blueprint for the Pilates Training Mobile Application. Engineers should follow the recommended build sequence, prioritize thorough testing, and plan for future scalability enhancements.

**Key Takeaways:**
- Firebase Spark plan is suitable for MVP (up to ~1,000 users)
- Client-side notification scheduling has limitations but is viable
- Firestore Security Rules are critical for data protection
- Real-time listeners provide excellent UX with automatic sync
- Plan for Blaze upgrade when scaling beyond MVP

**Next Steps:**
1. Review this document with the development team
2. Set up Firebase project and development environment
3. Begin Phase 1 implementation (Foundation)
4. Schedule weekly progress reviews
5. Iterate based on user feedback

**Document Maintenance:**
- Update this document as requirements change
- Document architectural decisions in ADR format
- Keep code examples in sync with actual implementation
- Review quarterly and update for new Firebase features

**Contact:**
For questions or clarifications, contact the system architect or technical lead.

---

**End of Software Design Document**




