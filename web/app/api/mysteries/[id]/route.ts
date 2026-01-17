import { API_KEY, API_URL } from '@/config';
import { MysteryDetail } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Validate input
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid mystery ID' }, { status: 400 });
  }

  // Set up timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetchApi<MysteryDetail>(
      `${API_URL}/api/mysteries/${id}`,
      {
        signal: controller.signal,
        headers: {
          'X-API-Key': API_KEY,
        },
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(res.error, { status: res.error.statusCode });
    }
    return NextResponse.json(res.data);
  } catch (e) {
    clearTimeout(timeoutId);

    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch mystery' },
      { status: 500 },
    );
  }
}
