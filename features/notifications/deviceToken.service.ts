import { getDocs, query, setDoc, where } from 'firebase/firestore';
import { Platform } from 'react-native';

import { deviceTokenDocRef, deviceTokensCollection } from '@/lib/firebase/collections';
import type { DevicePlatform, DeviceToken } from '@/types/domain';

function getDevicePlatform(): DevicePlatform {
  switch (Platform.OS) {
    case 'ios':
      return 'ios';
    case 'android':
      return 'android';
    case 'web':
      return 'web';
    default:
      return 'unknown';
  }
}

/**
 * Upsert a device token document.
 * Uses `{uid}_{platform}` as the document ID so each user+platform pair
 * maps to exactly one token document.
 */
export async function upsertDeviceToken(uid: string, token: string): Promise<void> {
  const platform = getDevicePlatform();
  const docId = `${uid}_${platform}`;
  const now = new Date();

  const existing = await findTokenDoc(uid, token);
  if (existing) {
    // Token already stored and matches — just bump lastSeenAt
    await setDoc(deviceTokenDocRef(existing.id), {
      ...existing,
      lastSeenAt: now,
      updatedAt: now,
    });
    return;
  }

  const deviceToken: DeviceToken = {
    id: docId,
    uid,
    token,
    platform,
    disabled: false,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(deviceTokenDocRef(docId), deviceToken);
}

/**
 * Look up an existing token document for this user that matches the given token string.
 */
async function findTokenDoc(uid: string, token: string): Promise<DeviceToken | null> {
  const q = query(deviceTokensCollection, where('uid', '==', uid), where('token', '==', token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}
