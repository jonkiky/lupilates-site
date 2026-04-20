import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
