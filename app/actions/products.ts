'use server';

import { productSchema } from '@/lib/validations/product';
import { upsertProduct, duplicateProduct, archiveProduct } from '@/lib/repositories/products';

export async function saveProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  return upsertProduct(parsed);
}

export async function cloneProduct(id: string): Promise<void> {
  await duplicateProduct(id);
}

export async function hideProduct(id: string): Promise<void> {
  await archiveProduct(id);
}
