import { ProductVisibilityStatus } from '@prisma/client';
import { db } from '../lib/db';

async function main() {
  const category = await db.category.upsert({
    where: { slug: 'industrial-parts' },
    update: {},
    create: { name: 'Industrial Parts', slug: 'industrial-parts' },
  });

  await db.product.upsert({
    where: { sku: 'PRINT-001' },
    update: {},
    create: {
      sku: 'PRINT-001',
      name: 'Precision Nylon Bracket',
      slug: 'precision-nylon-bracket',
      description: 'Durable nylon bracket for commercial equipment.',
      categoryId: category.id,
      specsJson: { material: 'Nylon', finish: 'Matte' },
      imageUrls: [],
      availabilityText: 'Available',
      visibilityStatus: ProductVisibilityStatus.PUBLISHED,
      isFeatured: true,
    },
  });
}

main().finally(() => db.$disconnect());
