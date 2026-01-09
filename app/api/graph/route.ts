import { API_URL } from '@/app/config';
import { GraphResponse } from '@/app/types';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/graph`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData);
    }
    const data: GraphResponse = await res.json();
    return NextResponse.json(data as GraphResponse);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.error();
    }
  }
}
