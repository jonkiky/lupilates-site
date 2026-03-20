import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/auth.slice';
import { notificationsReducer } from '@/features/notifications/notifications.slice';
import { sessionsReducer } from '@/features/sessions/sessions.slice';
import { usersReducer } from '@/features/users/users.slice';

interface AppState {
  isBootstrapped: boolean;
}

const initialAppState: AppState = {
  isBootstrapped: false,
};

function appReducer(state: AppState = initialAppState): AppState {
  return state;
}

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  notifications: notificationsReducer,
  sessions: sessionsReducer,
  users: usersReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
