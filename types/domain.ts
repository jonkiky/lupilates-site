export type UserRole = 'USER' | 'ADMIN';

export type UserStatus = 'INACTIVE' | 'IN_TRAINING';

export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type ReminderRule = '24H' | '1H' | 'BOTH';

/** ISO-8601 date string. Stored as a string to keep Redux state serializable. */
export type ISODateString = string;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TrainingSession {
  id: string;
  userId: string;
  trainerId?: string;
  title: string;
  notes?: string;
  status: SessionStatus;
  startsAt: ISODateString;
  endsAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface NotificationPreference {
  uid: string;
  enabled: boolean;
  reminderRule: ReminderRule;
  timezone?: string;
  updatedAt: ISODateString;
}

export type DevicePlatform = 'ios' | 'android' | 'web' | 'unknown';

export interface DeviceToken {
  id: string;
  uid: string;
  token: string;
  platform: DevicePlatform;
  disabled?: boolean;
  lastSeenAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
