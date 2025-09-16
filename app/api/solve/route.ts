import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, grade, history } = await req.json();

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const path = process.env.NEXT_PUBLIC_BACKEND_SOLVE_PATH || '/chat';
    const url = `${base}${path}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, grade, history }),
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 'error', code: 500, message: String(e?.message || e) },
      { status: 500 },
    );
  }
}
