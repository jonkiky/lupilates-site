import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
    WithFieldValue,
} from 'firebase/firestore';

import type {
    DeviceToken,
    NotificationPreference,
    TrainingSession,
    UserProfile,
} from '@/types/domain';
import type {
    DeviceTokenDto,
    NotificationPreferenceDto,
    TrainingSessionDto,
    UserProfileDto,
} from '@/types/dto';

const UNKNOWN_DATE_ISO = new Date(0).toISOString();

type LegacyUserProfileDto = Partial<UserProfileDto> & {
  username?: unknown;
  displayName?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toISOString(value: unknown): string {
  let date: Date;

  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  ) {
    const nanoseconds =
      'nanoseconds' in value && typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : 0;
    date = new Date(value.seconds * 1_000 + nanoseconds / 1_000_000);
  } else {
    throw new TypeError('Expected a Firestore Timestamp, timestamp-shaped object, Date, or ISO date string.');
  }

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Expected a valid Firestore date value.');
  }

  return date.toISOString();
}

function toOptionalISOString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  try {
    return toISOString(value);
  } catch {
    return undefined;
  }
}

function toTimestamp(value: string): Timestamp {
  return Timestamp.fromDate(new Date(value));
}

export const userProfileConverter: FirestoreDataConverter<UserProfile, UserProfileDto> = {
  toFirestore(modelObject: WithFieldValue<UserProfile>): WithFieldValue<UserProfileDto> {
    const data = modelObject as UserProfile;

    return {
      email: data.email,
      display_name: data.displayName,
      role: data.role,
      status: data.status,
      created_at: toTimestamp(data.createdAt),
      updated_at: toTimestamp(data.updatedAt),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions): UserProfile {
    const data = snapshot.data(options) as LegacyUserProfileDto;
    const email = toNonEmptyString(data.email) ?? '';
    const displayName =
      toNonEmptyString(data.display_name) ??
      toNonEmptyString(data.username) ??
      toNonEmptyString(data.displayName) ??
      toNonEmptyString(email.split('@')[0]) ??
      'Unknown User';
    const role = data.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const status = data.status === 'IN_TRAINING' || data.status === 'INACTIVE' ? data.status : 'INACTIVE';
    const createdAt = toOptionalISOString(data.created_at ?? data.createdAt);
    const updatedAt = toOptionalISOString(data.updated_at ?? data.updatedAt);

    return {
      uid: snapshot.id,
      email,
      displayName,
      role,
      status,
      createdAt: createdAt ?? updatedAt ?? UNKNOWN_DATE_ISO,
      updatedAt: updatedAt ?? createdAt ?? UNKNOWN_DATE_ISO,
    };
  },
};

export const trainingSessionConverter: FirestoreDataConverter<TrainingSession, TrainingSessionDto> = {
  toFirestore(modelObject: WithFieldValue<TrainingSession>): WithFieldValue<TrainingSessionDto> {
    const data = modelObject as TrainingSession;

    const dto: WithFieldValue<TrainingSessionDto> = {
      user_id: data.userId,
      title: data.title,
      status: data.status,
      starts_at: toTimestamp(data.startsAt),
      ends_at: toTimestamp(data.endsAt),
      created_at: toTimestamp(data.createdAt),
      updated_at: toTimestamp(data.updatedAt),
    };
    if (data.trainerId !== undefined) dto.trainer_id = data.trainerId;
    if (data.notes !== undefined) dto.notes = data.notes;
    return dto;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions): TrainingSession {
    const data = snapshot.data(options) as TrainingSessionDto;

    return {
      id: snapshot.id,
      userId: data.user_id,
      trainerId: data.trainer_id,
      title: data.title,
      notes: data.notes,
      status: data.status,
      startsAt: toISOString(data.starts_at),
      endsAt: toISOString(data.ends_at),
      createdAt: toISOString(data.created_at),
      updatedAt: toISOString(data.updated_at),
    };
  },
};

export const notificationPreferenceConverter: FirestoreDataConverter<
  NotificationPreference,
  NotificationPreferenceDto
> = {
  toFirestore(modelObject: WithFieldValue<NotificationPreference>): WithFieldValue<NotificationPreferenceDto> {
    const data = modelObject as NotificationPreference;

    return {
      enabled: data.enabled,
      reminder_rule: data.reminderRule,
      timezone: data.timezone,
      updated_at: toTimestamp(data.updatedAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
    options: SnapshotOptions
  ): NotificationPreference {
    const data = snapshot.data(options) as NotificationPreferenceDto;

    return {
      uid: snapshot.id,
      enabled: data.enabled,
      reminderRule: data.reminder_rule,
      timezone: data.timezone,
      updatedAt: toISOString(data.updated_at),
    };
  },
};

export const deviceTokenConverter: FirestoreDataConverter<DeviceToken, DeviceTokenDto> = {
  toFirestore(modelObject: WithFieldValue<DeviceToken>): WithFieldValue<DeviceTokenDto> {
    const data = modelObject as DeviceToken;

    return {
      uid: data.uid,
      token: data.token,
      platform: data.platform,
      disabled: data.disabled,
      last_seen_at: toTimestamp(data.lastSeenAt),
      created_at: toTimestamp(data.createdAt),
      updated_at: toTimestamp(data.updatedAt),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions): DeviceToken {
    const data = snapshot.data(options) as DeviceTokenDto;

    return {
      id: snapshot.id,
      uid: data.uid,
      token: data.token,
      platform: data.platform,
      disabled: data.disabled,
      lastSeenAt: toISOString(data.last_seen_at),
      createdAt: toISOString(data.created_at),
      updatedAt: toISOString(data.updated_at),
    };
  },
};
