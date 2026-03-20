import { Timestamp } from 'firebase/firestore';

import type { DevicePlatform, ReminderRule, SessionStatus, UserRole, UserStatus } from '@/types/domain';

export interface UserProfileDto {
  email: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TrainingSessionDto {
  user_id: string;
  trainer_id?: string;
  title: string;
  notes?: string;
  status: SessionStatus;
  starts_at: Timestamp;
  ends_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface NotificationPreferenceDto {
  enabled: boolean;
  reminder_rule: ReminderRule;
  timezone?: string;
  updated_at: Timestamp;
}

export interface DeviceTokenDto {
  uid: string;
  token: string;
  platform: DevicePlatform;
  disabled?: boolean;
  last_seen_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
