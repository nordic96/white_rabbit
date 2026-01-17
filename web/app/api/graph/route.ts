import { API_KEY, API_URL } from '@/config';
import { GraphResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = API_URL;
  try {
    const res = await fetchApi<GraphResponse>(`${apiUrl}/api/graph`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: res.error.message || 'Failed to fetch graph data' },
        { status: res.error.statusCode },
      );
    }
    return NextResponse.json(res.data);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.error();
    }
  }
}
