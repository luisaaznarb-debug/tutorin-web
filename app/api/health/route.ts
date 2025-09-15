// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const path = process.env.NEXT_PUBLIC_BACKEND_HEALTH_PATH || '/ping';
    const url = `${base.replace(/\/$/, '')}${path}`;

    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text();

    return new NextResponse(text, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 'down', message: String(e?.message || e) },
      { status: 500 },
    );
  }
}
