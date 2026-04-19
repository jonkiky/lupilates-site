import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold text-stone-950">
            Admin
          </Link>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <Link href="/admin/quotes" className="hover:text-stone-900">Quotes</Link>
            <Link href="/admin/products" className="hover:text-stone-900">Products</Link>
            <Link href="/" className="hover:text-stone-900">View site</Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
