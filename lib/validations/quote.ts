import { z } from 'zod';

export const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  itemNotes: z.string().max(1000).default(''),
});

export const quoteRequestSchema = z.object({
  customerName: z.string().min(1),
  companyName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  region: z.string().min(1),
  projectNotes: z.string().max(5000).default(''),
  items: z.array(quoteItemSchema).min(1),
});
