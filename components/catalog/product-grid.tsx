import { ProductCard } from './product-card';

type Product = Parameters<typeof ProductCard>[0]['product'];

export function ProductGrid({ products, isLoggedIn }: { products: Product[]; isLoggedIn: boolean }) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-stone-400">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}
