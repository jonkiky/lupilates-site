import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getPublishedProductBySlug } from '@/lib/repositories/products';
import { getUserById } from '@/lib/repositories/users';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { ProductDetail } from '@/components/catalog/product-detail';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  let user = null;
  if (session) {
    const dbUser = await getUserById(session.userId);
    if (dbUser) {
      user = { userId: dbUser.id, email: dbUser.email, username: dbUser.username };
    }
  }

  return <ProductDetail product={product} user={user} />;
}
