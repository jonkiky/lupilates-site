import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { UserProfile } from '@/types/domain';

export const usersAdapter = createEntityAdapter<UserProfile, string>({
  selectId: (user) => user.uid,
});

export interface UsersState {
  ids: string[];
  entities: Record<string, UserProfile>;
  listenerActive: boolean;
  error: string | null;
}

const initialState: UsersState = usersAdapter.getInitialState({
  listenerActive: false,
  error: null,
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    usersReceived(state, action: PayloadAction<UserProfile[]>) {
      usersAdapter.setAll(state, action.payload);
      state.error = null;
    },
    userUpserted(state, action: PayloadAction<UserProfile>) {
      usersAdapter.upsertOne(state, action.payload);
    },
    setUsersListenerActive(state, action: PayloadAction<boolean>) {
      state.listenerActive = action.payload;
    },
    clearUsers(state) {
      usersAdapter.removeAll(state);
      state.listenerActive = false;
      state.error = null;
    },
    setUsersError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { usersReceived, userUpserted, setUsersListenerActive, clearUsers, setUsersError } =
  usersSlice.actions;

export const usersReducer = usersSlice.reducer;
