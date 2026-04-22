'use client';

import Link from 'next/link';

type LoginRecommendationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
};

export function LoginRecommendationModal({
  isOpen,
  onClose,
  onContinueAsGuest,
}: LoginRecommendationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-stone-950">Sign in to continue</h2>
        <p className="mt-2 text-sm text-stone-600">
          Create an account or sign in to easily manage your orders and track quote requests.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg bg-stone-950 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Sign in to your account
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border border-stone-300 px-4 py-3 text-center text-sm font-medium text-stone-950 transition hover:bg-stone-50"
          >
            Create a new account
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 border-t border-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs text-stone-600">
            Continue adding items to your cart as a guest. You can log in anytime to save your progress.
          </p>
          <button
            onClick={() => {
              onContinueAsGuest();
              onClose();
            }}
            className="rounded-lg bg-stone-100 px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-200"
          >
            Continue as guest
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-stone-500 transition hover:text-stone-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
