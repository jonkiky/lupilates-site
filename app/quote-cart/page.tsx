import { QuoteCartClient } from '@/components/quote/quote-cart-client';

export default function QuoteCartPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Quote cart</h1>
      <p className="mt-2 text-sm text-stone-600">Adjust quantities, add item notes, and submit your request.</p>
      <QuoteCartClient />
    </main>
  );
}
