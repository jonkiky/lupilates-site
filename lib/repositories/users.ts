import { db } from '@/lib/db';

export async function createUser(input: { email: string; username: string; phone: string | null; passwordHash: string }) {
  return db.user.create({
    data: input,
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function getUserQuotes(userId: string) {
  return db.quoteRequest.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserQuoteById(quoteId: string, userId: string) {
  return db.quoteRequest.findFirst({
    where: { id: quoteId, userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
}
