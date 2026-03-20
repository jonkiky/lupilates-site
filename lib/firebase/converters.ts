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

function toISOString(value: Timestamp): string {
  return value.toDate().toISOString();
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
    const data = snapshot.data(options) as UserProfileDto;

    return {
      uid: snapshot.id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      status: data.status,
      createdAt: toISOString(data.created_at),
      updatedAt: toISOString(data.updated_at),
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
