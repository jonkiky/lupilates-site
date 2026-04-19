import { ProductVisibilityStatus } from '@prisma/client';
import { db } from '@/lib/db';

export async function listPublishedProducts(input: { search?: string; category?: string }) {
  return db.product.findMany({
    where: {
      visibilityStatus: ProductVisibilityStatus.PUBLISHED,
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' } },
              { sku: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(input.category ? { category: { slug: input.category } } : {}),
    },
    include: { category: true },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, visibilityStatus: ProductVisibilityStatus.PUBLISHED },
    include: { category: true },
  });
}

export async function listAllProducts() {
  return db.product.findMany({
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProductById(id: string) {
  return db.product.findUnique({ where: { id }, include: { category: true } });
}

export async function upsertProduct(data: {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  specsJson: Record<string, string | number | boolean>;
  imageUrls: string[];
  availabilityText: string;
  visibilityStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
}) {
  const { id, ...rest } = data;
  const payload = {
    ...rest,
    specsJson: rest.specsJson as object,
    imageUrls: rest.imageUrls as object,
  };
  if (id) {
    return db.product.update({ where: { id }, data: payload });
  }
  return db.product.create({ data: payload });
}

export async function duplicateProduct(id: string) {
  const source = await db.product.findUniqueOrThrow({ where: { id } });
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = source;
  return db.product.create({
    data: {
      ...rest,
      sku: `${rest.sku}-copy`,
      slug: `${rest.slug}-copy`,
      visibilityStatus: 'DRAFT',
      specsJson: rest.specsJson ?? {},
      imageUrls: rest.imageUrls ?? [],
    },
  });
}

export async function archiveProduct(id: string) {
  return db.product.update({ where: { id }, data: { visibilityStatus: 'ARCHIVED' } });
}

export async function listCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } });
}
