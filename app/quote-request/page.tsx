import { QuoteRequestForm } from '@/components/quote/quote-request-form';

export default function QuoteRequestPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-2 grid gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Step 2 of 2</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Your details</h1>
        <p className="text-sm text-stone-600">Fill in your contact and project information.</p>
      </header>
      <QuoteRequestForm />
    </main>
  );
}
