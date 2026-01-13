import { API_URL } from '@/config';
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
    const response = await fetch(backendUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Audio not found' },
        { status: response.status },
      );
    }

    // Stream the audio back to client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: 500 },
      );
    }
  }
}
