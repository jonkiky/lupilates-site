'use server';

import { productSchema } from '@/lib/validations/product';
import { upsertProduct, duplicateProduct, archiveProduct } from '@/lib/repositories/products';

export async function saveProduct(input: unknown) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false as const,
      error: issue?.path?.[0] === 'categoryId' ? 'Please select a category.' : 'Please check all required fields.',
    };
  }

  const product = await upsertProduct(parsed.data);
  return { success: true as const, product };
}

export async function cloneProduct(id: string): Promise<void> {
  await duplicateProduct(id);
}

export async function hideProduct(id: string): Promise<void> {
  await archiveProduct(id);
}
