import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { TrainingSession } from '@/types/domain';

export const sessionsAdapter = createEntityAdapter<TrainingSession>();

export interface SessionsState {
  ids: string[];
  entities: Record<string, TrainingSession>;
  listenerActive: boolean;
  queryWindow: { from: string; to: string } | null;
  error: string | null;
}

const initialState: SessionsState = sessionsAdapter.getInitialState({
  listenerActive: false,
  queryWindow: null,
  error: null,
});

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    sessionsReceived(state, action: PayloadAction<TrainingSession[]>) {
      sessionsAdapter.setAll(state, action.payload);
      state.error = null;
    },
    sessionUpserted(state, action: PayloadAction<TrainingSession>) {
      sessionsAdapter.upsertOne(state, action.payload);
    },
    sessionRemoved(state, action: PayloadAction<string>) {
      sessionsAdapter.removeOne(state, action.payload);
    },
    setListenerActive(state, action: PayloadAction<boolean>) {
      state.listenerActive = action.payload;
    },
    setQueryWindow(state, action: PayloadAction<{ from: string; to: string }>) {
      state.queryWindow = action.payload;
    },
    clearSessions(state) {
      sessionsAdapter.removeAll(state);
      state.listenerActive = false;
      state.queryWindow = null;
      state.error = null;
    },
    setSessionsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  sessionsReceived,
  sessionUpserted,
  sessionRemoved,
  setListenerActive,
  setQueryWindow,
  clearSessions,
  setSessionsError,
} = sessionsSlice.actions;

export const sessionsReducer = sessionsSlice.reducer;
