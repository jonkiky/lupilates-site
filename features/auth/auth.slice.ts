import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { UserProfile } from '@/types/domain';

type AuthLoadStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  status: AuthLoadStatus;
  profile: UserProfile | null;
  errorMessage: string | null;
}

const initialState: AuthState = {
  status: 'idle',
  profile: null,
  errorMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading(state) {
      state.status = 'loading';
      state.errorMessage = null;
    },
    setAuthSession(state, action: PayloadAction<UserProfile>) {
      state.status = 'authenticated';
      state.profile = action.payload;
      state.errorMessage = null;
    },
    clearAuthSession(state) {
      state.status = 'unauthenticated';
      state.profile = null;
      state.errorMessage = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.errorMessage = action.payload;
    },
  },
});

export const { clearAuthSession, setAuthError, setAuthLoading, setAuthSession } = authSlice.actions;

export const authReducer = authSlice.reducer;
