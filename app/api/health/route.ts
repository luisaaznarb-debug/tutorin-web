import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const path = process.env.NEXT_PUBLIC_BACKEND_HEALTH_PATH || '/ping';

    if (!base) {
      // Si no hay backend público configurado, devolvemos OK local
      return NextResponse.json({ ok: true, source: 'local' }, { status: 200 });
    }

    const r = await fetch(`${base}${path}`, { cache: 'no-store' });
    const text = await r.text();

    return new NextResponse(text, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
