import { onSnapshot, query, where } from 'firebase/firestore';

import { setUsersError, setUsersListenerActive, usersReceived } from '@/features/users/users.slice';
import { usersCollection } from '@/lib/firebase/collections';
import type { AppDispatch } from '@/store';

export function listenUsers(dispatch: AppDispatch): () => void {
  dispatch(setUsersListenerActive(true));

  const q = query(usersCollection, where('role', '==', 'USER'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data());
      dispatch(usersReceived(users));
    },
    (error) => {
      console.error('[users] listener error:', error);
      dispatch(setUsersError('Failed to load users. Please check your connection.'));
      dispatch(setUsersListenerActive(false));
    },
  );

  return () => {
    unsubscribe();
    dispatch(setUsersListenerActive(false));
  };
}
