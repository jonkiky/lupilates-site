'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { saveProduct, cloneProduct, hideProduct } from '@/app/actions/products';

function toAutoSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateRandomSKU(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

const CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'company-branding', name: 'Company Branding' },
  { id: 'pets', name: 'Pets' },
];

type ProductFormProps = {
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

export function ProductForm({ initialValues }: ProductFormProps) {
  const router = useRouter();
  const isNewProduct = !initialValues?.id;
  const [imageUrls, setImageUrls] = useState<string[]>(initialValues?.imageUrls ?? []);
  const [nameValue, setNameValue] = useState(initialValues?.name ?? '');
  const [slugValue, setSlugValue] = useState(initialValues?.slug ?? '');
  const [skuValue, setSkuValue] = useState(initialValues?.sku ?? (isNewProduct ? generateRandomSKU() : ''));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-500 w-full';

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrls.length >= 8) {
      setError('Maximum 8 images allowed.');
      return;
    }
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

  function handleNameChange(nextName: string) {
    setNameValue(nextName);

    if (!isNewProduct) {
      return;
    }

    const generatedSlug = toAutoSlug(nextName);
    setSlugValue(generatedSlug);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      const result = await saveProduct({
        ...(initialValues?.id ? { id: initialValues.id } : {}),
        sku: form.get('sku') as string,
        name: form.get('name') as string,
        slug: form.get('slug') as string,
        description: form.get('description') as string,
        categoryId: form.get('categoryId') as string,
        specsJson: {},
        imageUrls,
        availabilityText: 'Available',
        visibilityStatus: form.get('visibilityStatus') as string,
        isFeatured: form.get('isFeatured') === 'on',
      });

      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }

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
          <input
            name="sku"
            required
            value={skuValue}
            onChange={(e) => setSkuValue(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Name *</label>
          <input
            name="name"
            required
            value={nameValue}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Slug *</label>
          <input
            name="slug"
            required
            value={slugValue}
            onChange={(e) => setSlugValue(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-stone-600">Category *</label>
          <select name="categoryId" required defaultValue={initialValues?.categoryId ?? ''} className={inputClass}>
            <option value="" disabled>— select category —</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-stone-600">Description</label>
          <textarea name="description" rows={3} defaultValue={initialValues?.description} className={`${inputClass} resize-none`} />
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
        <label className={`flex w-fit cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 ${imageUrls.length >= 8 ? 'opacity-40 cursor-not-allowed' : ''}`}>
          {uploading ? 'Uploading…' : imageUrls.length >= 8 ? 'Max 8 images reached' : 'Upload image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="sr-only" disabled={uploading || imageUrls.length >= 8} />
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
