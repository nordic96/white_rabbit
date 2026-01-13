import { API_URL } from '@/config';
import { TTSWarmupResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort, 5000);
  try {
    const url = new URL(`${API_URL}/api/tts/warmup`);
    const res = await fetchApi<TTSWarmupResponse>(url, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return NextResponse.json(res.data);
    }
    throw new Error(JSON.stringify(res.error));
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
}
