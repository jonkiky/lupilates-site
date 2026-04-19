import { type NextRequest, NextResponse } from 'next/server';
import { uploadProductImage } from '@/lib/blob/upload';
import { verifySessionValue, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Verify admin session
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
