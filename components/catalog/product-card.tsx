import Link from 'next/link';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  availabilityText: string;
  imageUrls: unknown;
  category: { name: string } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const images = Array.isArray(product.imageUrls) ? (product.imageUrls as string[]) : [];
  const firstImage = images[0] ?? null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {firstImage ? (
          <Image src={firstImage} alt={product.name} fill className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-300">
            <span className="text-4xl">□</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-stone-400">{product.category.name}</p>
        )}
        <h3 className="text-sm font-medium text-stone-900 group-hover:text-stone-600">{product.name}</h3>
        <p className="text-xs text-stone-500">{product.sku}</p>
        <p className="mt-auto pt-2 text-xs font-medium text-emerald-600">{product.availabilityText}</p>
      </div>
    </Link>
  );
}
