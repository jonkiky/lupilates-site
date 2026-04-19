'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { submitQuoteRequest } from '@/app/actions/quotes';
import { loadCart, saveCart, createEmptyCart } from '@/lib/quote/cart-store';

export function QuoteRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const cart = loadCart();

    if (cart.items.length === 0) {
      setError('Your quote cart is empty. Add products before submitting.');
      setLoading(false);
      return;
    }

    try {
      const result = await submitQuoteRequest({
        customerName: form.get('customerName') as string,
        companyName: form.get('companyName') as string,
        email: form.get('email') as string,
        phone: form.get('phone') as string,
        region: form.get('region') as string,
        projectNotes: form.get('projectNotes') as string,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          itemNotes: item.itemNotes,
        })),
      });

      saveCart(createEmptyCart());
      router.push(`/quote-request/confirmation/${result.quoteNumber}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const inputClass = 'rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500 w-full';

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Name *</label>
          <input name="customerName" required className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Company *</label>
          <input name="companyName" required className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Email *</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Phone *</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Region *</label>
          <input name="region" required className={inputClass} />
        </div>
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-medium text-stone-600">Project notes</label>
        <textarea name="projectNotes" rows={4} className={`${inputClass} resize-none`} placeholder="Describe your project…" />
      </div>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Submit quote request'}
      </button>
    </form>
  );
}
