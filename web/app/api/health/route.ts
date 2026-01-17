import { API_KEY, API_URL } from '@/config';
import { DBHealthResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${API_URL}/health`);
    const res = await fetchApi<DBHealthResponse>(url, {
      signal: controller.signal,
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'NetworkError',
          message: 'Failed to fetch database health',
          status_code: 500,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(res.data);
  } catch {
    return NextResponse.json(
      {
        error: 'NetworkError',
        message: 'Failed to fetch database health',
        status_code: 500,
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
