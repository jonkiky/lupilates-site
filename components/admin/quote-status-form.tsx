'use client';

import { useState, type FormEvent } from 'react';
import { saveQuoteStatus } from '@/app/actions/quotes';

const STATUSES = ['NEW', 'REVIEWING', 'CONTACTED', 'QUOTED', 'CLOSED'] as const;

export function QuoteStatusForm({
  quoteId,
  currentStatus,
  currentNotes,
}: {
  quoteId: string;
  currentStatus: string;
  currentNotes: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await saveQuoteStatus({ id: quoteId, status, internalNotes: notes });
    setSaving(false);
    setSaved(true);
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500">Status &amp; notes</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Internal notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved</span>}
        </div>
      </form>
    </section>
  );
}
