import type { SessionStatus, UserStatus } from '@/types/domain';

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  SCHEDULED: '#1D4ED8',
  COMPLETED: '#15803D',
  CANCELLED: '#B91C1C',
  NO_SHOW: '#9A3412',
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  INACTIVE: '#6B7280',
  IN_TRAINING: '#0F766E',
};
