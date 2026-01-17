import { API_URL } from '@/config';
import { GraphResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetchApi<GraphResponse>(`${API_URL}/api/graph`);
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
