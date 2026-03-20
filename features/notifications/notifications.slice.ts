import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { NotificationPreference, ReminderRule } from '@/types/domain';

export interface NotificationsState {
  /** Whether the OS-level notification permission has been granted. */
  permissionGranted: boolean;
  /** Current Expo push token (if registered). */
  pushToken: string | null;
  /** User notification preferences loaded from Firestore. */
  preference: NotificationPreference | null;
  /** Whether the scheduler has completed at least one sync cycle. */
  schedulerReady: boolean;
}

const initialState: NotificationsState = {
  permissionGranted: false,
  pushToken: null,
  preference: null,
  schedulerReady: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPermissionGranted(state, action: PayloadAction<boolean>) {
      state.permissionGranted = action.payload;
    },
    setPushToken(state, action: PayloadAction<string | null>) {
      state.pushToken = action.payload;
    },
    preferenceReceived(state, action: PayloadAction<NotificationPreference>) {
      state.preference = action.payload;
    },
    preferenceUpdated(
      state,
      action: PayloadAction<{ enabled: boolean; reminderRule: ReminderRule }>,
    ) {
      if (state.preference) {
        state.preference.enabled = action.payload.enabled;
        state.preference.reminderRule = action.payload.reminderRule;
        state.preference.updatedAt = new Date().toISOString();
      }
    },
    setSchedulerReady(state, action: PayloadAction<boolean>) {
      state.schedulerReady = action.payload;
    },
    clearNotifications() {
      return initialState;
    },
  },
});

export const {
  setPermissionGranted,
  setPushToken,
  preferenceReceived,
  preferenceUpdated,
  setSchedulerReady,
  clearNotifications,
} = notificationsSlice.actions;

export const notificationsReducer = notificationsSlice.reducer;
