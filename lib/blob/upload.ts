import { put } from '@vercel/blob';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of 5 MB`);
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const pathname = `products/${crypto.randomUUID()}.${ext}`;
  const blob = await put(pathname, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}
