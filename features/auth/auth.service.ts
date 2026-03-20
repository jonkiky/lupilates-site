import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';

import { ROUTES } from '@/constants/routes';
import { firebaseAuth } from '@/lib/firebase/auth';
import { userDocRef } from '@/lib/firebase/collections';
import type { UserProfile } from '@/types/domain';

function getRequiredEnv(name: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'): string {
  const rawValue = process.env[name];

  if (!rawValue) {
    throw new Error(`[auth] Missing required environment variable: ${name}`);
  }

  const value = rawValue.trim().replace(/^['\"]|['\"]$/g, '');

  if (!value) {
    throw new Error(`[auth] Empty environment variable after normalization: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID' | 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID') {
  const rawValue = process.env[name];
  const value = rawValue?.trim().replace(/^['\"]|['\"]$/g, '');
  return value && value.length > 0 ? value : undefined;
}

export interface GoogleAuthClientConfig {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
}

export function getGoogleAuthClientConfig(): GoogleAuthClientConfig {
  return {
    webClientId: getRequiredEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
    iosClientId: getOptionalEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    androidClientId: getOptionalEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
  };
}

export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(firebaseAuth, credential);
}

export async function bootstrapUserProfile(uid: string): Promise<UserProfile> {
  const docRef = userDocRef(uid);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  const authUser = firebaseAuth.currentUser;

  if (!authUser) {
    throw new Error('[auth] Firebase auth user is missing while bootstrapping profile.');
  }

  const newProfile: UserProfile = {
    uid,
    email: authUser.email ?? '',
    displayName: authUser.displayName ?? 'Pilates User',
    role: 'USER',
    status: 'IN_TRAINING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, newProfile);
  return newProfile;
}

export function routeAfterAuth(profile: UserProfile): '/admin/(tabs)/calendar' | '/user/(tabs)/dashboard' {
  if (profile.role === 'ADMIN') {
    return ROUTES.admin.root;
  }

  return ROUTES.user.root;
}

export async function signOutAndCleanup() {
  await signOut(firebaseAuth);
}
