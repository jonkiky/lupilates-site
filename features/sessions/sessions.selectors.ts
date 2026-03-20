import { createSelector } from '@reduxjs/toolkit';
import { format, isAfter } from 'date-fns';

import { sessionsAdapter } from '@/features/sessions/sessions.slice';
import type { RootState } from '@/store/rootReducer';
import type { TrainingSession } from '@/types/domain';

const sessionsSelectors = sessionsAdapter.getSelectors<RootState>((state) => state.sessions);

export const selectAllSessions = sessionsSelectors.selectAll;
export const selectSessionById = sessionsSelectors.selectById;
export const selectSessionEntities = sessionsSelectors.selectEntities;

export const selectSessionsListenerActive = (state: RootState) => state.sessions.listenerActive;
export const selectSessionsError = (state: RootState) => state.sessions.error;

export const selectCompletedClassCount = createSelector(
  [selectAllSessions],
  (sessions): number => {
    const now = new Date();
    return sessions.filter((s) => s.status !== 'CANCELLED' && !isAfter(s.endsAt, now)).length;
  },
);

export const selectCompletedThisMonth = createSelector(
  [selectAllSessions],
  (sessions): number => {
    const now = new Date();
    const monthKey = format(now, 'yyyy-MM');
    return sessions.filter(
      (s) => s.status !== 'CANCELLED' && !isAfter(s.endsAt, now) && format(s.startsAt, 'yyyy-MM') === monthKey,
    ).length;
  },
);

export const selectNextUpcomingSession = createSelector(
  [selectAllSessions],
  (sessions): TrainingSession | null => {
    const now = new Date();
    const upcoming = sessions
      .filter((s) => s.status === 'SCHEDULED' && isAfter(s.startsAt, now))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    return upcoming[0] ?? null;
  },
);

export const selectSessionsGroupedByLocalDate = createSelector(
  [selectAllSessions],
  (sessions): Record<string, TrainingSession[]> => {
    const grouped: Record<string, TrainingSession[]> = {};
    for (const session of sessions) {
      const dateKey = format(session.startsAt, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    }
    return grouped;
  },
);

export const selectUpcomingSessions = createSelector(
  [selectAllSessions],
  (sessions): TrainingSession[] => {
    const now = new Date();
    return sessions
      .filter((s) => s.status === 'SCHEDULED' && isAfter(s.startsAt, now))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  },
);

export const selectSessionsForDay = createSelector(
  [selectAllSessions, (_state: RootState, dayKey: string) => dayKey],
  (sessions, dayKey): TrainingSession[] =>
    sessions
      .filter((s) => format(s.startsAt, 'yyyy-MM-dd') === dayKey)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
);
