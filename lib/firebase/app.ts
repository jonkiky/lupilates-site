import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';

const REQUIRED_ENV_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function getRequiredEnv(key: RequiredEnvKey): string {
  const rawValue = process.env[key];

  if (!rawValue) {
    throw new Error(`[firebase] Missing required environment variable: ${key}`);
  }

  return rawValue;
}

function buildFirebaseConfig(): FirebaseOptions {
  console.log('[firebase] Building Firebase config from environment variables...');
  console.log(getRequiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY'))
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
