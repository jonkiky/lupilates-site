import type { ReminderRule, SessionStatus, UserRole, UserStatus } from '@/types/domain';

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const satisfies Record<UserRole, UserRole>;

export const USER_STATUSES = {
  INACTIVE: 'INACTIVE',
  IN_TRAINING: 'IN_TRAINING',
} as const satisfies Record<UserStatus, UserStatus>;

export const SESSION_STATUSES = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const satisfies Record<SessionStatus, SessionStatus>;

export const REMINDER_RULES = {
  H24: '24H',
  H1: '1H',
  BOTH: 'BOTH',
} as const satisfies {
  H24: ReminderRule;
  H1: ReminderRule;
  BOTH: ReminderRule;
};
