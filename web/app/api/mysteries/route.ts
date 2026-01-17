import { API_URL } from '@/config';
import { ApiMysteryListResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category_id');
  const location = request.nextUrl.searchParams.get('location_id');
  const timeperiod = request.nextUrl.searchParams.get('time_period_id');

  // Set up timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${API_URL}/api/mysteries`);
    if (category) url.searchParams.append('category_id', category);
    if (location) url.searchParams.append('location_id', location);
    if (timeperiod) url.searchParams.append('time_period_id', timeperiod);

    const res = await fetchApi<ApiMysteryListResponse>(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return NextResponse.json(res.data);
    } else {
      throw new Error(JSON.stringify(res.error));
    }
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
