import { addDoc, getDoc, updateDoc } from 'firebase/firestore';

import { userDocRef, usersCollection } from '@/lib/firebase/collections';
import type { UserProfile, UserRole, UserStatus } from '@/types/domain';

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userDocRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export interface UpdateUserInput {
  displayName?: string;
  email?: string;
  status?: UserStatus;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

export async function createUser(input: CreateUserInput): Promise<string> {
  const now = new Date().toISOString();
  const profile: Omit<UserProfile, 'uid'> & { uid: string } = {
    uid: '',
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(usersCollection, profile as UserProfile);
  return docRef.id;
}

export async function updateUser(uid: string, patch: UpdateUserInput): Promise<void> {
  const docRef = userDocRef(uid);
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (patch.displayName !== undefined) updates.display_name = patch.displayName;
  if (patch.email !== undefined) updates.email = patch.email;
  if (patch.status !== undefined) updates.status = patch.status;
  await updateDoc(docRef, updates);
}
