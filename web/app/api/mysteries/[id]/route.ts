import { API_URL } from '@/config';
import { MysteryDetail } from '@/types';
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
    const res = await fetch(`${API_URL}/api/mysteries/${id}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: 'Unknown error' }));

      return NextResponse.json(errorData, { status: res.status });
    }
    const data: MysteryDetail = await res.json();
    return NextResponse.json(data);
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
