import { z } from 'zod';

export const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  itemNotes: z.string().max(1000).default(''),
});

export const quoteRequestSchema = z.object({
  customerName: z.string().default(''),
  companyName: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().default(''),
  region: z.string().default(''),
  projectNotes: z.string().max(5000).default(''),
  items: z.array(quoteItemSchema).min(1),
});
