import { ProductVisibilityStatus } from '@prisma/client';
import { db } from '../lib/db';

async function main() {
  // Create the three hardcoded categories
  await db.category.upsert({
    where: { id: 'general' },
    update: {},
    create: { id: 'general', name: 'General', slug: 'general' },
  });

  await db.category.upsert({
    where: { id: 'company-branding' },
    update: {},
    create: { id: 'company-branding', name: 'Company Branding', slug: 'company-branding' },
  });

  await db.category.upsert({
    where: { id: 'pets' },
    update: {},
    create: { id: 'pets', name: 'Pets', slug: 'pets' },
  });

  const category = await db.category.findFirst({ where: { slug: 'general' } });

  if (category) {
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
        availabilityText: 'Available',
        visibilityStatus: ProductVisibilityStatus.PUBLISHED,
        isFeatured: true,
      },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
