'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/app/actions/user-auth';

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const input = {
      email: formData.get('email'),
      username: formData.get('username'),
      phone: formData.get('phone'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const result = await signupAction(input);
    setLoading(false);

    if (result.success) {
      router.push('/user/dashboard');
    } else {
      setError(result.error || 'An error occurred during signup');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-stone-950">Create Account</h2>
      
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-stone-700">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Confirm password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-950 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign up'}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already have an account? <a href="/auth/login" className="font-medium text-stone-950 hover:underline">Log in</a>
      </p>
    </form>
  );
}
