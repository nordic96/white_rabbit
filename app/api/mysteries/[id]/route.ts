/* eslint-disable @typescript-eslint/no-unused-vars */
import { API_URL } from '@/app/config';
import { MysteryDetail } from '@/app/types';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/mysteries/${id}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Mystery not found' },
        { status: res.status },
      );
    }
    const data: MysteryDetail = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch mystery' },
      { status: 500 },
    );
  }
}
