import { API_URL } from '@/config';
import { TTSWarmupResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(`${API_URL}/api/tts/warmup`);
    const res = await fetchApi<TTSWarmupResponse>(url, {
      method: 'POST',
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }
    return NextResponse.json(res.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Warmup request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
