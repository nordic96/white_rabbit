import { API_URL } from '@/config';
import { SearchResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = searchParams.get('limit');

  if (!query) {
    return NextResponse.json(
      {
        error: 'ValidationError',
        message: 'Search query (q) is required',
        status_code: 400,
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${API_URL}/api/search`);
    url.searchParams.append('q', query);
    if (limit) {
      url.searchParams.append('limit', limit);
    }

    const res = await fetchApi<SearchResponse>(url, {
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'NetworkError',
          message: 'Failed to fetch search results',
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
        message: 'Failed to fetch search results',
        status_code: 500,
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
