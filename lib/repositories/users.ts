import { db } from '@/lib/db';

export async function createUser(input: {
  email: string;
  username: string;
  phone: string | null;
  wechat: string | null;
  passwordHash: string;
}) {
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

export async function cancelUserQuoteById(quoteId: string, userId: string) {
  const result = await db.quoteRequest.updateMany({
    where: {
      id: quoteId,
      userId,
      status: { not: 'CLOSED' },
    },
    data: {
      status: 'CLOSED',
    },
  });

  return result.count > 0;
}

export async function updateUser(
  userId: string,
  data: {
    phone?: string | null;
    wechat?: string | null;
    passwordHash?: string;
  },
) {
  return db.user.update({
    where: { id: userId },
    data: {
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.wechat !== undefined ? { wechat: data.wechat } : {}),
      ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
    },
  });
}
