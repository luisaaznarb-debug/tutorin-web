'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* =========================================================
   Utilidades de KaTeX
   ========================================================= */

function autoLatex(text: string): string {
  // Fracciones a \frac{a}{b} (evita fechas tipo 12/09/2025)
  const frac = text.replace(
    /(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g,
    (_, a, b) => `\\frac{${a}}{${b}}`
  );
  // x^2 -> x^{2}
  const exp = frac.replace(/(\w)\^(\d+)/g, (_, x, n) => `${x}^{${n}}`);
  // * a \cdot
  const times = exp.replace(/\*/g, '\\cdot ');
  return times;
}

// Convierte texto con $…$ (inline) y $$…$$ (bloque) a React nodes con KaTeX
function renderWithMath(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Separar por bloques $$…$$
  const blockSplit = text.split(/\$\$([^$]+)\$\$/g);
  blockSplit.forEach((bp, i) => {
    if (i % 2 === 1) {
      out.push(<BlockMath key={`b-${i}`} math={autoLatex(bp.trim())} />);
    } else {
      // Inline $…$
      const inlineSplit = bp.split(/\$([^$]+)\$/g);
      inlineSplit.forEach((ip, j) => {
        if (j % 2 === 1) {
          out.push(<InlineMath key={`i-${i}-${j}`} math={autoLatex(ip.trim())} />);
        } else if (ip) {
          out.push(<span key={`t-${i}-${j}`}>{ip}</span>);
        }
      });
    }
  });
  return out;
}

/* =========================================================
   TTS (Web Speech Synthesis)
   ========================================================= */
function speak(text: string, lang = 'es-ES') {
  if (typeof window === 'undefined') return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* no-op */
  }
}

/* =========================================================
   Reconocimiento de voz (shim seguro para build)
   ========================================================= */

// No tipamos contra SpeechRecognition para que no falle la build
type SR = (any & { _restarts?: number }) | null;

function getSpeechRecognition(): SR {
  if (typeof window === 'undefined') return null;
  const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/* =========================================================
   Tipos y helpers de chat
   ========================================================= */

type Role = 'user' | 'assistant';

type ChatMessage = {
  role: Role;
  text: string;
};

type Step = {
  text: string;
  imageUrl?: string | null;
};

type ChatResponse = {
  steps?: Step[];
  reply?: string | null;
};

function toHistory(messages: ChatMessage[]) {
  // Lo que espera tu backend (role, text)
  return messages.map(m => ({ role: m.role, text: m.text }));
}

/* =========================================================
   Página
   ========================================================= */

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [autoVoice, setAutoVoice] = useState(true);
  const [micOn, setMicOn] = useState(false);

  const srRef = useRef<SR>(null);
  const startedOnce = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Arranque/parada del micro
  useEffect(() => {
    if (!micOn) {
      try {
        (srRef.current as any)?.stop?.();
      } catch {}
      return;
    }
    if (!startedOnce.current) return; // requiere gesto previo
    if (!srRef.current) {
      const sr = getSpeechRecognition();
      if (sr) {
        sr.lang = 'es-ES';
        sr.interimResults = false;
        sr.continuous = false;
        sr.onresult = (e: any) => {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          if (transcript) {
            setInput(transcript);
            // Envía automáticamente tras dictar
            setTimeout(() => handleSend(transcript), 200);
          }
        };
        sr.onerror = () => {
          // reintento simple
          sr._restarts = (sr._restarts || 0) + 1;
          if (sr._restarts < 2) {
            try {
              sr.stop();
              sr.start();
            } catch {}
          }
        };
        sr.onend = () => {
          if (micOn) {
            try { sr.start(); } catch {}
          }
        };
        srRef.current = sr as SR;
      }
    }
    try {
      (srRef.current as any)?.start?.();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn]);

  // Reproducir la última respuesta si autoVoice está activo
  useEffect(() => {
    if (!autoVoice) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (last?.text) {
      const plain = last.text.replace(/\$\$?[^$]+\$?\$/g, ''); // quita LaTeX para TTS
      speak(plain);
    }
  }, [messages, autoVoice]);

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
        const msg = `Ups… no pude responder ahora mismo. HTTP ${res.status}`;
        setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
      } else {
        const data = (await res.json()) as ChatResponse;

        if (data.steps && data.steps.length) {
          // Muestra todas las pistas / pasos devueltos por el backend
          setMessages(prev => [
            ...prev,
            ...data.steps!.map(s => ({ role: 'assistant' as Role, text: s.text })),
          ]);
        } else if (data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', text: data.reply! }]);
        } else {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', text: 'No pude generar pistas esta vez.' },
          ]);
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Error de red. ¿Puedes intentarlo de nuevo?' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Primer gesto del usuario: habilita TTS/mic
  function primeAudio() {
    startedOnce.current = true;
    if (autoVoice) {
      try { speak('Hola, ¿en qué te ayudo?'); } catch {}
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-24">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tutorín</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoVoice}
                onChange={e => setAutoVoice(e.target.checked)}
              />
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

        {/* Estado API (solo decorativo) */}
        <p className="text-sm text-green-600 mb-4">Estado API: <strong>OK</strong> ✅</p>

        {/* Chat */}
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
                m.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-white border'
              }`}
            >
              <div className="prose prose-slate max-w-none">
                {renderWithMath(m.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="mr-auto bg-white border p-3 rounded-2xl text-slate-500">
              Pensando…
            </div>
          )}
        </div>

        {/* Input */}
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
      </div>
    </main>
  );
}
