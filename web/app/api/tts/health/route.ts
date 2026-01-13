import { API_URL } from '@/config';
import { TTSHealthResponse } from '@/types';
import { fetchApi } from '@/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const url = new URL(`${API_URL}/api/tts/health`);
    const res = await fetchApi<TTSHealthResponse>(url, {
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
    if (e instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch TTS server health' },
        { status: 500 },
      );
    }
  }
}
