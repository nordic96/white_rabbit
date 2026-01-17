import { API_KEY, API_URL } from '@/config';
import { SearchResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MIN_QUERY_LENGTH = 1;
const MAX_QUERY_LENGTH = 200;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limitParam = searchParams.get('limit');

  // Validate query parameter
  if (!query || query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: 'ValidationError',
        message: 'Search query (q) is required',
        status_code: 400,
      },
      { status: 400 },
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: 'ValidationError',
        message: `Search query must be at most ${MAX_QUERY_LENGTH} characters`,
        status_code: 400,
      },
      { status: 400 },
    );
  }

  // Validate limit parameter
  if (limitParam) {
    const limitNum = parseInt(limitParam, 10);
    if (isNaN(limitNum) || limitNum < MIN_LIMIT || limitNum > MAX_LIMIT) {
      return NextResponse.json(
        {
          error: 'ValidationError',
          message: `Limit must be a number between ${MIN_LIMIT} and ${MAX_LIMIT}`,
          status_code: 400,
        },
        { status: 400 },
      );
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${API_URL}/api/search`);
    url.searchParams.append('q', query);
    if (limitParam) {
      url.searchParams.append('limit', limitParam);
    }

    const res = await fetchApi<SearchResponse>(url, {
      signal: controller.signal,
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!res.ok) {
      // Propagate the actual error from the backend
      return NextResponse.json(
        {
          error: res.error.error,
          message: res.error.message,
          status_code: res.error.statusCode,
        },
        { status: res.error.statusCode || 500 },
      );
    }

    return NextResponse.json(res.data);
  } catch (error) {
    // Handle timeout/abort errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'REQUEST_TIMEOUT',
          message: 'Search request timed out',
          status_code: 504,
        },
        { status: 504 },
      );
    }

    // Handle other network errors
    return NextResponse.json(
      {
        error: 'SERVICE_UNAVAILABLE',
        message: 'Backend service is unreachable',
        status_code: 503,
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
