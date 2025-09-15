"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* ========================= KaTeX helpers ========================= */

function autoLatex(text: string): string {
  const frac = text.replace(
    /(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g,
    (_, a, b) => `\\frac{${a}}{${b}}`
  );
  const exp = frac.replace(/(\w)\^(\d+)/g, (_, x, n) => `${x}^{${n}}`);
  const times = exp.replace(/\*/g, '\\cdot ');
  return times;
}

function renderWithMath(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const blockSplit = text.split(/\$\$([^$]+)\$\$/g);
  blockSplit.forEach((bp, i) => {
    if (i % 2 === 1) {
      out.push(<BlockMath key={`b-${i}`} math={autoLatex(bp.trim())} />);
    } else {
      const inlineSplit = bp.split(/\$([^$]+)\$/g);
      inlineSplit.forEach((ip, j) => {
        if (j % 2 === 1) out.push(<InlineMath key={`i-${i}-${j}`} math={autoLatex(ip.trim())} />);
        else if (ip) out.push(<span key={`t-${i}-${j}`}>{ip}</span>);
      });
    }
  });
  return out;
}

/* ========================= Speech helpers ========================= */

// Evitamos tipar contra SpeechRecognition para no romper la build
type SR = (any & { _restarts?: number }) | null;

function getSpeechRecognition(): SR {
  if (typeof window === 'undefined') return null;
  const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/* ========================= Tipos de chat ========================= */

type Role = 'user' | 'assistant';
type ChatMessage = { role: Role; text: string };
type Step = { text: string; imageUrl?: string | null };
type ChatResponse = { steps?: Step[]; reply?: string | null };

function toHistory(messages: ChatMessage[]) {
  return messages.map(m => ({ role: m.role, text: m.text }));
}

/* ========================= Página ========================= */

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [autoVoice, setAutoVoice] = useState(true);
  const [micOn, setMicOn] = useState(false);

  const startedOnce = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // SR y control de eco
  const srRef = useRef<SR>(null);
  const speakingRef = useRef(false);            // Tutorín está hablando ahora
  const speakFenceUntil = useRef<number>(0);    // No aceptar micro hasta este timestamp

  // --------------------- TTS con pausa de micro ---------------------
  function speak(text: string, lang = 'es-ES') {
    if (typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 1;

      u.onstart = () => {
        speakingRef.current = true;
        try { (srRef.current as any)?.stop?.(); } catch {}
      };

      u.onend = () => {
        speakingRef.current = false;
        speakFenceUntil.current = Date.now() + 800;
        if (micOn) {
          try { (srRef.current as any)?.start?.(); } catch {}
        }
      };

      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  }

  // --------------------- Auto-scroll ---------------------
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // --------------------- Mic: arranque/paro ---------------------
  useEffect(() => {
    if (!micOn) {
      try { (srRef.current as any)?.stop?.(); } catch {}
      return;
    }
    if (!startedOnce.current) return;

    if (!srRef.current) {
      const sr = getSpeechRecognition();
      if (sr) {
        sr.lang = 'es-ES';
        sr.interimResults = false;
        sr.continuous = false;

        sr.onresult = (e: any) => {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          const now = Date.now();

          if (now < speakFenceUntil.current) return;
          if (speakingRef.current) return;

          const lastA = [...messages].reverse().find(m => m.role === 'assistant')?.text?.toLowerCase() || '';
          const t = transcript.toLowerCase().trim();
          if (lastA && t && lastA.slice(0, 35) === t.slice(0, 35)) {
            return; // anti-eco
          }

          if (t) {
            setInput(t);
            setTimeout(() => handleSend(t), 150);
          }
        };

        sr.onerror = () => {
          sr._restarts = (sr._restarts || 0) + 1;
          if (sr._restarts < 2) {
            try { sr.stop(); sr.start(); } catch {}
          }
        };

        sr.onend = () => {
          if (micOn && !speakingRef.current) {
            try { sr.start(); } catch {}
          }
        };

        srRef.current = sr as SR;
      }
    }

    try { (srRef.current as any)?.start?.(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn, messages]);

  // --------------------- Voz automática ---------------------
  useEffect(() => {
    if (!autoVoice) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (last?.text) {
      const plain = last.text.replace(/\$\$?[^$]+\$?\$/g, '');
      speak(plain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, autoVoice]);

  // --------------------- Envío ---------------------
  async function handleSend(forced?: string) {
    const userText = (forced ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          grade: 'Primaria',
          history: toHistory(messages),
        }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Ups… no pude responder. HTTP ${res.status}` }]);
      } else {
        const data = (await res.json()) as ChatResponse;
        if (data.steps?.length) {
          setMessages(prev => [...prev, ...data.steps!.map(s => ({ role: 'assistant' as Role, text: s.text }))]);
        } else if (data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', text: 'No pude generar pistas esta vez.' }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error de red. Inténtalo de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  function primeAudio() {
    startedOnce.current = true;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-24">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tutorín</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoVoice} onChange={e => setAutoVoice(e.target.checked)} />
              Voz auto
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={micOn}
                onChange={e => {
                  primeAudio();
                  setMicOn(e.target.checked);
                }}
              />
              Micrófono
            </label>
          </div>
        </header>

        <p className="text-sm text-green-600 mb-4">
          Estado API: <strong>OK</strong> ✅
        </p>

        <div
          ref={listRef}
          className="w-full border rounded-xl bg-slate-50 overflow-y-auto p-4 space-y-4"
          style={{ height: 480 }}
          onClick={primeAudio}
        >
          {messages.length === 0 && (
            <div className="text-slate-500 text-sm">
              Escribe tu ejercicio (ej.: <em>¿cuánto es 2/3 + 3/8?</em>) o usa el micrófono.
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] p-3 rounded-2xl ${
                m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border'
              }`}
            >
              <div className="prose prose-slate max-w-none">{renderWithMath(m.text)}</div>
            </div>
          ))}

          {loading && (
            <div className="mr-auto bg-white border p-3 rounded-2xl text-slate-500">Pensando…</div>
          )}
        </div>

        <form
          className="mt-4 flex gap-3"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            className="flex-1 border rounded-xl px-4 py-3 outline-none"
            placeholder="Habla con el micro o escribe aquí y pulsa Enter"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={primeAudio}
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-60"
            disabled={loading}
            onClick={primeAudio}
          >
            Enviar
          </button>
        </form>

        <p className="mt-2 text-xs text-slate-500">
          Consejo: usa auriculares o baja el volumen si activas micrófono y voz automática.
        </p>
      </div>
    </main>
  );
}
