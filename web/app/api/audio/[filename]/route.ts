import { API_URL } from '@/config';
import { fetchApi } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Validate filename format (hash + .wav extension)
  if (!/^[a-f0-9]+\.wav$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    // Fetch audio from backend
    const backendUrl = `${API_URL}/static/audio/${filename}`;
    const response = await fetchApi(backendUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: response.error },
        { status: response.error.statusCode },
      );
    }

    // Stream the audio back to client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioBuffer = (response.data as any).arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch audio' },
      { status: 500 },
    );
  }
}
