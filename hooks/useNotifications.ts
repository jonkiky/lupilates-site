import { useEffect, useState } from 'react';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { upsertDeviceToken } from '@/features/notifications/deviceToken.service';
import {
  preferenceReceived,
  setPermissionGranted,
  setPushToken,
  setSchedulerReady,
} from '@/features/notifications/notifications.slice';
import { selectNotificationPreference } from '@/features/notifications/notifications.selectors';
import {
  ADMIN_SESSION_LOOKAHEAD_DAYS,
  syncReminders,
} from '@/features/notifications/reminderScheduler';
import { listenAllSessionsInRange } from '@/features/sessions/sessions.listener';
import { selectUpcomingSessions } from '@/features/sessions/sessions.selectors';
import { getNotificationPreference } from '@/features/sessions/sessions.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { NotificationPreference, TrainingSession } from '@/types/domain';

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Master hook for the notification lifecycle.
 * Call once from the root navigation component.
 *
 * Responsibilities:
 *  1. Request OS notification permission
 *  2. Register Expo push token + store in Firestore
 *  3. Load notification preferences from Firestore
 *  4. Auto-reschedule local reminders when sessions or preferences change
 *  5. Handle notification tap → navigate to session detail
 */
export function useNotifications() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profile = useAppSelector(selectAuthProfile);
  const upcomingSessions = useAppSelector(selectUpcomingSessions);
  const preference = useAppSelector(selectNotificationPreference);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    Notifications.setNotificationChannelAsync('session-reminders', {
      name: 'Session reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    }).catch(() => undefined);
  }, []);

  // ---- 1. Request permission & register token on sign-in ----
  useEffect(() => {
    if (!profile?.uid) return;

    (async () => {
      const granted = await ensureNotificationPermission();
      dispatch(setPermissionGranted(granted));

      if (granted) {
        const token = await registerPushToken(profile.uid);
        if (token) dispatch(setPushToken(token));
      }

      // Load existing preferences
      const pref = await getNotificationPreference(profile.uid);
      if (pref) {
        dispatch(preferenceReceived(pref));
      } else {
        // Default preference for new users
        const defaultPref: NotificationPreference = {
          uid: profile.uid,
          enabled: true,
          reminderRule: '24H',
          updatedAt: new Date().toISOString(),
        };
        dispatch(preferenceReceived(defaultPref));
      }
    })();
  }, [dispatch, profile?.uid]);

  // ---- 2a. Admins additionally watch every studio session ----
  const isAdmin = profile?.role === 'ADMIN';
  const [adminSessions, setAdminSessions] = useState<TrainingSession[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminSessions([]);
      return;
    }

    const from = new Date();
    const to = new Date(from.getTime() + ADMIN_SESSION_LOOKAHEAD_DAYS * 24 * 3600 * 1000);

    return listenAllSessionsInRange(from, to, setAdminSessions);
  }, [isAdmin]);

  // ---- 2b. Reschedule reminders when sessions change ----
  useEffect(() => {
    if (!preference || !profile?.uid) return;

    syncReminders({
      personalSessions: upcomingSessions,
      preference,
      adminSessions: isAdmin ? adminSessions : undefined,
    }).then(() => {
      dispatch(setSchedulerReady(true));
    });
  }, [adminSessions, dispatch, isAdmin, preference, profile?.uid, upcomingSessions]);

  // ---- 3. Handle notification tap → deep link ----
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const sessionId = data?.sessionId;
      if (typeof sessionId === 'string' && sessionId) {
        router.push(ROUTES.modal.sessionDetail(sessionId) as never);
      }
    });

    return () => subscription.remove();
  }, [router]);
}

// ---- Helper: request notification permission ----
async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (!Device.isDevice) {
    // Notification permissions only work on physical devices
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ---- Helper: get Expo push token ----
async function registerPushToken(uid: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store in Firestore
    await upsertDeviceToken(uid, token);

    return token;
  } catch {
    // Token registration can fail in simulator or restricted environments
    return null;
  }
}
