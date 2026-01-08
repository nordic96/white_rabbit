import { API_URL } from '@/app/config';
import { GraphResponse } from '@/app/types';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = API_URL;
  try {
    const res: GraphResponse = await fetch(`${apiUrl}/api/graph`).then((res) =>
      res.json(),
    );
    return NextResponse.json(res);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.error();
    }
  }
}
