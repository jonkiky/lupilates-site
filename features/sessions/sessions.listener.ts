import { onSnapshot, query, Timestamp, where } from 'firebase/firestore';

import {
    sessionsReceived,
    setListenerActive,
    setQueryWindow,
    setSessionsError,
} from '@/features/sessions/sessions.slice';
import { trainingSessionsCollection } from '@/lib/firebase/collections';
import type { AppDispatch } from '@/store';
import type { SessionStatus } from '@/types/domain';

export function listenUserSessions(
  uid: string,
  fromUtc: Date,
  toUtc: Date,
  dispatch: AppDispatch,
): () => void {
  dispatch(setQueryWindow({ from: fromUtc.toISOString(), to: toUtc.toISOString() }));
  dispatch(setListenerActive(true));

  const q = query(
    trainingSessionsCollection,
    where('user_id', '==', uid),
    where('starts_at', '>=', Timestamp.fromDate(fromUtc)),
    where('starts_at', '<=', Timestamp.fromDate(toUtc)),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((doc) => doc.data());
      dispatch(sessionsReceived(sessions));
    },
    (error) => {
      console.error('[sessions] listener error:', error);
      dispatch(setSessionsError('Failed to load sessions. Please check your connection.'));
      dispatch(setListenerActive(false));
    },
  );

  return () => {
    unsubscribe();
    dispatch(setListenerActive(false));
  };
}

export function listenAdminSessions(
  fromUtc: Date,
  toUtc: Date,
  dispatch: AppDispatch,
  status?: SessionStatus,
): () => void {
  dispatch(setQueryWindow({ from: fromUtc.toISOString(), to: toUtc.toISOString() }));
  dispatch(setListenerActive(true));

  const constraints = [
    where('starts_at', '>=', Timestamp.fromDate(fromUtc)),
    where('starts_at', '<=', Timestamp.fromDate(toUtc)),
  ];
  if (status) {
    constraints.push(where('status', '==', status));
  }

  const q = query(trainingSessionsCollection, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((doc) => doc.data());
      dispatch(sessionsReceived(sessions));
    },
    (error) => {
      console.error('[admin-sessions] listener error:', error);
      dispatch(setSessionsError('Failed to load sessions. Please check your connection.'));
      dispatch(setListenerActive(false));
    },
  );

  return () => {
    unsubscribe();
    dispatch(setListenerActive(false));
  };
}
