'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { quoteRequestSchema } from '@/lib/validations/quote';
import { createQuoteRequest } from '@/lib/repositories/quotes';
import { updateQuoteStatus } from '@/lib/repositories/quotes';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';

export async function submitQuoteRequest(input: unknown) {
  const parsed = quoteRequestSchema.parse(input);
  
  // Check if user is logged in
  let userId: string | undefined;
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  if (userCookie) {
    const userSession = verifyUserSessionValue(userCookie);
    if (userSession) userId = userSession.userId;
  }
  
  const quote = await createQuoteRequest(parsed, userId);
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
