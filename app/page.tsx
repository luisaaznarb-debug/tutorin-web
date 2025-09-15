'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// -------------- Tipos ----------------
type Role = 'user' | 'assistant';

type ChatMessage = {
  role: Role;
  text: string;
  imageUrl?: string;
};

type Step = {
  text: string;
  imageUrl?: string | null;
};

type ChatResponse = {
  steps?: Step[];
  reply?: string | null;
};

// -------------- Utiles KaTeX ----------------
// Convierte un texto con $$...$$ (bloque) y $...$ (inline) en nodos React con KaTeX
function renderWithMath(text: string): React.ReactNode[] {
  // Cortamos por bloques $$...$$
  const blockParts = text.split(/(\$\$[^$]+\$\$)/g);
  const out: React.ReactNode[] = [];

  blockParts.forEach((chunk, i) => {
    if (i % 2 === 1) {
      // Bloque $$...$$
      const math = chunk.slice(2, -2).trim();
      out.push(<BlockMath key={`bm-${i}`} math={math} />);
    } else {
      // Dentro del trozo "normal", buscamos inline $...$
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      inlines.forEach((ip, j) => {
        if (j % 2 === 1) {
          const m = ip.slice(1, -1).trim();
          out.push(<InlineMath key={`im-${i}-${j}`} math={m} />);
        } else if (ip) {
          out.push(<span key={`tx-${i}-${j}`}>{ip}</span>);
        }
      });
    }
  });

  return out;
}

// Quita marcas LaTeX para voz
function stripTexForTTS(s: string): string {
  return s.replace(/\$\$[^$]+\$\$/g, ' ')
          .replace(/\$[^$]+\$/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
}

// -------------- Componente principal ----------------
export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  const SOLVE_PATH = process.env.NEXT_PUBLIC_BACKEND_SOLVE_PATH ?? '/api/solve';
  const SOLVE_URL = `${BACKEND}${SOLVE_PATH}`;

  useEffect(() => {
    // scroll al final
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // TTS simple con SpeechSynthesis
  function speak(text: string) {
    try {
      if (!autoVoice) return;
      const utt = new SpeechSynthesisUtterance(stripTexForTTS(text));
      utt.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    } catch {
      // sin bloquear ui si no hay voz
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const userText = input.trim();
    if (!userText || loading) return;

    // pinta el mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(SOLVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          grade: 'Primaria',
          history: messages.slice(-10) // opcional
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }

      const data: ChatResponse = await res.json();

      if (data.steps && data.steps.length > 0) {
        const assistantMsgs: ChatMessage[] = data.steps.map((s) => ({
          role: 'assistant',
          text: s.text ?? '',
        }));
        setMessages(prev => [...prev, ...assistantMsgs]);
        // lee únicamente la primera pista para evitar “bucle”
        speak(assistantMsgs[0].text);
      } else if (typeof data.reply === 'string' && data.reply.trim().length > 0) {
        const reply = data.reply;
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        speak(reply);
      } else {
        // respuesta vacía
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'No tengo una pista para eso todavía 😅' },
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Ups… no pude responder ahora mismo. ${err?.message ?? ''}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold mb-3">Tutorín</h1>

      {/* estado de API (simple ping) */}
      <ApiStatus url={BACKEND ? `${BACKEND}/ping` : '/api/health'} />

      <div className="border rounded-xl bg-white">
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 ${
                m.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-100'
              }`}
            >
              {m.role === 'assistant' ? renderWithMath(m.text) : m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu ejercicio y pulsa Enter"
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Pensando…' : 'Enviar'}
          </button>
          <label className="ml-3 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoVoice}
              onChange={(e) => setAutoVoice(e.target.checked)}
            />
            Voz auto
          </label>
        </form>
      </div>
    </main>
  );
}

// --------- Componente pequeño para mostrar estado de backend ----------
function ApiStatus({ url }: { url: string }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        setOk(!cancelled && res.ok);
      } catch {
        setOk(false);
      }
    }
    ping();
    // refresco simple al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <p className="mb-4 text-sm">
      Estado API:{' '}
      {ok === null ? (
        <span>…</span>
      ) : ok ? (
        <span className="text-green-600 font-semibold">OK ✅</span>
      ) : (
        <span className="text-red-600 font-semibold">No conecta ❌</span>
      )}
    </p>
  );
}
