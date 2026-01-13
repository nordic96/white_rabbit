import { API_URL } from '@/config';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = request.body;
  try {
    const controller = new AbortController();
    const url = new URL(`${API_URL}/api/tts`);

    const res = await fetchApi(url, {
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.ok) {
      return NextResponse.json(res.data);
    } else {
      throw new Error(JSON.stringify(res.error));
    }
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
}
