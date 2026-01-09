import { API_URL } from '@/config';
import { GraphResponse } from '@/types';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/graph`);
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch graph data' },
        { status: res.status },
      );
    }
    const data: GraphResponse = await res.json();
    return NextResponse.json(data as GraphResponse);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.error();
    }
  }
}
