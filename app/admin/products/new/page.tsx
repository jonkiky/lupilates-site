import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin · Products</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">New product</h1>
      </header>
      <ProductForm />
    </main>
  );
}
