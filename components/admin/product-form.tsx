'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { saveProduct, cloneProduct, hideProduct } from '@/app/actions/products';

type ProductFormProps = {
  categories: Array<{ id: string; name: string }>;
  initialValues?: {
    id?: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    specsJson: Record<string, unknown>;
    imageUrls: string[];
    availabilityText: string;
    visibilityStatus: string;
    isFeatured: boolean;
  };
};

export function ProductForm({ categories, initialValues }: ProductFormProps) {
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>(initialValues?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500 w-full';

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      setImageUrls((prev) => [...prev, url]);
    } catch {
      setError('Image upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);

    let specsJson: Record<string, unknown> = {};
    try {
      const raw = form.get('specsJson') as string;
      if (raw.trim()) specsJson = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      setError('Specs must be valid JSON.');
      setSaving(false);
      return;
    }

    try {
      await saveProduct({
        ...(initialValues?.id ? { id: initialValues.id } : {}),
        sku: form.get('sku') as string,
        name: form.get('name') as string,
        slug: form.get('slug') as string,
        description: form.get('description') as string,
        categoryId: form.get('categoryId') as string,
        specsJson,
        imageUrls,
        availabilityText: form.get('availabilityText') as string,
        visibilityStatus: form.get('visibilityStatus') as string,
        isFeatured: form.get('isFeatured') === 'on',
      });
      router.push('/admin/products');
    } catch {
      setError('Failed to save product. Check all fields.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">SKU *</label>
          <input name="sku" required defaultValue={initialValues?.sku} className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Name *</label>
          <input name="name" required defaultValue={initialValues?.name} className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Slug *</label>
          <input name="slug" required defaultValue={initialValues?.slug} className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Category</label>
          <select name="categoryId" defaultValue={initialValues?.categoryId ?? ''} className={inputClass}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-stone-600">Description</label>
          <textarea name="description" rows={3} defaultValue={initialValues?.description} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-stone-600">Specs (JSON)</label>
          <textarea
            name="specsJson"
            rows={4}
            defaultValue={JSON.stringify(initialValues?.specsJson ?? {}, null, 2)}
            className={`${inputClass} resize-none font-mono text-xs`}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Availability text</label>
          <input name="availabilityText" defaultValue={initialValues?.availabilityText} className={inputClass} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Visibility</label>
          <select name="visibilityStatus" defaultValue={initialValues?.visibilityStatus ?? 'DRAFT'} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" id="isFeatured" defaultChecked={initialValues?.isFeatured} />
          <label htmlFor="isFeatured" className="text-sm text-stone-700">Featured</label>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium text-stone-600">Product images</p>
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover border border-stone-200" />
              <button
                type="button"
                onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs"
              >×</button>
            </div>
          ))}
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50">
          {uploading ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="sr-only" disabled={uploading} />
        </label>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save product'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-full border border-stone-300 px-6 py-3 text-sm text-stone-600 hover:bg-stone-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
