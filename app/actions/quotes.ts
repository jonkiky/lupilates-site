'use server';

import { z } from 'zod';
import { quoteRequestSchema } from '@/lib/validations/quote';
import { createQuoteRequest } from '@/lib/repositories/quotes';
import { updateQuoteStatus } from '@/lib/repositories/quotes';

export async function submitQuoteRequest(input: unknown) {
  const parsed = quoteRequestSchema.parse(input);
  const quote = await createQuoteRequest(parsed);
  return { quoteNumber: quote.quoteNumber };
}

const quoteStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['NEW', 'REVIEWING', 'CONTACTED', 'QUOTED', 'CLOSED']),
  internalNotes: z.string().max(5000),
});

export async function saveQuoteStatus(input: unknown) {
  const parsed = quoteStatusSchema.parse(input);
  return updateQuoteStatus(parsed.id, parsed.status, parsed.internalNotes);
}
