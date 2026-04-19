import { notFound } from 'next/navigation';
import { getPublishedProductBySlug } from '@/lib/repositories/products';
import { ProductDetail } from '@/components/catalog/product-detail';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
