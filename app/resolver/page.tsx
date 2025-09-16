'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { engine } from '@/lib/tutorinSkills';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const PING_URL = API_BASE ? `${API_BASE.replace(/\/+$/, '')}/ping` : '';
const HERO_IMAGE = '/tutorin.png';

type Msg = { role: 'user' | 'tutorin'; text: string; at?: number };
type GradeBand = '1-2' | '3-4' | '5-6' | 'ESO';

/* ===== Color utils ===== */
const clamp = (n: number, min = 0, max = 255) => Math.max(min, Math.min(max, n));
const toHex = (n: number) => n.toString(16).padStart(2, '0');
const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;
const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
};
const luminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const pickText = (r: number, g: number, b: number) => (luminance(r, g, b) > 0.5 ? '#111827' : '#ffffff');
const mix = (hex1: string, hex2: string, t: number) => {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const r = clamp(Math.round(a.r * (1 - t) + b.r * t));
  const g = clamp(Math.round(a.g * (1 - t) + b.g * t));
  const b2 = clamp(Math.round(a.b * (1 - t) + b.b * t));
  return rgbToHex(r, g, b2);
};
async function getDominantColorFromImage(src: string): Promise<{ hex: string; rgb: [number, number, number] } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const w = 64, h = 64;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, c = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2], A = data[i + 3];
          if (A < 200) continue;
          if (R > 240 && G > 240 && B > 240) continue;
          r += R; g += G; b += B; c++;
        }
        if (c === 0) return resolve(null);
        r = Math.round(r / c); g = Math.round(g / c); b = Math.round(b / c);
        resolve({ hex: rgbToHex(r, g, b), rgb: [r, g, b] });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
}

/* ===== Chat/voz utils ===== */
const stripEmojis = (s: string) => s.replace(/\p{Extended_Pictographic}/gu, '');
const fmtTime = (t?: number) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
type Palette = { brand: string; contrast: string; surface: string; surfaceStrong: string; hover: string; shadow: string; gradTop: string; };
const DEFAULT_PALETTE: Palette = {
  brand: '#2563eb', contrast: '#ffffff', surface: '#eef2ff', surfaceStrong: '#e0e7ff', hover: '#1e40af', shadow: 'rgba(0,0,0,.18)', gradTop: '#f8fafc',
};

const SKILL_NAME: Record<string, string> = {
  'frac-addsub-diff': 'Fracciones ± (denom. distinto)',
  'frac-addsub-same': 'Fracciones ± (mismo denom.)',
  'frac-mul': 'Multiplicación de fracciones',
  'frac-div': 'División de fracciones',
  'decimals': 'Decimales',
  'integers': 'Enteros',
  'mcm-mcd': 'm.c.m. / m.c.d.',
  'powers': 'Potencias',
  'order-ops': 'Jerarquía de operaciones',
  'units': 'Unidades',
  'geometry': 'Área/Perímetro/Volumen',
  'stats': 'Media/Mediana/Moda',
  'round': 'Redondeo',
  'acentuacion': 'Acentuación',
  'suj-pred': 'Sujeto/Predicado',
  'lexico': 'Sinónimos/Antónimos',
  'matter': 'Estados de la materia',
  'circuit': 'Circuito eléctrico',
  'planets': 'Planetas',
  'bio': 'Ecosistemas',
  'century': 'Siglos',
  'roman': 'Números romanos',
  'timeline': 'Línea temporal',
  'capitals': 'Países/Capitales/Continentes',
};

function Bubble({ role, children, time, palette }: { role: 'user' | 'tutorin'; children: React.ReactNode; time?: string; palette: Palette }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div aria-hidden style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: palette.brand, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
          <Image src={HERO_IMAGE} alt="Tutorín" width={36} height={36} style={{ objectFit: 'cover' }} />
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          borderRadius: 14,
          padding: '10px 12px',
          background: isUser ? palette.brand : palette.surface,
          color: isUser ? palette.contrast : '#111827',
          boxShadow: isUser ? `0 2px 10px ${palette.shadow}` : '0 2px 6px rgba(0,0,0,.06)',
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{children}</div>
        {time && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, textAlign: isUser ? 'right' : 'left' }}>{time}</div>}
      </div>
      {isUser && (
        <div aria-hidden style={{ width: 36, height: 36, borderRadius: '50%', background: palette.surface, color: '#1f2937', display: 'grid', placeItems: 'center', fontSize: 18, flex: '0 0 auto', border: '1px solid #e5e7eb' }}>👤</div>
      )}
    </div>
  );
}

function Typing({ palette }: { palette: Palette }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, background: palette.surface, borderRadius: 999, padding: '6px 10px', color: '#111827' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: 'b 1.2s infinite' }} />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: 'b 1.2s .15s infinite' }} />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: 'b 1.2s .3s infinite' }} />
      <style>{`@keyframes b{0%{opacity:.3; transform:translateY(0)}50%{opacity:1; transform:translateY(-2px)}100%{opacity:.3; transform:translateY(0)}}`}</style>
    </div>
  );
}

const EXAMPLES = ['2/3 + 4 octavos', '5/6 - 1/3', '¿siglo de 1492?', 'capital de Italia', 'área rectángulo 5x7', 'media de 3, 7, 7, 10', 'sinónimo de feliz'];

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [localState, setLocalState] = useState<any>(null);

  // Contador de pistas
  const [hints, setHints] = useState(0);

  // Modo Clase
  const [classMode, setClassMode] = useState(false);

  // Voz
  const speakingRef = useRef(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const canSTT = useMemo(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition), []);

  const [grade] = useState<GradeBand>('5-6');

  // Paleta
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);

  useEffect(() => {
    let alive = true;
    if (typeof window === 'undefined') return;
    getDominantColorFromImage(HERO_IMAGE).then((res) => {
      if (!alive || !res) return;
      const [r, g, b] = res.rgb;
      const brand = res.hex;
      const contrast = pickText(r, g, b);
      const surface = mix(brand, '#ffffff', 0.88);
      const surfaceStrong = mix(brand, '#ffffff', 0.82);
      const hover = mix(brand, '#000000', 0.18);
      const shadow = 'rgba(0,0,0,.18)';
      const gradTop = mix(brand, '#ffffff', 0.94);
      setPalette({ brand, contrast, surface, surfaceStrong, hover, shadow, gradTop });
    });
    return () => { alive = false; };
  }, []);

  // Healthcheck
  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (!PING_URL) return setApiOk(null);
      try { const r = await fetch(PING_URL, { cache: 'no-store' }); if (!alive) return; setApiOk(r.ok); }
      catch { if (!alive) return; setApiOk(false); }
    };
    check();
    const id = setInterval(check, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // STT
  useEffect(() => {
    if (!canSTT || recRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'es-ES'; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e: any) => { const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' '); setInput((prev) => (prev ? prev + ' ' : '') + transcript); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [canSTT]);

  // TTS
  const speak = (text: string) => {
    const clean = stripEmojis(text);
    try {
      if (!(window as any).speechSynthesis) return;
      (window as any).speechSynthesis.cancel();
      speakingRef.current = true;
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES'; u.onend = () => (speakingRef.current = false);
      (window as any).speechSynthesis.speak(u);
    } catch {}
  };
  const stopSpeak = () => { try { (window as any).speechSynthesis?.cancel(); } catch {} speakingRef.current = false; };

  // Bienvenida
  useEffect(() => {
    if (messages.length === 0) {
      const hello = '¡Hola! Soy Tutorín. Escribe tu ejercicio o elige un ejemplo para empezar.';
      setMessages([{ role: 'tutorin', text: hello, at: Date.now() }]);
    }
  }, [messages.length]);

  const pushMsg = (role: Msg['role'], text: string) => setMessages((m) => [...m, { role, text, at: Date.now() }]);

  const onSend = async () => {
    const q = input.trim();
    if (!q || sending) return;

    setInput('');
    stopSpeak();
    setSending(true);
    setThinking(true);

    pushMsg('user', q);

    try {
      // 1) Continuar sesión local
      if (localState) {
        const prevSkill = localState?.skillId;
        const turn = engine.continue(localState, q);
        pushMsg('tutorin', turn.text);
        speak(turn.text);

        if (turn.type === 'ask') {
          setLocalState(turn.state);
          setHints((h) => h + 1); // sumamos pista mostrada
        } else {
          // Turno final: dispara evento de analítica
          if ((turn as any).done && (window as any).plausible) {
            (window as any).plausible('skill_solved', { props: { skill: prevSkill, hints } });
          }
          setLocalState(null);
        }
        return;
      }

      // 2) Intentar rutear a una skill local (primer paso)
      const routed = engine.route(q, { grade });
      if (routed) {
        pushMsg('tutorin', routed.text);
        speak(routed.text);
        setLocalState(routed.state);
        setHints(1); // primera pista
        return;
      }

      // 3) Fallback al backend (no cuenta como pista guiada)
      const history = messages.slice(-10);
      const res = await fetch('/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, grade, history }) });
      const raw = await res.text();
      let answer = raw;
      try { const parsed = JSON.parse(raw); answer = typeof parsed === 'string' ? parsed : parsed?.message ?? parsed?.text ?? raw; } catch {}
      pushMsg('tutorin', String(answer));
      speak(String(answer));
    } catch {
      const msg = 'Ups, hoy estoy un poco dormido. ¿Puedes repetirlo?';
      pushMsg('tutorin', msg);
      speak(msg);
    } finally {
      setSending(false);
      setThinking(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') onSend(); if (e.key === 'Escape') stopSpeak(); };
  const toggleListen = () => {
    const rec = recRef.current; if (!rec) return;
    if (listening) { try { rec.stop(); } catch {} setListening(false); }
    else { try { setListening(true); rec.start(); } catch {} }
  };
  const clearChat = () => {
    stopSpeak();
    setMessages([{ role: 'tutorin', text: '¡Chat limpio! ¿Qué hacemos ahora? 😊', at: Date.now() }]);
    setLocalState(null);
    setHints(0);
  };

  const skillBadge = localState?.skillId ? (
    <span title={localState.skillId} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: palette.surface, color: '#111827', border: `1px solid ${palette.surfaceStrong}`, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>
      <span>🔎 {SKILL_NAME[localState.skillId] || 'Actividad'}</span>
      <span style={{ opacity: 0.6 }}>Paso {typeof localState.stepIndex === 'number' ? localState.stepIndex + 1 : 1}</span>
    </span>
  ) : null;

  const fontSize = classMode ? 18 : 16;
  const chatHeight = classMode ? '68vh' : '58vh';

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${palette.gradTop}, #fff)` }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16, fontSize }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div aria-hidden style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', boxShadow: `0 6px 14px ${palette.shadow}`, border: `1px solid ${palette.surfaceStrong}` }}>
              <Image src={HERO_IMAGE} alt="Tutorín" width={44} height={44} style={{ objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, margin: 0, color: '#111827' }}>Tutorín · Resolver</h1>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {skillBadge}

            {/* Contador de pistas */}
            <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: palette.surface, color: '#111', border: `1px solid ${palette.surfaceStrong}`, fontSize: 12 }}>
              Pistas: {hints}
            </span>

            {/* Modo Clase */}
            <button
              onClick={() => setClassMode((v) => !v)}
              style={{ padding: '8px 12px', borderRadius: 10, background: palette.surface, border: `1px solid ${palette.surfaceStrong}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#111827' }}
              title="Optimiza para proyectar en clase"
            >
              {classMode ? '👩‍🏫 Modo Clase: ON' : '👩‍🏫 Modo Clase'}
            </button>

            {/* API */}
            <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: palette.surface, color: '#111', border: `1px solid ${palette.surfaceStrong}`, fontSize: 12 }} title={PING_URL || 'sin URL pública'}>
              API: {apiOk === null ? '—' : apiOk ? 'OK' : 'caída'}
            </span>

            <button onClick={clearChat} style={{ padding: '8px 12px', borderRadius: 10, background: palette.surface, border: `1px solid ${palette.surfaceStrong}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#111827' }}>
              Limpiar
            </button>
          </div>
        </header>

        {/* Ejemplos */}
        {!classMode && (
          <section aria-label="Ejemplos" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setInput(ex)} style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${palette.surfaceStrong}`, background: '#ffffff', cursor: 'pointer', fontSize: 13, color: '#111827' }} title="Usar este ejemplo">
                {ex}
              </button>
            ))}
          </section>
        )}

        {/* Chat */}
        <section aria-live="polite" aria-label="Conversación" style={{ border: `1px solid ${palette.surfaceStrong}`, borderRadius: 16, height: chatHeight, overflow: 'auto', padding: 12, background: 'white' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} time={fmtTime(m.at)} palette={palette}>
                {m.text}
              </Bubble>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Typing palette={palette} />
              </div>
            )}
          </div>
        </section>

        {/* Input (oculto en Modo Clase) */}
        {!classMode && (
          <section style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.0), #fff 40%)', paddingTop: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu ejercicio y pulsa Enter"
                style={{ padding: '14px 14px', borderRadius: 12, border: `1px solid ${palette.surfaceStrong}`, outline: 'none', fontSize: 16, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
              />
              <button
                onClick={toggleListen}
                title="Hablar"
                style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${palette.surfaceStrong}`, background: listening ? palette.surfaceStrong : palette.surface, cursor: 'pointer', fontWeight: 600, color: '#111827' }}
              >
                {listening ? '🎙️ Escuchando…' : '🎤 Hablar'}
              </button>
              <button
                onClick={onSend}
                disabled={sending}
                style={{ padding: '12px 18px', borderRadius: 12, background: sending ? mix(palette.brand, '#ffffff', 0.4) : palette.brand, color: palette.contrast, border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: `0 6px 16px ${palette.shadow}` }}
              >
                Enviar
              </button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>Sugerencia: pulsa <b>Esc</b> para parar la lectura de voz. El lector ignora emojis.</p>
          </section>
        )}
      </div>
    </main>
  );
}
