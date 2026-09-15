import { format, isAfter, isBefore, subHours } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  makeAdminSessionReminderId,
  makeReminderId,
  REMINDER_PREFIX,
} from '@/features/notifications/notificationIds';
import type { NotificationPreference, TrainingSession } from '@/types/domain';

/**
 * iOS keeps at most 64 *pending* local notification requests per app and
 * silently discards the rest, keeping the soonest-firing ones. We stay well
 * under that ceiling and let each app launch top the queue back up.
 */
export const MAX_PENDING_REMINDERS = 60;

/**
 * How far ahead admin per-session reminders are scheduled.
 *
 * Must stay above 1: a session inside a 24-hour window is by definition less
 * than 24 hours away, so its 24-hour trigger would already be in the past and
 * get skipped — leaving only the 1-hour reminder.
 *
 * At 2 days and ~8 sessions/day this is ~32 requests (two per session), well
 * under MAX_PENDING_REMINDERS alongside the admin's own personal reminders.
 * Each app launch re-syncs and extends the window forward.
 */
export const ADMIN_SESSION_LOOKAHEAD_DAYS = 2;

export interface ReminderPlanEntry {
  identifier: string;
  triggerDate: Date;
  sessionId?: string;
  title: string;
  body: string;
}

/**
 * Build the list of reminders that should be scheduled based on
 * the user's own SCHEDULED sessions and notification preferences.
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
      if (isAfter(triggerDate, now)) {
        plan.push({
          identifier: makeReminderId(session.id, '24H'),
          triggerDate,
          sessionId: session.id,
          title: 'Upcoming Training Session',
          body: 'Your session starts in 24 hours',
        });
      }
    }

    if (preference.reminderRule === '1H' || preference.reminderRule === 'BOTH') {
      const triggerDate = subHours(session.startsAt, 1);
      if (isAfter(triggerDate, now)) {
        plan.push({
          identifier: makeReminderId(session.id, '1H'),
          triggerDate,
          sessionId: session.id,
          title: 'Upcoming Training Session',
          body: 'Your session starts in 1 hour',
        });
      }
    }
  }

  return plan;
}

/**
 * Build the admin-wide plan: a 24-hour and a 1-hour heads-up for every
 * scheduled session in the studio starting within ADMIN_SESSION_LOOKAHEAD_DAYS,
 * regardless of which trainee it belongs to.
 */
export function buildAdminReminderPlan(sessions: TrainingSession[], now: Date): ReminderPlanEntry[] {
  const plan: ReminderPlanEntry[] = [];
  const cutoff = new Date(now.getTime() + ADMIN_SESSION_LOOKAHEAD_DAYS * 24 * 3600 * 1000);

  const offsets: { rule: '24H' | '1H'; hours: number; title: string }[] = [
    { rule: '24H', hours: 24, title: 'Session tomorrow' },
    { rule: '1H', hours: 1, title: 'Session in 1 hour' },
  ];

  for (const session of sessions) {
    if (session.status !== 'SCHEDULED') continue;

    const startsAt = new Date(session.startsAt);
    if (!isBefore(startsAt, cutoff)) continue;

    for (const { rule, hours, title } of offsets) {
      const triggerDate = subHours(startsAt, hours);
      if (!isAfter(triggerDate, now)) continue;

      plan.push({
        identifier: makeAdminSessionReminderId(session.id, rule),
        triggerDate,
        sessionId: session.id,
        title,
        body: `${session.title} at ${format(startsAt, 'h:mm a')}`,
      });
    }
  }

  return plan;
}

export interface SyncRemindersOptions {
  /** Sessions belonging to the signed-in user. */
  personalSessions: TrainingSession[];
  preference: NotificationPreference | null;
  /** Every studio session, when the signed-in user is an admin. */
  adminSessions?: TrainingSession[];
  now?: Date;
}

/**
 * Cancel all previously scheduled reminders managed by this app
 * (identified by the deterministic prefix), then schedule the new plan.
 *
 * This is the single owner of local reminder scheduling — call it from one
 * place only, or the cancel-then-reschedule will wipe the other caller's work.
 */
export async function syncReminders(options: SyncRemindersOptions): Promise<void> {
  const { personalSessions, preference, adminSessions, now = new Date() } = options;

  await cancelAllManagedReminders();

  const plan: ReminderPlanEntry[] = [];
  if (preference) plan.push(...buildReminderPlan(personalSessions, preference, now));
  if (adminSessions?.length && preference?.enabled !== false) {
    plan.push(...buildAdminReminderPlan(adminSessions, now));
  }

  // Soonest first, so if we are over the OS ceiling we keep the most imminent.
  const ordered = plan
    .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime())
    .slice(0, MAX_PENDING_REMINDERS);

  for (const entry of ordered) {
    const triggerSeconds = Math.max(1, Math.floor((entry.triggerDate.getTime() - now.getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      identifier: entry.identifier,
      content: {
        title: entry.title,
        body: entry.body,
        data: entry.sessionId ? { sessionId: entry.sessionId } : {},
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'session-reminders' } : {}),
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
 * @deprecated Use {@link syncReminders}. Kept so existing callers that only
 * schedule personal reminders keep compiling.
 */
export async function syncSessionReminders(
  sessions: TrainingSession[],
  preference: NotificationPreference,
): Promise<void> {
  return syncReminders({ personalSessions: sessions, preference });
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
