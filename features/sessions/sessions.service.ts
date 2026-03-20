import { addDoc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

import {
  notificationPreferenceDocRef,
  trainingSessionDocRef,
  trainingSessionsCollection,
} from '@/lib/firebase/collections';
import type { NotificationPreference, ReminderRule, SessionStatus, TrainingSession } from '@/types/domain';

export async function getSessionById(sessionId: string): Promise<TrainingSession | null> {
  const snapshot = await getDoc(trainingSessionDocRef(sessionId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getNotificationPreference(uid: string): Promise<NotificationPreference | null> {
  const snapshot = await getDoc(notificationPreferenceDocRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export interface SavePreferenceInput {
  uid: string;
  enabled: boolean;
  reminderRule: ReminderRule;
}

export async function saveNotificationPreference(input: SavePreferenceInput): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  const docRef = notificationPreferenceDocRef(input.uid);
  const pref: NotificationPreference = {
    uid: input.uid,
    enabled: input.enabled,
    reminderRule: input.reminderRule,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, pref);
}

// --- Admin session operations ---

export interface CreateSessionInput {
  userId: string;
  trainerId: string;
  title: string;
  notes?: string;
  startsAt: Date;
  endsAt: Date;
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  const now = new Date();
  const session: Omit<TrainingSession, 'id'> = {
    userId: input.userId,
    trainerId: input.trainerId,
    title: input.title,
    notes: input.notes,
    status: 'SCHEDULED',
    startsAt: input.startsAt.toISOString(),
    endsAt: input.endsAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const docRef = await addDoc(trainingSessionsCollection, session as TrainingSession);
  return docRef.id;
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  title?: string;
  notes?: string;
  startsAt?: Date;
  endsAt?: Date;
}

export async function updateSession(sessionId: string, patch: UpdateSessionInput): Promise<void> {
  const docRef = trainingSessionDocRef(sessionId);
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  if (patch.startsAt !== undefined) updates.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) updates.ends_at = patch.endsAt;
  await updateDoc(docRef, updates);
}

export async function cancelSession(sessionId: string): Promise<void> {
  await updateSession(sessionId, { status: 'CANCELLED' });
}

/** Fetch the most recent sessions (up to `count`) for a user that have notes. */
export async function fetchRecentUserNotes(
  userId: string,
  count = 4,
): Promise<Pick<TrainingSession, 'id' | 'startsAt' | 'notes'>[]> {
  const q = query(
    trainingSessionsCollection,
    where('user_id', '==', userId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data())
    .filter((s) => !!s.notes)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, count)
    .map((s) => ({ id: s.id, startsAt: s.startsAt, notes: s.notes }));
}
