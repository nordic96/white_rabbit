import { API_KEY, API_URL } from '@/config';
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
    // Fetch audio from backend using native fetch for binary data
    const backendUrl = `${API_URL}/static/audio/${filename}`;
    const response = await fetch(backendUrl, {
      headers: {
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to fetch audio from backend' },
        { status: response.status },
      );
    }

    // Get the audio buffer from the response
    const audioBuffer = await response.arrayBuffer();

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
