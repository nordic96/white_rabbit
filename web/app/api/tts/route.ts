import { API_URL } from '@/config';
import { TTSResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const controller = new AbortController();
    const url = new URL(`${API_URL}/api/tts`);

    const res = await fetchApi<TTSResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.ok) {
      const data = res.data;
      // Transform backend URL to proxied URL
      if (data.audio_url) {
        data.audio_url = data.audio_url.replace(
          '/static/audio/',
          '/api/audio/',
        );
      }
      return NextResponse.json(data);
    } else {
      throw new Error(JSON.stringify(res.error));
    }
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
}
