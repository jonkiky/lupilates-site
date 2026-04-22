'use client';

import { useState } from 'react';
import type { User } from '@prisma/client';
import { updateUserProfileAction } from '@/app/actions/user-auth';

type ProfileFieldErrors = Partial<Record<'currentPassword' | 'newPassword' | 'phone' | 'wechat', string[]>>;

type ProfileFormProps = {
  user: Pick<User, 'id' | 'email' | 'username' | 'phone' | 'wechat' | 'passwordHash' | 'createdAt' | 'updatedAt'>;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    phone: user.phone ?? '',
    wechat: user.wechat ?? '',
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    const result = await updateUserProfileAction(formValues);

    if (result.success) {
      setSuccess('Profile updated successfully.');
      setFormValues((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
      }));
    } else {
      setError(result.error || 'Failed to update profile. Please try again.');
      setFieldErrors(result.fieldErrors ?? {});
    }

    setLoading(false);
  }

  function renderFieldError(field: keyof ProfileFieldErrors) {
    const message = fieldErrors[field]?.[0];
    if (!message) {
      return null;
    }

    return <p className="mt-1 text-sm text-red-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-stone-700">Current Password</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          value={formValues.currentPassword}
          onChange={(event) => setFormValues((current) => ({ ...current, currentPassword: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Enter your current password"
        />
        {renderFieldError('currentPassword')}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700">New Password (optional)</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={formValues.newPassword}
          onChange={(event) => setFormValues((current) => ({ ...current, newPassword: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="Leave blank to keep your current password"
        />
        {renderFieldError('newPassword')}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formValues.phone}
          onChange={(event) => setFormValues((current) => ({ ...current, phone: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="+1 (555) 000-0000"
        />
        {renderFieldError('phone')}
      </div>

      <div>
        <label htmlFor="wechat" className="block text-sm font-medium text-stone-700">WeChat (optional)</label>
        <input
          id="wechat"
          name="wechat"
          type="text"
          value={formValues.wechat}
          onChange={(event) => setFormValues((current) => ({ ...current, wechat: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          placeholder="WeChat ID"
        />
        {renderFieldError('wechat')}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-950 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Updating profile...' : 'Update Profile'}
      </button>
    </form>
  );
}