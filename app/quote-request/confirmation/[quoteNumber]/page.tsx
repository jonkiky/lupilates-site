import Link from 'next/link';

export default async function ConfirmationPage({ params }: { params: Promise<{ quoteNumber: string }> }) {
  const { quoteNumber } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
      <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Quote request submitted</h1>
      <p className="text-stone-600">
        Your request has been received. Our team will be in touch shortly.
      </p>
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-stone-400">Quote reference</p>
        <p className="mt-1 text-xl font-semibold text-stone-900">{quoteNumber}</p>
      </div>
      <Link href="/products" className="rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700">
        Continue browsing
      </Link>
    </main>
  );
}
