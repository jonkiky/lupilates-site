import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/repositories/products';
import { ProductForm } from '@/components/admin/product-form';
import { cloneProduct, hideProduct } from '@/app/actions/products';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin · Products</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Edit product</h1>
        </div>
        <div className="flex gap-2">
          <form action={cloneProduct.bind(null, product.id)}>
            <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50">
              Duplicate
            </button>
          </form>
          <form action={hideProduct.bind(null, product.id)}>
            <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
              Archive
            </button>
          </form>
        </div>
      </header>
      <ProductForm
        initialValues={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description ?? '',
          categoryId: product.categoryId ?? '',
          specsJson: (product.specsJson as Record<string, unknown>) ?? {},
          imageUrls: (product.images ?? []).map((img) => img.url),
          availabilityText: product.availabilityText ?? '',
          visibilityStatus: product.visibilityStatus,
          isFeatured: product.isFeatured,
        }}
      />
    </main>
  );
}
