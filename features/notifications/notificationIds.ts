import type { ReminderRule } from '@/types/domain';

/**
 * Deterministic notification identifier for a session reminder.
 * Using a stable ID allows us to cancel/replace specific reminders
 * without affecting unrelated notifications.
 */
export function makeReminderId(sessionId: string, rule: '24H' | '1H'): string {
  return `reminder-${sessionId}-${rule}`;
}

/**
 * Returns the reminder ID(s) that should exist for a given session + rule combination.
 */
export function reminderIdsForSession(sessionId: string, rule: ReminderRule): string[] {
  switch (rule) {
    case '24H':
      return [makeReminderId(sessionId, '24H')];
    case '1H':
      return [makeReminderId(sessionId, '1H')];
    case 'BOTH':
      return [makeReminderId(sessionId, '24H'), makeReminderId(sessionId, '1H')];
  }
}

/** Admin: heads-up for a single session anywhere in the studio. */
export function makeAdminSessionReminderId(sessionId: string, rule: '24H' | '1H'): string {
  return `reminder-admin-session-${sessionId}-${rule}`;
}

/** Prefix used for all managed reminder IDs — used to identify "our" notifications. */
export const REMINDER_PREFIX = 'reminder-';
