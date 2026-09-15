import { onSnapshot } from 'firebase/firestore';

import { setUsersError, setUsersListenerActive, usersReceived } from '@/features/users/users.slice';
import { usersCollection } from '@/lib/firebase/collections';
import type { AppDispatch } from '@/store';

export function listenUsers(dispatch: AppDispatch): () => void {
  dispatch(setUsersListenerActive(true));

  const unsubscribe = onSnapshot(
    usersCollection,
    (snapshot) => {
      const invalidDocumentIds: string[] = [];
      const users = snapshot.docs.flatMap((doc) => {
        try {
          return [doc.data()];
        } catch (error) {
          invalidDocumentIds.push(doc.id);
          console.warn(`[users] invalid profile document (${doc.id}):`, error);
          return [];
        }
      });

      dispatch(usersReceived(users));
      if (invalidDocumentIds.length > 0) {
        dispatch(setUsersError('Some user profiles could not be loaded because their data is invalid.'));
      }
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
