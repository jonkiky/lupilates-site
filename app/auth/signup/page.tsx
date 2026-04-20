import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Back to home
        </Link>
      </div>
      <div className="flex justify-center">
        <SignupForm />
      </div>
    </main>
  );
}
