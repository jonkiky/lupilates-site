import type { RootState } from '@/store/rootReducer';

export const selectNotificationPermission = (state: RootState) =>
  state.notifications.permissionGranted;

export const selectPushToken = (state: RootState) => state.notifications.pushToken;

export const selectNotificationPreference = (state: RootState) => state.notifications.preference;

export const selectSchedulerReady = (state: RootState) => state.notifications.schedulerReady;
