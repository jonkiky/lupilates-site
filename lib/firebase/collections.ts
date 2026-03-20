import { collection, doc } from 'firebase/firestore';

import {
    deviceTokenConverter,
    notificationPreferenceConverter,
    trainingSessionConverter,
    userProfileConverter,
} from '@/lib/firebase/converters';
import { firebaseDb } from '@/lib/firebase/firestore';

export const COLLECTIONS = {
  users: 'users',
  trainingSessions: 'training_sessions',
  notificationPreferences: 'notification_preferences',
  deviceTokens: 'device_tokens',
} as const;

export const usersCollection = collection(firebaseDb, COLLECTIONS.users).withConverter(userProfileConverter);
export const trainingSessionsCollection = collection(firebaseDb, COLLECTIONS.trainingSessions).withConverter(
  trainingSessionConverter
);
export const notificationPreferencesCollection = collection(
  firebaseDb,
  COLLECTIONS.notificationPreferences
).withConverter(notificationPreferenceConverter);
export const deviceTokensCollection = collection(firebaseDb, COLLECTIONS.deviceTokens).withConverter(deviceTokenConverter);

export function userDocRef(uid: string) {
  return doc(firebaseDb, COLLECTIONS.users, uid).withConverter(userProfileConverter);
}

export function trainingSessionDocRef(sessionId: string) {
  return doc(firebaseDb, COLLECTIONS.trainingSessions, sessionId).withConverter(trainingSessionConverter);
}

export function notificationPreferenceDocRef(uid: string) {
  return doc(firebaseDb, COLLECTIONS.notificationPreferences, uid).withConverter(notificationPreferenceConverter);
}

export function deviceTokenDocRef(docId: string) {
  return doc(firebaseDb, COLLECTIONS.deviceTokens, docId).withConverter(deviceTokenConverter);
}
