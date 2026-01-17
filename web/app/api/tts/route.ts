import { API_KEY, API_URL } from '@/config';
import { TTSResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = new URL(`${API_URL}/api/tts`);

    const res = await fetchApi<TTSResponse>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    const data = res.data;
    // Transform backend URL to proxied URL
    if (data.audio_url) {
      data.audio_url = data.audio_url.replace('/static/audio/', '/api/audio/');
    }
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
