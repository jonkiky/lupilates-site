import { z } from 'zod/v4';

// --- Enums ---

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export const userStatusSchema = z.enum(['INACTIVE', 'IN_TRAINING']);
export const sessionStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
export const reminderRuleSchema = z.enum(['24H', '1H', 'BOTH']);
export const devicePlatformSchema = z.enum(['ios', 'android', 'web', 'unknown']);

// --- Session create/update payloads ---

export const createSessionSchema = z
  .object({
    userId: z.string().min(1, 'User is required'),
    trainerId: z.string().min(1),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    notes: z.string().max(2000, 'Notes too long').optional(),
    startsAt: z.date(),
    endsAt: z.date(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'End time must be after start time',
    path: ['endsAt'],
  });

export const updateSessionSchema = z.object({
  status: sessionStatusSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional(),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
});

// --- User create/update payloads ---

export const createUserSchema = z.object({
  email: z.email('Invalid email'),
  displayName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: userRoleSchema,
  status: userStatusSchema,
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.email('Invalid email'),
  status: userStatusSchema,
});

// --- Notification preference payload ---

export const savePreferenceSchema = z.object({
  uid: z.string().min(1),
  enabled: z.boolean(),
  reminderRule: reminderRuleSchema,
});
