import { db } from '@/lib/db';

export async function createQuoteRequest(input: {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  region: string;
  projectNotes: string;
  items: Array<{ productId: string; quantity: number; itemNotes: string }>;
}) {
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) } } });
  const quoteNumber = `Q-${Date.now()}`;

  return db.$transaction(async (tx) => {
    return tx.quoteRequest.create({
      data: {
        quoteNumber,
        customerName: input.customerName,
        companyName: input.companyName,
        email: input.email,
        phone: input.phone,
        region: input.region,
        projectNotes: input.projectNotes,
        items: {
          create: input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) throw new Error(`Product not found: ${item.productId}`);
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              skuSnapshot: product.sku,
              quantity: item.quantity,
              itemNotes: item.itemNotes,
            };
          }),
        },
      },
      include: { items: true },
    });
  });
}

export async function listQuotes() {
  return db.quoteRequest.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuoteById(id: string) {
  return db.quoteRequest.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
}

export async function updateQuoteStatus(
  id: string,
  status: 'NEW' | 'REVIEWING' | 'CONTACTED' | 'QUOTED' | 'CLOSED',
  internalNotes: string,
) {
  return db.quoteRequest.update({ where: { id }, data: { status, internalNotes } });
}
