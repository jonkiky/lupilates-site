'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { loginAdmin } from '@/app/actions/admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await loginAdmin({ username: form.get('username'), password: form.get('password') });
    if (result.success) {
      router.push('/admin');
    } else {
      setError('Invalid username or password.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10 sm:px-6">
      <form onSubmit={handleSubmit} className="grid w-full gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">Admin login</h1>
        <input name="username" placeholder="Username" required className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500" />
        <input name="password" type="password" placeholder="Password" required className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500" />
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
