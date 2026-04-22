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
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, visibilityStatus: ProductVisibilityStatus.PUBLISHED },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function listAllProducts() {
  return db.product.findMany({
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProductById(id: string) {
  return db.product.findUnique({ where: { id }, include: { category: true, images: { orderBy: { sortOrder: 'asc' } } } });
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
  const { id, imageUrls, ...rest } = data;
  const payload = {
    ...rest,
    specsJson: rest.specsJson as object,
  };
  if (id) {
    // Replace all images: delete existing then create new ones
    await db.productImage.deleteMany({ where: { productId: id } });
    const updated = await db.product.update({ where: { id }, data: payload });
    if (imageUrls.length > 0) {
      await db.productImage.createMany({
        data: imageUrls.map((url, i) => ({ url, sortOrder: i, productId: id })),
      });
    }
    return updated;
  }
  const created = await db.product.create({ data: payload });
  if (imageUrls.length > 0) {
    await db.productImage.createMany({
      data: imageUrls.map((url, i) => ({ url, sortOrder: i, productId: created.id })),
    });
  }
  return created;
}

export async function duplicateProduct(id: string) {
  const source = await db.product.findUniqueOrThrow({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } } } });
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, images, ...rest } = source;
  const copy = await db.product.create({
    data: {
      ...rest,
      sku: `${rest.sku}-copy`,
      slug: `${rest.slug}-copy`,
      visibilityStatus: 'DRAFT',
      specsJson: rest.specsJson ?? {},
    },
  });
  if (images.length > 0) {
    await db.productImage.createMany({
      data: images.map((img) => ({ url: img.url, sortOrder: img.sortOrder, productId: copy.id })),
    });
  }
  return copy;
}

export async function archiveProduct(id: string) {
  return db.product.update({ where: { id }, data: { visibilityStatus: 'ARCHIVED' } });
}

export async function listCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } });
}
