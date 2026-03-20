import { subHours } from 'date-fns';
import * as Notifications from 'expo-notifications';

import { REMINDER_PREFIX, makeReminderId } from '@/features/notifications/notificationIds';
import type { NotificationPreference, TrainingSession } from '@/types/domain';

export interface ReminderPlanEntry {
  identifier: string;
  triggerDate: Date;
  sessionId: string;
  label: string;
}

/**
 * Build the list of reminders that should be scheduled based on
 * the user's SCHEDULED sessions and notification preferences.
 */
export function buildReminderPlan(
  sessions: TrainingSession[],
  preference: NotificationPreference,
  now: Date,
): ReminderPlanEntry[] {
  if (!preference.enabled) return [];

  const plan: ReminderPlanEntry[] = [];

  for (const session of sessions) {
    if (session.status !== 'SCHEDULED') continue;

    if (preference.reminderRule === '24H' || preference.reminderRule === 'BOTH') {
      const triggerDate = subHours(session.startsAt, 24);
      if (triggerDate > now) {
        plan.push({
          identifier: makeReminderId(session.id, '24H'),
          triggerDate,
          sessionId: session.id,
          label: '24 hours',
        });
      }
    }

    if (preference.reminderRule === '1H' || preference.reminderRule === 'BOTH') {
      const triggerDate = subHours(session.startsAt, 1);
      if (triggerDate > now) {
        plan.push({
          identifier: makeReminderId(session.id, '1H'),
          triggerDate,
          sessionId: session.id,
          label: '1 hour',
        });
      }
    }
  }

  return plan;
}

/**
 * Cancel all previously scheduled reminders managed by this app
 * (identified by the deterministic prefix), then schedule the new plan.
 */
export async function syncSessionReminders(
  sessions: TrainingSession[],
  preference: NotificationPreference,
): Promise<void> {
  // 1. Cancel all existing managed reminders
  await cancelAllManagedReminders();

  // 2. Build the new plan
  const now = new Date();
  const plan = buildReminderPlan(sessions, preference, now);

  // 3. Schedule each entry
  for (const entry of plan) {
    const triggerSeconds = Math.max(1, Math.floor((entry.triggerDate.getTime() - now.getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      identifier: entry.identifier,
      content: {
        title: 'Upcoming Training Session',
        body: `Your session starts in ${entry.label}`,
        data: { sessionId: entry.sessionId },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
      },
    });
  }
}

/**
 * Cancel all pending notifications that match our managed prefix.
 */
export async function cancelAllManagedReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managed = scheduled.filter((n) => n.identifier.startsWith(REMINDER_PREFIX));
  for (const n of managed) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}
