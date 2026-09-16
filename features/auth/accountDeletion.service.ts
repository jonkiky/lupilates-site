import { deleteUser } from 'firebase/auth';
import { deleteDoc, getDocs, query, where } from 'firebase/firestore';

import { cancelAllManagedReminders } from '@/features/notifications/reminderScheduler';
import { firebaseAuth } from '@/lib/firebase/auth';
import {
  deviceTokenDocRef,
  deviceTokensCollection,
  notificationPreferenceDocRef,
  userDocRef,
} from '@/lib/firebase/collections';

/**
 * Raised when Firebase refuses to delete the auth account because the user's
 * sign-in is too old. The only remedy is a fresh sign-in, so the UI asks the
 * user to sign out and back in rather than attempting a silent re-auth.
 */
export class RecentLoginRequiredError extends Error {
  constructor() {
    super('[auth] Recent sign-in required before the account can be deleted.');
    this.name = 'RecentLoginRequiredError';
  }
}

/**
 * Permanently delete the signed-in user's account and personal data.
 *
 * Order matters: Firestore documents are removed while the user is still
 * authenticated, because the security rules check request.auth.uid. Deleting
 * the auth account first would lock us out of their own data.
 *
 * Training sessions are deliberately NOT deleted. They are the studio's
 * booking records, and a client cannot be allowed to erase the studio's
 * schedule. Once the profile is gone the remaining user_id no longer resolves
 * to a person — this is disclosed in the privacy policy.
 */
export async function deleteAccountAndData(uid: string): Promise<void> {
  const authUser = firebaseAuth.currentUser;

  if (!authUser) {
    throw new Error('[auth] No signed-in user to delete.');
  }

  if (authUser.uid !== uid) {
    throw new Error('[auth] Refusing to delete data for a different user.');
  }

  // 1. Local reminders — nothing server-side, but they would otherwise keep
  //    firing on this device after the account is gone.
  await cancelAllManagedReminders();

  // 2. Device push tokens (one per platform).
  const tokenSnapshot = await getDocs(query(deviceTokensCollection, where('uid', '==', uid)));
  await Promise.all(tokenSnapshot.docs.map((d) => deleteDoc(deviceTokenDocRef(d.id))));

  // 3. Notification preferences.
  await deleteDoc(notificationPreferenceDocRef(uid));

  // 4. Profile.
  await deleteDoc(userDocRef(uid));

  // 5. The auth account itself. This must be last — it invalidates the
  //    credentials the writes above depend on.
  try {
    await deleteUser(authUser);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'auth/requires-recent-login'
    ) {
      throw new RecentLoginRequiredError();
    }
    throw error;
  }
}
