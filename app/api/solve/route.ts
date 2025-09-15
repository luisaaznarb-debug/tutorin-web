// app/api/solve/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  // Preflight CORS (algunos navegadores lo lanzan)
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const base =
      process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const path =
      process.env.NEXT_PUBLIC_BACKEND_CHAT_PATH ||
      process.env.NEXT_PUBLIC_BACKEND_SOLVE_PATH ||
      '/chat';

    const url = `${base.replace(/\/$/, '')}${path}`;

    // Acepta ambos nombres desde el front
    const incoming = await req.json();
    const { message, question, grade, history } = incoming ?? {};

    // Mapeo robusto → la API espera "message"
    const payload = {
      message: message ?? question ?? '',
      grade,
      history,
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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