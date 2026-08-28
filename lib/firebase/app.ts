import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';

// lib/firebase/app.ts
const ENV = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
} as const;

function getRequiredEnv(key: RequiredEnvKey): string {
  const rawValue = ENV[key];
  if (!rawValue) {
    throw new Error(`[firebase] Missing required environment variable: ${key}`);
  }
  return rawValue;
}

type RequiredEnvKey = keyof typeof ENV;

function buildFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: getRequiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getRequiredEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getRequiredEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    measurementId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
  };
}

const firebaseConfig = buildFirebaseConfig();

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
