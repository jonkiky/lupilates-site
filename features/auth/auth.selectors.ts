import type { RootState } from '@/store/rootReducer';

export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthProfile = (state: RootState) => state.auth.profile;
export const selectAuthError = (state: RootState) => state.auth.errorMessage;
export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';
